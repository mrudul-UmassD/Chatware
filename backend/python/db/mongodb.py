import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/chatware")

def get_db_connection():
    """
    Create a connection to MongoDB
    """
    client = MongoClient(MONGO_URI)
    db = client["chatware"]
    return db

def get_collection(collection_name):
    """
    Get a MongoDB collection
    """
    db = get_db_connection()
    return db[collection_name] 