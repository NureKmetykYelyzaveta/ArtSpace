from fastapi import APIRouter, HTTPException
from database.db import db
from bson import ObjectId
from datetime import datetime, timezone, timedelta

router = APIRouter()


def make_conversation_id(user1: str, user2: str) -> str:
    ids = sorted([user1, user2])
    return f"{ids[0]}_{ids[1]}"


def serialize_message(message):
    message["_id"] = str(message["_id"])

    if "senderId" in message and isinstance(message["senderId"], ObjectId):
        message["senderId"] = str(message["senderId"])

    if "receiverId" in message and isinstance(message["receiverId"], ObjectId):
        message["receiverId"] = str(message["receiverId"])

    return message


@router.post("/")
async def send_message(data: dict):
    sender_id = data.get("senderId")
    receiver_id = data.get("receiverId")
    text = data.get("text", "").strip()

    if not sender_id or not receiver_id or not text:
        raise HTTPException(status_code=400, detail="senderId, receiverId і text обов'язкові")

    try:
        sender_object_id = ObjectId(sender_id)
        receiver_object_id = ObjectId(receiver_id)
    except:
        raise HTTPException(status_code=400, detail="Невірний ID")

    sender = await db.users.find_one({"_id": sender_object_id})
    receiver = await db.users.find_one({"_id": receiver_object_id})

    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    conversation_id = make_conversation_id(sender_id, receiver_id)

    message = {
        "conversationId": conversation_id,
        "senderId": sender_object_id,
        "receiverId": receiver_object_id,
        "text": text,
        "createdAt": data.get("createdAt")
    }

    result = await db.messages.insert_one(message)
    created_message = await db.messages.find_one({"_id": result.inserted_id})

    return serialize_message(created_message)


@router.get("/conversation/{user1_id}/{user2_id}")
async def get_conversation(user1_id: str, user2_id: str):
    conversation_id = make_conversation_id(user1_id, user2_id)

    messages = []
    async for message in db.messages.find({"conversationId": conversation_id}).sort("_id", 1):
        messages.append(serialize_message(message))

    return messages


@router.get("/list/{user_id}")
async def get_user_chats(user_id: str):
    try:
        user_object_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Невірний ID користувача")

    user = await db.users.find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    messages = []
    async for message in db.messages.find({
        "$or": [
            {"senderId": user_object_id},
            {"receiverId": user_object_id}
        ]
    }).sort("_id", -1):
        messages.append(message)

    seen = set()
    chats = []

    for message in messages:
        sender_id = str(message["senderId"])
        receiver_id = str(message["receiverId"])

        other_user_id = receiver_id if sender_id == user_id else sender_id

        if other_user_id in seen:
            continue

        seen.add(other_user_id)

        other_user = await db.users.find_one({"_id": ObjectId(other_user_id)})
        if not other_user:
            continue

        chats.append({
            "userId": other_user_id,
            "name": other_user.get("name", ""),
            "nick": other_user.get("profile", {}).get("nick", ""),
            "avatar": other_user.get("profile", {}).get("avatar", ""),
            "lastMessage": message.get("text", ""),
            "createdAt": message.get("createdAt", "")
        })

    return chats

@router.patch("/typing")
async def set_typing(data: dict):
    user_id = data.get("userId")
    other_user_id = data.get("otherUserId")
    is_typing = data.get("isTyping", False)

    if not user_id or not other_user_id:
        raise HTTPException(status_code=400, detail="userId і otherUserId обов'язкові")

    conversation_id = make_conversation_id(user_id, other_user_id)

    await db.typing_status.update_one(
        {
            "conversationId": conversation_id,
            "userId": user_id
        },
        {
            "$set": {
                "conversationId": conversation_id,
                "userId": user_id,
                "otherUserId": other_user_id,
                "isTyping": is_typing,
                "updatedAt": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )

    return {"ok": True}


@router.get("/typing/{user1_id}/{user2_id}")
async def get_typing(user1_id: str, user2_id: str):
    conversation_id = make_conversation_id(user1_id, user2_id)

    typing_doc = await db.typing_status.find_one({
        "conversationId": conversation_id,
        "userId": user2_id
    })

    if not typing_doc:
        return {"isTyping": False}

    updated_at = typing_doc.get("updatedAt")
    is_typing = typing_doc.get("isTyping", False)

    if not updated_at or datetime.now(timezone.utc) - updated_at > timedelta(seconds=4):
        return {"isTyping": False}

    return {"isTyping": is_typing}