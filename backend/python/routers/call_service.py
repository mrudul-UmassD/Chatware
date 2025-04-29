from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
from auth.auth_bearer import JWTBearer
from auth.auth_handler import verify_token
from db.mongodb import get_collection

router = APIRouter()

# Store for active calls and connected clients
active_calls = {}  # call_id -> {participants: [user_ids], start_time, call_type}
connected_clients = {}  # user_id -> WebSocket

@router.post("/create", dependencies=[Depends(JWTBearer())])
async def create_call(
    call_type: str,
    participants: List[str],
    token: str = Depends(JWTBearer())
):
    """
    Create a new call session
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Validate call type
    if call_type not in ["audio", "video"]:
        raise HTTPException(status_code=400, detail="Invalid call type. Must be 'audio' or 'video'")
    
    # Validate participants
    if not participants or len(participants) < 1:
        raise HTTPException(status_code=400, detail="At least one participant is required")
    
    # Ensure caller is included in participants
    if user_id not in participants:
        participants.append(user_id)
    
    # Generate call ID
    import uuid
    call_id = str(uuid.uuid4())
    
    # Store call data
    active_calls[call_id] = {
        "participants": participants,
        "start_time": datetime.now(),
        "call_type": call_type,
        "initiator": user_id
    }
    
    # Log call creation
    try:
        calls_collection = get_collection("calls")
        call_log = {
            "call_id": call_id,
            "participants": participants,
            "start_time": datetime.now(),
            "call_type": call_type,
            "initiator": user_id,
            "status": "created",
            "end_time": None,
            "duration": None
        }
        calls_collection.insert_one(call_log)
    except Exception as e:
        print(f"Failed to log call creation: {e}")
    
    return {
        "success": True,
        "call_id": call_id,
        "participants": participants,
        "call_type": call_type
    }

@router.post("/{call_id}/end", dependencies=[Depends(JWTBearer())])
async def end_call(
    call_id: str,
    token: str = Depends(JWTBearer())
):
    """
    End an active call
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Check if call exists
    if call_id not in active_calls:
        raise HTTPException(status_code=404, detail="Call not found or already ended")
    
    # Check if user is a participant
    call_data = active_calls[call_id]
    if user_id not in call_data["participants"]:
        raise HTTPException(status_code=403, detail="You are not a participant in this call")
    
    # Calculate call duration
    start_time = call_data["start_time"]
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    # Update call log
    try:
        calls_collection = get_collection("calls")
        calls_collection.update_one(
            {"call_id": call_id},
            {
                "$set": {
                    "status": "ended",
                    "end_time": end_time,
                    "duration": duration
                }
            }
        )
    except Exception as e:
        print(f"Failed to update call log: {e}")
    
    # Remove call from active calls
    del active_calls[call_id]
    
    return {
        "success": True,
        "call_id": call_id,
        "duration": duration
    }

