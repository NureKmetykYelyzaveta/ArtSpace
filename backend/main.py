from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import db
from routes import users, posts, comments, reports, messages
from routes import challenges

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(
    challenges.router,
    prefix="/api/challenges",
    tags=["Challenges"]
)

app.include_router(users.router, prefix="/api/users")
app.include_router(posts.router, prefix="/api/posts")
app.include_router(comments.router, prefix="/api/comments")
app.include_router(reports.router, prefix="/api/reports")
app.include_router(messages.router, prefix="/api/messages")


@app.get("/")
def root():
    return {"message": "ArtSpace API працює"}


@app.get("/test-db")
async def test_db():
    collections = await db.list_collection_names()
    return {
        "message": "MongoDB підключено",
        "collections": collections
    }