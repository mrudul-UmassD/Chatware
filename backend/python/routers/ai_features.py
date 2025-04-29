from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np
from io import BytesIO
from PIL import Image
import re
from auth.auth_bearer import JWTBearer
from auth.auth_handler import verify_token
from db.mongodb import get_collection

router = APIRouter()

@router.post("/smart-reply", dependencies=[Depends(JWTBearer())])
async def get_smart_reply(
    message_content: str,
    chat_id: str,
    token: str = Depends(JWTBearer())
):
    """
    Generate smart reply suggestions based on message content
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Simple dictionary of smart replies based on message patterns
    # In a production environment, this would use a more sophisticated model
    smart_replies = {
        r"(?i)hello|hi|hey": ["Hello!", "Hi there!", "Hey, how are you?"],
        r"(?i)how are you": ["I'm good, thanks!", "Doing well, how about you?", "Great, thanks for asking!"],
        r"(?i)thank|thanks": ["You're welcome!", "No problem!", "Anytime!"],
        r"(?i)bye|goodbye": ["Goodbye!", "See you later!", "Take care!"],
        r"(?i)meeting|discuss": ["Let's schedule a call", "I'm available to discuss", "When are you free?"],
        r"(?i)help|support": ["How can I help?", "I'm here to assist", "Let me know what you need"],
        r"(?i)agree|yes": ["Great!", "Perfect!", "Sounds good!"],
        r"(?i)disagree|no": ["I understand", "Let's find an alternative", "No problem"],
        r"(?i)sorry|apologize": ["No worries!", "It's alright", "No problem at all"],
        r"(?i)congratulations|congrats": ["Thank you!", "Appreciate it!", "Thanks!"],
    }
    
    # Find matching replies
    suggestions = []
    for pattern, replies in smart_replies.items():
        if re.search(pattern, message_content):
            suggestions.extend(replies)
    
    # If no matches, provide generic replies
    if not suggestions:
        suggestions = ["OK", "Thanks", "I'll get back to you", "Sounds good", "Let me check"]
    
    # Limit to 3 suggestions
    if len(suggestions) > 3:
        suggestions = suggestions[:3]
    
    return {
        "success": True,
        "suggestions": suggestions
    }

@router.post("/text-analysis", dependencies=[Depends(JWTBearer())])
async def analyze_text(
    text: str,
    token: str = Depends(JWTBearer())
):
    """
    Analyze text for sentiment, keywords, and entities
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Simple sentiment analysis based on keywords
    # In a production environment, this would use a proper NLP model
    positive_words = ["good", "great", "excellent", "amazing", "wonderful", "happy", "love", "like", "best", "perfect"]
    negative_words = ["bad", "terrible", "awful", "horrible", "worst", "hate", "dislike", "poor", "annoying", "wrong"]
    
    text_lower = text.lower()
    words = re.findall(r'\b\w+\b', text_lower)
    
    # Count positive and negative words
    positive_count = sum(1 for word in words if word in positive_words)
    negative_count = sum(1 for word in words if word in negative_words)
    
    # Determine sentiment
    if positive_count > negative_count:
        sentiment = "positive"
    elif negative_count > positive_count:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    # Extract potential keywords (words longer than 4 letters, excluding common words)
    common_words = ["about", "above", "after", "again", "against", "their", "them", "then", "there", "these", "they", "think", "this", "those", "thought", "through", "thus", "today", "together", "tomorrow", "tonight", "toward", "towards", "under", "until", "upon", "would", "your"]
    keywords = [word for word in words if len(word) > 4 and word not in common_words]
    
    # Count frequency of each keyword
    keyword_freq = {}
    for word in keywords:
        if word in keyword_freq:
            keyword_freq[word] += 1
        else:
            keyword_freq[word] = 1
    
    # Sort keywords by frequency
    sorted_keywords = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)
    top_keywords = [keyword for keyword, freq in sorted_keywords[:5]]
    
    return {
        "success": True,
        "analysis": {
            "sentiment": sentiment,
            "keywords": top_keywords,
            "word_count": len(words),
            "character_count": len(text)
        }
    }

