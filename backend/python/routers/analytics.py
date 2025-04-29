from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
from auth.auth_bearer import JWTBearer
from auth.auth_handler import verify_token
from db.mongodb import get_collection

router = APIRouter()

@router.get("/user-activity", dependencies=[Depends(JWTBearer())])
async def get_user_activity(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    token: str = Depends(JWTBearer())
):
    """
    Get user activity statistics
    Only available to admin and super-admin users
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Verify admin privileges
    users_collection = get_collection("users")
    user = users_collection.find_one({"_id": user_id})
    
    if not user or user.get("role") not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Access denied: Admin privileges required")
    
    # Parse dates
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    else:
        start = today - timedelta(days=30)
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)  # Include the end date
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    else:
        end = today + timedelta(days=1)
    
    # Get message stats
    messages_collection = get_collection("messages")
    message_query = {
        "createdAt": {"$gte": start, "$lt": end}
    }
    
    # Calculate daily message counts
    daily_messages = list(messages_collection.aggregate([
        {"$match": message_query},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]))
    
    # Get user login stats
    # Note: This assumes you have a log collection tracking user logins
    logs_collection = get_collection("logs")
    login_query = {
        "action": "login",
        "timestamp": {"$gte": start, "$lt": end}
    }
    
    daily_logins = list(logs_collection.aggregate([
        {"$match": login_query},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]))
    
    # Get active user count (users who sent at least one message)
    active_users = list(messages_collection.aggregate([
        {"$match": message_query},
        {"$group": {
            "_id": "$sender",
            "messageCount": {"$sum": 1}
        }},
        {"$count": "activeUsers"}
    ]))
    
    active_user_count = active_users[0]["activeUsers"] if active_users else 0
    
    # Get total user count
    total_users = users_collection.count_documents({})
    
    return {
        "totalUsers": total_users,
        "activeUsers": active_user_count,
        "messageActivity": daily_messages,
        "loginActivity": daily_logins,
        "dateRange": {
            "start": start.strftime("%Y-%m-%d"),
            "end": (end - timedelta(days=1)).strftime("%Y-%m-%d")
        }
    }

@router.get("/chat-statistics", dependencies=[Depends(JWTBearer())])
async def get_chat_statistics(token: str = Depends(JWTBearer())):
    """
    Get chat statistics
    Only available to admin and super-admin users
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Verify admin privileges
    users_collection = get_collection("users")
    user = users_collection.find_one({"_id": user_id})
    
    if not user or user.get("role") not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Access denied: Admin privileges required")
    
    # Get chat stats
    chats_collection = get_collection("chats")
    
    # Count of group vs direct chats
    group_chat_count = chats_collection.count_documents({"isGroupChat": True})
    direct_chat_count = chats_collection.count_documents({"isGroupChat": False})
    
    # Get average users per group chat
    group_stats = list(chats_collection.aggregate([
        {"$match": {"isGroupChat": True}},
        {"$project": {
            "_id": 1,
            "userCount": {"$size": "$users"}
        }},
        {"$group": {
            "_id": None,
            "avgUsers": {"$avg": "$userCount"},
            "maxUsers": {"$max": "$userCount"},
            "minUsers": {"$min": "$userCount"}
        }}
    ]))
    
    avg_users_per_group = group_stats[0]["avgUsers"] if group_stats else 0
    
    # Get most active chats
    messages_collection = get_collection("messages")
    active_chats = list(messages_collection.aggregate([
        {"$group": {
            "_id": "$chat",
            "messageCount": {"$sum": 1}
        }},
        {"$sort": {"messageCount": -1}},
        {"$limit": 5},
        {"$lookup": {
            "from": "chats",
            "localField": "_id",
            "foreignField": "_id",
            "as": "chatInfo"
        }},
        {"$unwind": "$chatInfo"},
        {"$project": {
            "chatName": "$chatInfo.chatName",
            "isGroupChat": "$chatInfo.isGroupChat",
            "messageCount": 1
        }}
    ]))
    
    return {
        "groupChatCount": group_chat_count,
        "directChatCount": direct_chat_count,
        "totalChats": group_chat_count + direct_chat_count,
        "averageUsersPerGroup": avg_users_per_group,
        "mostActiveChats": active_chats
    }

@router.get("/user-statistics/{user_id}", dependencies=[Depends(JWTBearer())])
async def get_user_statistics(
    user_id: str,
    token: str = Depends(JWTBearer())
):
    """
    Get statistics for a specific user
    Admin can view any user, regular users can only view their own stats
    """
    token_user_id = verify_token(token)
    if not token_user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Check permissions
    users_collection = get_collection("users")
    user = users_collection.find_one({"_id": token_user_id})
    
    is_admin = user and user.get("role") in ["admin", "super-admin"]
    is_self = token_user_id == user_id
    
    if not (is_admin or is_self):
        raise HTTPException(status_code=403, detail="Access denied: Not authorized to view this user's statistics")
    
    # Target user exists?
    target_user = users_collection.find_one({"_id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Message stats
    messages_collection = get_collection("messages")
    message_count = messages_collection.count_documents({"sender": user_id})
    
    # Chat participation
    chats_collection = get_collection("chats")
    participating_chats = chats_collection.count_documents({"users": user_id})
    
    # Group vs direct chats
    group_chats = chats_collection.count_documents({"users": user_id, "isGroupChat": True})
    direct_chats = chats_collection.count_documents({"users": user_id, "isGroupChat": False})
    
    # Message activity by time
    activity_by_hour = list(messages_collection.aggregate([
        {"$match": {"sender": user_id}},
        {"$project": {
            "hour": {"$hour": "$createdAt"}
        }},
        {"$group": {
            "_id": "$hour",
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]))
    
    # Format hours to fill in gaps
    hour_counts = [0] * 24
    for item in activity_by_hour:
        hour_counts[item["_id"]] = item["count"]
    
    activity_hours = [{"hour": h, "count": hour_counts[h]} for h in range(24)]
    
    return {
        "user": {
            "id": target_user["_id"],
            "name": target_user["name"],
            "email": target_user["email"],
            "role": target_user["role"],
            "status": target_user["status"],
            "createdAt": target_user["createdAt"],
            "lastSeen": target_user["lastSeen"]
        },
        "messageCount": message_count,
        "chatParticipation": {
            "total": participating_chats,
            "groupChats": group_chats,
            "directChats": direct_chats
        },
        "activityByHour": activity_hours
    } 