from fastapi import APIRouter, HTTPException
from database.db import db
from bson import ObjectId
from datetime import datetime, timedelta, timezone

router = APIRouter()

def serialize_user(user):
    user["_id"] = str(user["_id"])

    
    followers = user.get("followers") or []
    user["followers"] = [
        str(f) for f in followers if f is not None
    ]

    
    following = user.get("following") or []
    user["following"] = [
        str(f) for f in following if f is not None
    ]

   
    last_seen = user.get("lastSeen")

    if isinstance(last_seen, datetime):
        # якщо без timezone → додаємо UTC
        if last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)

        user["lastSeen"] = last_seen.isoformat()
    else:
        user["lastSeen"] = None

    
    now = datetime.now(timezone.utc)

    if isinstance(last_seen, datetime):
        is_online = (
            user.get("isOnline", False) and
            now - last_seen < timedelta(seconds=45)
        )
    else:
        is_online = False

    user["isOnline"] = is_online

    return user

@router.post("/register")
async def register(user: dict):
    existing_email = await db.users.find_one({"email": user["email"]})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email вже існує")

    existing_nick = await db.users.find_one({"profile.nick": user["profile"]["nick"]})
    if existing_nick:
        raise HTTPException(status_code=400, detail="Нік вже зайнятий")

    user.setdefault("followers", [])
    user.setdefault("following", [])
    user.setdefault("isOnline", False)
    user.setdefault("lastSeen", datetime.now(timezone.utc))

    result = await db.users.insert_one(user)

    created_user = await db.users.find_one({"_id": result.inserted_id})
    return serialize_user(created_user)


@router.post("/login")
async def login(data: dict):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email і пароль обов'язкові")

    user = await db.users.find_one({"email": email})

    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Невірний email або пароль")

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "isOnline": True,
                "lastSeen": datetime.now(timezone.utc)
            }
        }
    )

    updated_user = await db.users.find_one({"_id": user["_id"]})
    if not updated_user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
    return serialize_user(updated_user)

@router.get("/search/{query}")
async def search_users(query: str):
    users = []
    cursor = db.users.find({
        "$or": [
            {"name": {"$regex": query, "$options": "i"}},
            {"profile.nick": {"$regex": query, "$options": "i"}}
        ]
    })

    async for user in cursor:
        users.append(serialize_user(user))

    return users

@router.get("/{user_id}")
async def get_user_by_id(user_id: str):
    try:
        object_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Невірний ID користувача")

    user = await db.users.find_one({"_id": object_id})

    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    return serialize_user(user)


@router.put("/{user_id}")
async def update_user(user_id: str, data: dict):
    try:
        object_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Невірний ID користувача")

    user = await db.users.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    update_data = {}

    if "name" in data:
        update_data["name"] = data["name"]

    if "nick" in data:
        existing_nick = await db.users.find_one({
            "profile.nick": data["nick"],
            "_id": {"$ne": object_id}
        })
        if existing_nick:
            raise HTTPException(status_code=400, detail="Нік вже зайнятий")

        update_data["profile.nick"] = data["nick"]

    if "bio" in data:
        update_data["profile.bio"] = data["bio"]

    if "avatar" in data:
        update_data["profile.avatar"] = data["avatar"]

    if update_data:
        await db.users.update_one(
            {"_id": object_id},
            {"$set": update_data}
        )

    updated_user = await db.users.find_one({"_id": object_id})
    return serialize_user(updated_user)

@router.patch("/{user_id}/follow")
async def toggle_follow(user_id: str, data: dict):
    current_user_id = data.get("currentUserId")

    if not current_user_id:
        raise HTTPException(status_code=400, detail="currentUserId обов'язковий")

    try:
        target_id = ObjectId(user_id)
        current_id = ObjectId(current_user_id)
    except:
        raise HTTPException(status_code=400, detail="Невірний ID")

    if str(target_id) == str(current_id):
        raise HTTPException(status_code=400, detail="Не можна підписатися на себе")

    target_user = await db.users.find_one({"_id": target_id})
    current_user = await db.users.find_one({"_id": current_id})

    if not target_user or not current_user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    target_followers = target_user.get("followers", [])
    is_following = any(str(f) == str(current_id) for f in target_followers)

    if is_following:
        await db.users.update_one(
            {"_id": target_id},
            {"$pull": {"followers": current_id}}
        )
        await db.users.update_one(
            {"_id": current_id},
            {"$pull": {"following": target_id}}
        )
    else:
        await db.users.update_one(
            {"_id": target_id},
            {"$addToSet": {"followers": current_id}}
        )
        await db.users.update_one(
            {"_id": current_id},
            {"$addToSet": {"following": target_id}}
        )

    updated_target_user = await db.users.find_one({"_id": target_id})
    return serialize_user(updated_target_user)

@router.patch("/{user_id}/heartbeat")
async def heartbeat(user_id: str):
    try:
        object_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Невірний ID користувача")

    await db.users.update_one(
        {"_id": object_id},
        {
            "$set": {
                "isOnline": True,
                "lastSeen": datetime.now(timezone.utc)
            }
        }
    )

    user = await db.users.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    return serialize_user(user)


@router.patch("/{user_id}/offline")
async def set_offline(user_id: str):
    try:
        object_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Невірний ID користувача")

    await db.users.update_one(
        {"_id": object_id},
        {
            "$set": {
                "isOnline": False,
                "lastSeen": datetime.now(timezone.utc)
            }
        }
    )

    user = await db.users.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    return serialize_user(user)


