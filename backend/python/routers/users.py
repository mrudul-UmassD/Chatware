from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body, File, UploadFile, Form
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from pymongo import ReturnDocument
from datetime import datetime, timedelta
import os
import uuid
from auth.auth_bearer import JWTBearer
from auth.auth_handler import verify_token
from db.mongodb import get_collection
from models.user import User, UserBase, Status

router = APIRouter()

@router.get("/sync", dependencies=[Depends(JWTBearer())])
async def sync_users_from_node(token: str = Depends(JWTBearer())):
    """
    Sync users from Node.js backend MongoDB collection
    Only available to super-admin users
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Verify super-admin privileges
    users_collection = get_collection("users")
    user = users_collection.find_one({"_id": user_id})
    
    if not user or user.get("role") != "super-admin":
        raise HTTPException(status_code=403, detail="Access denied: Super-admin privileges required")
    
    # Get all users from MongoDB (already synced with Node.js backend)
    all_users = list(users_collection.find({}))
    
    # Map MongoDB user documents to User model
    users = []
    for user_doc in all_users:
        try:
            # Convert MongoDB _id field to id for Pydantic model
            user_doc["id"] = str(user_doc["_id"])
            # Remove _id field as it's not part of our Pydantic model
            del user_doc["_id"]
            
            # Add to validated users list
            users.append(user_doc)
        except Exception as e:
            print(f"Error processing user {user_doc.get('_id')}: {e}")
    
    return {
        "success": True,
        "message": "Users synced successfully",
        "count": len(users),
        "users": users
    }

@router.get("/online", dependencies=[Depends(JWTBearer())])
async def get_online_users(token: str = Depends(JWTBearer())):
    """
    Get a list of currently online users
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Get online users from MongoDB
    users_collection = get_collection("users")
    online_users = list(users_collection.find({"status": "online"}, {
        "password": 0,
        "resetPasswordToken": 0,
        "resetPasswordExpire": 0
    }))
    
    # Format user data
    formatted_users = []
    for user in online_users:
        user["id"] = str(user["_id"])
        del user["_id"]
        formatted_users.append(user)
    
    return {
        "success": True,
        "count": len(formatted_users),
        "users": formatted_users
    }

@router.put("/status", dependencies=[Depends(JWTBearer())])
async def update_user_status(
    status: Status,
    token: str = Depends(JWTBearer())
):
    """
    Update the current user's status
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Update user status in MongoDB
    users_collection = get_collection("users")
    updated_user = users_collection.find_one_and_update(
        {"_id": user_id},
        {
            "$set": {
                "status": status,
                "lastSeen": datetime.now()
            }
        },
        return_document=ReturnDocument.AFTER,
        projection={
            "password": 0,
            "resetPasswordToken": 0,
            "resetPasswordExpire": 0
        }
    )
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Format user data
    updated_user["id"] = str(updated_user["_id"])
    del updated_user["_id"]
    
    return {
        "success": True,
        "message": f"Status updated to {status}",
        "user": updated_user
    }

@router.post("/avatar", dependencies=[Depends(JWTBearer())])
async def upload_avatar(
    file: UploadFile = File(...),
    token: str = Depends(JWTBearer())
):
    """
    Upload a new avatar for the current user
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Verify user exists
    users_collection = get_collection("users")
    user = users_collection.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Get file extension
    file_ext = os.path.splitext(file.filename)[1]
    if not file_ext:
        file_ext = ".jpg"  # Default to jpg if no extension
    
    # Create unique filename
    filename = f"avatar_{user_id}_{uuid.uuid4().hex}{file_ext}"
    file_path = f"uploads/avatars/{filename}"
    
    # Create directory if it doesn't exist
    os.makedirs("uploads/avatars", exist_ok=True)
    
    # Save the file
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Update user profile in MongoDB
    updated_user = users_collection.find_one_and_update(
        {"_id": user_id},
        {"$set": {"profilePic": filename}},
        return_document=ReturnDocument.AFTER,
        projection={
            "password": 0,
            "resetPasswordToken": 0,
            "resetPasswordExpire": 0
        }
    )
    
    # Format user data
    updated_user["id"] = str(updated_user["_id"])
    del updated_user["_id"]
    
    return {
        "success": True,
        "message": "Avatar uploaded successfully",
        "user": updated_user,
        "avatarUrl": f"/uploads/avatars/{filename}"
    }

@router.get("/search", dependencies=[Depends(JWTBearer())])
async def search_users(
    query: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    token: str = Depends(JWTBearer())
):
    """
    Search for users by name or email
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Search for users in MongoDB
    users_collection = get_collection("users")
    users = list(users_collection.find(
        {
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}}
            ],
            "_id": {"$ne": user_id}  # Exclude current user
        },
        {
            "password": 0,
            "resetPasswordToken": 0,
            "resetPasswordExpire": 0
        }
    ).limit(limit))
    
    # Format user data
    formatted_users = []
    for user in users:
        user["id"] = str(user["_id"])
        del user["_id"]
        formatted_users.append(user)
    
    return {
        "success": True,
        "count": len(formatted_users),
        "users": formatted_users
    } 