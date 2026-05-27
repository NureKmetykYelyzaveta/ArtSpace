from fastapi import APIRouter, HTTPException
from database.db import db
from bson import ObjectId

router = APIRouter()


def serialize_post(post):
    post["_id"] = str(post["_id"])

    if "authorId" in post and isinstance(post["authorId"], ObjectId):
        post["authorId"] = str(post["authorId"])

    if "likedBy" in post:
        post["likedBy"] = [str(user_id) for user_id in post["likedBy"]]

    if "savedBy" in post:
        post["savedBy"] = [str(user_id) for user_id in post["savedBy"]]

    return post


@router.post("/")
async def create_post(post: dict):
    required_fields = ["title", "authorId", "authorNick", "image"]

    for field in required_fields:
        if not post.get(field):
            raise HTTPException(status_code=400, detail=f"Поле '{field}' обов'язкове")
        new_post = {
            "title": post["title"],
            "authorId": ObjectId(post["authorId"]),
            "authorNick": post["authorNick"],
            "category": post.get("category", ""),
            "tags": post.get("tags", []),
            "image": post["image"],
            "likes": 0,
            "likedBy": [],
            "savedBy": [],
            "createdAt": post.get("createdAt", ""),
            "isHidden": False
}
        if post.get("challengeId"):
            new_post["challengeId"] = post["challengeId"]

    result = await db.posts.insert_one(new_post)
    created_post = await db.posts.find_one({"_id": result.inserted_id})

    return serialize_post(created_post)


@router.get("/")
async def get_all_posts():
    posts = []

    async for post in db.posts.find({
        "isHidden": {
            "$ne": True
            }
            }).sort("_id", -1):
        comments_count = await db.comments.count_documents({"postId": post["_id"]})
        serialized_post = serialize_post(post)
        serialized_post["commentsCount"] = comments_count
        posts.append(serialized_post)

    return posts

@router.get("/author/{author_id}")
async def get_posts_by_author(author_id: str):
    posts = []

    async for post in db.posts.find({
        "authorId": ObjectId(author_id),
        "isHidden": {
            "$ne": True
            }
            }).sort("_id", -1):
        comments_count = await db.comments.count_documents({"postId": post["_id"]})
        serialized_post = serialize_post(post)
        serialized_post["commentsCount"] = comments_count
        posts.append(serialized_post)

    return posts

@router.put("/{post_id}")
async def update_post(post_id: str, data: dict):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})

    if not post:
        raise HTTPException(status_code=404, detail="Пост не знайдено")

    update_data = {}

    if "title" in data:
        update_data["title"] = data["title"]
    if "category" in data:
        update_data["category"] = data["category"]
    if "tags" in data:
        update_data["tags"] = data["tags"]

    if update_data:
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$set": update_data}
        )

    updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return serialize_post(updated_post)


@router.delete("/{post_id}")
async def delete_post(post_id: str):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})

    if not post:
        raise HTTPException(status_code=404, detail="Пост не знайдено")

    await db.posts.delete_one({"_id": ObjectId(post_id)})
    return {"message": "Пост видалено"}


@router.patch("/{post_id}/like")
async def toggle_like(post_id: str, data: dict):
    user_id = data.get("userId")

    if not user_id:
        raise HTTPException(status_code=400, detail="userId обов'язковий")

    post = await db.posts.find_one({"_id": ObjectId(post_id)})

    if not post:
        raise HTTPException(status_code=404, detail="Пост не знайдено")

    user_object_id = ObjectId(user_id)
    liked_by = post.get("likedBy", [])

    already_liked = any(str(item) == str(user_object_id) for item in liked_by)

    if already_liked:
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {
                "$pull": {"likedBy": user_object_id},
                "$inc": {"likes": -1}
            }
        )
    else:
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {
                "$push": {"likedBy": user_object_id},
                "$inc": {"likes": 1}
            }
        )

    updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return serialize_post(updated_post)


@router.patch("/{post_id}/save")
async def toggle_save(post_id: str, data: dict):
    user_id = data.get("userId")

    if not user_id:
        raise HTTPException(status_code=400, detail="userId обов'язковий")

    post = await db.posts.find_one({"_id": ObjectId(post_id)})

    if not post:
        raise HTTPException(status_code=404, detail="Пост не знайдено")

    user_object_id = ObjectId(user_id)
    saved_by = post.get("savedBy", [])

    already_saved = any(str(item) == str(user_object_id) for item in saved_by)

    if already_saved:
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$pull": {"savedBy": user_object_id}}
        )
    else:
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$push": {"savedBy": user_object_id}}
        )

    updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return serialize_post(updated_post)


@router.get("/search/{query}")
async def search_posts(query: str):
    posts = []

    async for post in db.posts.find({
    "$and": [
        {
            "isHidden": {
                "$ne": True
            }
        },
        {
            "$or": [
                {"authorNick": {"$regex": query, "$options": "i"}},
                {"title": {"$regex": query, "$options": "i"}},
                {"category": {"$regex": query, "$options": "i"}},
                {"tags": {"$elemMatch": {"$regex": query, "$options": "i"}}}
            ]
        }
    ]
}).sort("_id", -1):
        comments_count = await db.comments.count_documents({"postId": post["_id"]})
        serialized_post = serialize_post(post)
        serialized_post["commentsCount"] = comments_count
        posts.append(serialized_post)

    return posts

@router.get("/challenge/{challenge_id}")
async def get_challenge_posts(challenge_id: str):
    posts = []

    async for post in db.posts.find({
        "challengeId": challenge_id,
        "isHidden": {
            "$ne": True
        }
    }).sort("_id", -1):

        comments_count = await db.comments.count_documents({
            "postId": post["_id"]
        })

        serialized_post = serialize_post(post)
        serialized_post["commentsCount"] = comments_count

        posts.append(serialized_post)

    return posts