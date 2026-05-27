from fastapi import APIRouter, HTTPException
from database.db import db
from bson import ObjectId
from datetime import datetime, timezone, timedelta

router = APIRouter()


def serialize_challenge(challenge):
    challenge["_id"] = str(challenge["_id"])

    if "participants" in challenge:
        challenge["participants"] = [
            str(user_id) for user_id in challenge["participants"]
        ]

    return challenge


async def enrich_challenge(challenge):
    if not challenge:
        return None

    challenge_id = str(challenge["_id"])

    participants_count = len(
        challenge.get("participants", [])
    )

    works_count = await db.posts.count_documents({
        "challengeId": challenge_id,
        "isHidden": {
            "$ne": True
        }
    })

    challenge["participantsCount"] = participants_count
    challenge["worksCount"] = works_count

    return serialize_challenge(challenge)


@router.get("/active")
async def get_active_challenge():
    challenge = await db.challenges.find_one({
        "isActive": True
    })

    if not challenge:
        raise HTTPException(
            status_code=404,
            detail="Активний челендж не знайдено"
        )

    return await enrich_challenge(challenge)


@router.post("/admin/activate")
async def activate_challenge(data: dict):
    title = data.get("title")
    description = data.get("description")

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Тема челенджу обов'язкова"
        )

    if not description:
        raise HTTPException(
            status_code=400,
            detail="Опис челенджу обов'язковий"
        )

    await db.challenges.update_many(
        {
            "isActive": True
        },
        {
            "$set": {
                "isActive": False,
                "finishedAt": datetime.now(timezone.utc).isoformat()
            }
        }
    )

    now = datetime.now(timezone.utc)
    ends_at = now + timedelta(days=1)
    new_challenge = {
    "title": title,
    "description": description,
    "isActive": True,
    "participants": [],
    "createdAt": now.isoformat(),
    "endsAt": ends_at.isoformat(),
    "finishedAt": None
}

    result = await db.challenges.insert_one(
        new_challenge
    )

    challenge = await db.challenges.find_one({
        "_id": result.inserted_id
    })

    return await enrich_challenge(challenge)


@router.patch("/admin/{challenge_id}/finish")
async def finish_challenge(challenge_id: str):
    try:
        challenge_object_id = ObjectId(challenge_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Некоректний challenge_id"
        )

    challenge = await db.challenges.find_one({
        "_id": challenge_object_id
    })

    if not challenge:
        raise HTTPException(
            status_code=404,
            detail="Челендж не знайдено"
        )

    await db.challenges.update_one(
        {
            "_id": challenge_object_id
        },
        {
            "$set": {
                "isActive": False,
                "finishedAt": datetime.now(timezone.utc).isoformat()
            }
        }
    )

    return {
        "message": "Челендж завершено"
    }


@router.post("/{challenge_id}/join")
async def join_challenge(challenge_id: str, data: dict):
    user_id = data.get("userId")

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="userId обов'язковий"
        )

    try:
        challenge_object_id = ObjectId(challenge_id)
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Некоректний challengeId або userId"
        )

    challenge = await db.challenges.find_one({
        "_id": challenge_object_id,
        "isActive": True
    })

    if not challenge:
        raise HTTPException(
            status_code=404,
            detail="Активний челендж не знайдено"
        )

    participants = challenge.get("participants", [])

    already_joined = any(
        str(item) == str(user_object_id)
        for item in participants
    )

    if already_joined:
        raise HTTPException(
            status_code=400,
            detail="Already joined"
        )

    await db.challenges.update_one(
        {
            "_id": challenge_object_id
        },
        {
            "$push": {
                "participants": user_object_id
            }
        }
    )

    updated_challenge = await db.challenges.find_one({
        "_id": challenge_object_id
    })

    return await enrich_challenge(updated_challenge)