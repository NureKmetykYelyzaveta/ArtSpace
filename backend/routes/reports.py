from fastapi import APIRouter, HTTPException
from database.db import db
from bson import ObjectId
from datetime import datetime

router = APIRouter()


def serialize_report(report):
    report["_id"] = str(report["_id"])

    if "postId" in report and isinstance(report["postId"], ObjectId):
        report["postId"] = str(report["postId"])

    if "userId" in report and isinstance(report["userId"], ObjectId):
        report["userId"] = str(report["userId"])

    return report


@router.post("/")
async def create_report(report: dict):
    required_fields = ["postId", "userId", "reason"]

    for field in required_fields:
        if not report.get(field):
            raise HTTPException(
                status_code=400,
                detail=f"Поле '{field}' обов'язкове"
            )

    post = await db.posts.find_one({
        "_id": ObjectId(report["postId"])
    })

    if not post:
        raise HTTPException(
            status_code=404,
            detail="Пост не знайдено"
        )

    existing_report = await db.reports.find_one({
        "postId": ObjectId(report["postId"]),
        "userId": ObjectId(report["userId"])
    })

    if existing_report:
        raise HTTPException(
            status_code=400,
            detail="Ти вже скаржився на цей пост"
        )

    new_report = {
        "postId": ObjectId(report["postId"]),
        "userId": ObjectId(report["userId"]),
        "reason": report["reason"],
        "status": "pending",
        "createdAt": datetime.utcnow().isoformat()
    }

    result = await db.reports.insert_one(new_report)

    created_report = await db.reports.find_one({
        "_id": result.inserted_id
    })

    return serialize_report(created_report)


@router.get("/")
async def get_all_reports():
    reports = []

    async for report in db.reports.find().sort("_id", -1):

        post = await db.posts.find_one({
            "_id": report["postId"]
        })

        user = await db.users.find_one({
            "_id": report["userId"]
        })

        serialized = serialize_report(report)

        serialized["post"] = {
            "title": post.get("title", ""),
            "image": post.get("image", ""),
            "authorNick": post.get("authorNick", "")
        } if post else None

        serialized["reportedBy"] = {
            "nick": user.get("profile", {}).get("nick", "")
        } if user else None

        reports.append(serialized)

    return reports


@router.patch("/{report_id}/approve")
async def approve_report(report_id: str):
    report = await db.reports.find_one({
        "_id": ObjectId(report_id)
    })

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Скаргу не знайдено"
        )

    await db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {
            "$set": {
                "status": "approved"
            }
        }
    )

    await db.posts.update_one(
        {"_id": report["postId"]},
        {
            "$set": {
                "isHidden": True
            }
        }
    )

    updated_report = await db.reports.find_one({
        "_id": ObjectId(report_id)
    })

    return serialize_report(updated_report)


@router.patch("/{report_id}/reject")
async def reject_report(report_id: str):
    report = await db.reports.find_one({
        "_id": ObjectId(report_id)
    })

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Скаргу не знайдено"
        )

    await db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {
            "$set": {
                "status": "rejected"
            }
        }
    )

    updated_report = await db.reports.find_one({
        "_id": ObjectId(report_id)
    })

    return serialize_report(updated_report)


@router.delete("/{report_id}")
async def delete_report(report_id: str):
    report = await db.reports.find_one({
        "_id": ObjectId(report_id)
    })

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Скаргу не знайдено"
        )

    await db.reports.delete_one({
        "_id": ObjectId(report_id)
    })

    return {
        "message": "Скаргу видалено"
    }