@router.get("/active-calls", dependencies=[Depends(JWTBearer())])
async def get_active_calls(token: str = Depends(JWTBearer())):
    """
    Get all active calls for the authenticated user
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Find calls where user is a participant
    user_calls = []
    for call_id, call_data in active_calls.items():
        if user_id in call_data["participants"]:
            user_calls.append({
                "call_id": call_id,
                "participants": call_data["participants"],
                "call_type": call_data["call_type"],
                "start_time": call_data["start_time"].isoformat(),
                "duration": (datetime.now() - call_data["start_time"]).total_seconds()
            })
    
    return {
        "success": True,
        "active_calls": user_calls
    }

@router.get("/call-history", dependencies=[Depends(JWTBearer())])
async def get_call_history(
    limit: int = Query(10, description="Number of records to return"),
    offset: int = Query(0, description="Number of records to skip"),
    token: str = Depends(JWTBearer())
):
    """
    Get call history for the authenticated user
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    try:
        calls_collection = get_collection("calls")
        call_history = list(calls_collection.find(
            {"participants": user_id},
            {"_id": 0}  # Exclude MongoDB ID
        ).sort("start_time", -1).skip(offset).limit(limit))
        
        # Format datetime objects
        for call in call_history:
            call["start_time"] = call["start_time"].isoformat()
            if call["end_time"]:
                call["end_time"] = call["end_time"].isoformat()
        
        total_calls = calls_collection.count_documents({"participants": user_id})
        
        return {
            "success": True,
            "call_history": call_history,
            "total": total_calls,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        print(f"Failed to get call history: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve call history")

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for call signaling
    """
    await websocket.accept()
    
    # Store the WebSocket connection
    connected_clients[user_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message["type"] == "signal":
                # Forward signaling data to target user
                target_user_id = message["target"]
                if target_user_id in connected_clients:
                    await connected_clients[target_user_id].send_text(data)
                else:
                    # Target user not connected
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Target user not connected",
                        "target": target_user_id
                    }))
            
            elif message["type"] == "join_call":
                # User is joining a call
                call_id = message["call_id"]
                if call_id in active_calls:
                    # Add user to call participants if not already there
                    if user_id not in active_calls[call_id]["participants"]:
                        active_calls[call_id]["participants"].append(user_id)
                    
                    # Notify all participants that a user joined
                    for participant_id in active_calls[call_id]["participants"]:
                        if participant_id in connected_clients and participant_id != user_id:
                            await connected_clients[participant_id].send_text(json.dumps({
                                "type": "user_joined",
                                "call_id": call_id,
                                "user_id": user_id
                            }))
                else:
                    # Call doesn't exist
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Call not found",
                        "call_id": call_id
                    }))
            
            elif message["type"] == "leave_call":
                # User is leaving a call
                call_id = message["call_id"]
                if call_id in active_calls and user_id in active_calls[call_id]["participants"]:
                    # Remove user from call participants
                    active_calls[call_id]["participants"].remove(user_id)
                    
                    # If no participants left, end the call
                    if not active_calls[call_id]["participants"]:
                        # Calculate call duration
                        start_time = active_calls[call_id]["start_time"]
                        end_time = datetime.now()
                        duration = (end_time - start_time).total_seconds()
                        
                        # Update call log
                        try:
                            calls_collection = get_collection("calls")
                            calls_collection.update_one(
                                {"call_id": call_id},
                                {
                                    "$set": {
                                        "status": "ended",
                                        "end_time": end_time,
                                        "duration": duration
                                    }
                                }
                            )
                        except Exception as e:
                            print(f"Failed to update call log: {e}")
                        
                        # Remove call from active calls
                        del active_calls[call_id]
                    else:
                        # Notify remaining participants that a user left
                        for participant_id in active_calls[call_id]["participants"]:
                            if participant_id in connected_clients:
                                await connected_clients[participant_id].send_text(json.dumps({
                                    "type": "user_left",
                                    "call_id": call_id,
                                    "user_id": user_id
                                }))
    
    except WebSocketDisconnect:
        # Remove the WebSocket connection
        if user_id in connected_clients:
            del connected_clients[user_id]
        
        # Remove user from any active calls
        for call_id, call_data in list(active_calls.items()):
            if user_id in call_data["participants"]:
                call_data["participants"].remove(user_id)
                
                # If no participants left, end the call
                if not call_data["participants"]:
                    # Calculate call duration
                    start_time = call_data["start_time"]
                    end_time = datetime.now()
                    duration = (end_time - start_time).total_seconds()
                    
                    # Update call log
                    try:
                        calls_collection = get_collection("calls")
                        calls_collection.update_one(
                            {"call_id": call_id},
                            {
                                "$set": {
                                    "status": "ended",
                                    "end_time": end_time,
                                    "duration": duration
                                }
                            }
                        )
                    except Exception as e:
                        print(f"Failed to update call log: {e}")
                    
                    # Remove call from active calls
                    del active_calls[call_id]
                else:
                    # Notify remaining participants that a user disconnected
                    for participant_id in call_data["participants"]:
                        if participant_id in connected_clients:
                            await connected_clients[participant_id].send_text(json.dumps({
                                "type": "user_disconnected",
                                "call_id": call_id,
                                "user_id": user_id
                            }))
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        # Clean up if something goes wrong
        if user_id in connected_clients:
            del connected_clients[user_id] 