@router.post("/image-recognition", dependencies=[Depends(JWTBearer())])
async def recognize_image(
    file: UploadFile = File(...),
    token: str = Depends(JWTBearer())
):
    """
    Analyze image and return basic information about it
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Check if file is an image
    content_type = file.content_type
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read image file
    contents = await file.read()
    
    try:
        # Open image with PIL
        img = Image.open(BytesIO(contents))
        
        # Get basic image info
        width, height = img.size
        format_type = img.format
        mode = img.mode
        
        # Analyze image color
        # In a production environment, this would use a proper image recognition model
        img_array = np.array(img)
        
        # Get average color if RGB
        if mode == "RGB":
            avg_color = img_array.mean(axis=(0, 1)).astype(int)
            avg_color_hex = f"#{avg_color[0]:02x}{avg_color[1]:02x}{avg_color[2]:02x}"
            
            # Determine dominant color range
            color_names = {
                "red": [255, 0, 0],
                "green": [0, 255, 0],
                "blue": [0, 0, 255],
                "yellow": [255, 255, 0],
                "cyan": [0, 255, 255],
                "magenta": [255, 0, 255],
                "white": [255, 255, 255],
                "black": [0, 0, 0],
                "gray": [128, 128, 128]
            }
            
            # Calculate color distances
            color_distances = {}
            for color_name, color_value in color_names.items():
                distance = np.sqrt(np.sum((avg_color - color_value) ** 2))
                color_distances[color_name] = distance
            
            # Find closest color
            dominant_color = min(color_distances.items(), key=lambda x: x[1])[0]
        else:
            avg_color_hex = "N/A"
            dominant_color = "N/A"
        
        # Estimate if image is light or dark
        brightness = np.mean(img_array) / 255
        tone = "light" if brightness > 0.5 else "dark"
        
        return {
            "success": True,
            "image_info": {
                "filename": file.filename,
                "format": format_type,
                "width": width,
                "height": height,
                "mode": mode,
                "avg_color": avg_color_hex,
                "dominant_color": dominant_color,
                "tone": tone,
                "file_size_kb": len(contents) / 1024
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.post("/emoji-suggestion", dependencies=[Depends(JWTBearer())])
async def suggest_emojis(
    text: str,
    token: str = Depends(JWTBearer())
):
    """
    Suggest emojis based on text content
    """
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Simple emoji suggestions based on keywords
    # In a production environment, this would use a more sophisticated model
    emoji_mappings = {
        r"(?i)happy|joy|glad|smile": ["😊", "😄", "😁"],
        r"(?i)sad|unhappy|upset": ["😔", "😢", "☹️"],
        r"(?i)laugh|lol|haha|funny": ["😂", "🤣", "😆"],
        r"(?i)love|heart|adore": ["❤️", "😍", "🥰"],
        r"(?i)angry|mad|frustrated": ["😠", "😡", "🤬"],
        r"(?i)surprise|wow|whoa": ["😮", "😲", "😯"],
        r"(?i)food|eat|hungry": ["🍔", "🍕", "🍽️"],
        r"(?i)drink|coffee|tea": ["☕", "🍺", "🥤"],
        r"(?i)work|job|office|meeting": ["💼", "👔", "📊"],
        r"(?i)home|house": ["🏠", "🏡", "🛋️"],
        r"(?i)travel|trip|vacation": ["✈️", "🚗", "🏖️"],
        r"(?i)music|song|sing": ["🎵", "🎶", "🎤"],
        r"(?i)movie|film|watch": ["🎬", "🍿", "📺"],
        r"(?i)book|read|study": ["📚", "📖", "✏️"],
        r"(?i)sleep|tired|bed": ["😴", "💤", "🛌"],
        r"(?i)celebration|party|birthday": ["🎉", "🎊", "🎂"],
        r"(?i)thank|thanks|appreciate": ["🙏", "👍", "👏"],
        r"(?i)phone|call": ["📱", "📞", "☎️"],
        r"(?i)time|clock|late|soon": ["⏰", "⌚", "⏳"],
        r"(?i)money|cash|pay": ["💰", "💵", "💸"],
        r"(?i)idea|think|smart": ["💡", "🧠", "🤔"],
        r"(?i)good|great|excellent": ["👍", "👌", "🔥"],
        r"(?i)bad|wrong|terrible": ["👎", "❌", "🙈"],
        r"(?i)ok|okay|alright": ["👌", "🆗", "👍"],
        r"(?i)hello|hi|hey": ["👋", "🙋", "🤗"],
        r"(?i)bye|goodbye|cya": ["👋", "✌️", "💛"],
        r"(?i)question|help|confused": ["❓", "🤔", "🆘"],
        r"(?i)yes|agree": ["✅", "👍", "🙌"],
        r"(?i)no|disagree": ["❌", "👎", "🙅"],
    }
    
    # Find matching emojis
    suggested_emojis = []
    for pattern, emojis in emoji_mappings.items():
        if re.search(pattern, text):
            suggested_emojis.extend(emojis)
    
    # If no matches, provide generic emoji suggestions
    if not suggested_emojis:
        suggested_emojis = ["👍", "❤️", "😊", "🙂", "👌"]
    
    # Remove duplicates and limit to 5 suggestions
    suggested_emojis = list(dict.fromkeys(suggested_emojis))[:5]
    
    return {
        "success": True,
        "emojis": suggested_emojis
    } 