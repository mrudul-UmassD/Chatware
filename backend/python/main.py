from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import json
import pymongo
from dotenv import load_dotenv
import uvicorn
from auth.auth_handler import verify_token
from auth.auth_bearer import JWTBearer
from db.mongodb import get_db_connection
from models.user import UserInDB
from routers import analytics, call_service, ai_features, users

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Chatware Python API",
    description="Advanced features backend for Chatware application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Mount static files directory for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(call_service.router, prefix="/api/calls", tags=["Call Service"])
app.include_router(ai_features.router, prefix="/api/ai", tags=["AI Features"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])

@app.get("/")
async def read_root():
    return {"message": "Welcome to Chatware Python API"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 