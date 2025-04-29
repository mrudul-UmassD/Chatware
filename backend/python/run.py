import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get port from environment variables or use default
PORT = int(os.getenv("PORT", 8000))
DEBUG = os.getenv("DEBUG", "True").lower() in ["true", "1", "t", "yes"]

if __name__ == "__main__":
    print(f"Starting Chatware Python API on port {PORT}")
    print(f"Debug mode: {'Enabled' if DEBUG else 'Disabled'}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        reload=DEBUG
    ) 