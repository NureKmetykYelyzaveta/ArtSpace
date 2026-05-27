from fastapi import APIRouter, HTTPException
from database.db import db
from bson import ObjectId

router = APIRouter()


def serialize_comment(comment):
    comment["_id"] = str(comment["_id"])

    if "postId" in comment and isinstance(comment["postId"], ObjectId):
        comment["postId"] = str(comment["postId"])

    if "userId" in comment and isinstance(comment["userId"], ObjectId):
        comment["userId"] = str(comment["userId"])

    return comment


@router.post("/")
async def create_comment(comment: dict):
    required_fields = ["postId", "userId", "userNick", "text"]

    for field in required_fields:
        if not comment.get(field):
            raise HTTPException(status_code=400, detail=f"Поле '{field}' обов'язкове")

    post = await db.posts.find_one({"_id": ObjectId(comment["postId"])})
    if not post:
        raise HTTPException(status_code=404, detail="Пост не знайдено")

    new_comment = {
        "postId": ObjectId(comment["postId"]),
        "userId": ObjectId(comment["userId"]),
        "userNick": comment["userNick"],
        "userAvatar": comment.get("userAvatar", ""),
        "text": comment["text"],
        "createdAt": comment.get("createdAt", "")
    }

    result = await db.comments.insert_one(new_comment)
    created_comment = await db.comments.find_one({"_id": result.inserted_id})

    return serialize_comment(created_comment)


@router.get("/post/{post_id}")
async def get_comments_by_post(post_id: str):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Пост не знайдено")

    comments = []
    async for comment in db.comments.find({"postId": ObjectId(post_id)}).sort("_id", -1):
        comments.append(serialize_comment(comment))

    return comments


@router.delete("/{comment_id}")
async def delete_comment(comment_id: str):
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})

    if not comment:
        raise HTTPException(status_code=404, detail="Коментар не знайдено")

    await db.comments.delete_one({"_id": ObjectId(comment_id)})
    return {"message": "Коментар видалено"}