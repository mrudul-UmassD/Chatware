import React, { useState, useRef } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  InputAdornment, 
  Paper, 
  Tooltip,
  Badge
} from '@mui/material';
import {
  Mic as MicIcon,
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachFileIcon,
  Cancel as CancelIcon,
  InsertPhoto as PhotoIcon,
  Description as FileIcon
} from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  // Handle message change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    if (onTyping) onTyping();
  };
  
  // Handle emoji click
  const handleEmojiClick = (emojiObj) => {
    setMessage(prev => prev + emojiObj.emoji);
  };
  
  // Toggle emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };
  
  // Handle file input change
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    // Clear the input so the same file can be selected again
    e.target.value = null;
  };
  
  // Handle files being added
  const handleFiles = (files) => {
    const newAttachments = [];
    
    files.forEach(file => {
      // Generate a preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const attachment = {
            file,
            preview: e.target.result,
            type: 'image',
            name: file.name
          };
          setAttachments(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files
        const attachment = {
          file,
          preview: null,
          type: 'file',
          name: file.name
        };
        newAttachments.push(attachment);
      }
    });
    
    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };
  
  // Handle attachment removal
  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle voice recording
  const handleRecordToggle = () => {
    // This would be implemented with a proper audio recording library
    setIsRecording(!isRecording);
  };
  
  // Handle send message
  const handleSendMessage = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
      setShowEmojiPicker(false);
    }
  };
  
  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  // Open file dialog
  const handleAttachClick = () => {
    fileInputRef.current.click();
  };
  
  return (
    <Box 
      className={`message-input-container ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* File attachments preview */}
      {attachments.length > 0 && (
        <Box className="attachments-preview">
          {attachments.map((attachment, index) => (
            <Box key={index} className="attachment-item">
              {attachment.type === 'image' ? (
                <img src={attachment.preview} alt="attachment" />
              ) : (
                <Box className="file-preview">
                  <FileIcon className="file-icon" />
                  <span className="file-name">{attachment.name}</span>
                </Box>
              )}
              <IconButton 
                size="small" 
                className="remove-attachment"
                onClick={() => handleRemoveAttachment(index)}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      
      {/* Emoji picker */}
      {showEmojiPicker && (
        <Box className="emoji-picker-container">
          <EmojiPicker 
            onEmojiClick={handleEmojiClick} 
            disableAutoFocus={true} 
            skinTone={1}
            groupNames={{ smileys_people: 'Smileys' }}
            height={350}
          />
        </Box>
      )}
      
      {/* Input area */}
      <Box className="input-area">
        <Box className="input-actions">
          <Tooltip title="Attach files">
            <IconButton onClick={handleAttachClick}>
              <AttachFileIcon />
            </IconButton>
          </Tooltip>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInputChange} 
            style={{ display: 'none' }} 
            multiple
          />
        </Box>
        
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message"
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box className="input-buttons">
                  <Tooltip title="Emoji">
                    <IconButton onClick={toggleEmojiPicker}>
                      <EmojiIcon color={showEmojiPicker ? 'primary' : 'default'} />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={isRecording ? 'Stop recording' : 'Voice message'}>
                    <IconButton 
                      color={isRecording ? 'error' : 'default'} 
                      onClick={handleRecordToggle}
                    >
                      <MicIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              paddingRight: 1
            }
          }}
        />
        
        <Box ml={1}>
          <Tooltip title="Send">
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={!message.trim() && attachments.length === 0}
            >
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Drag overlay */}
      {dragActive && (
        <Box className="drag-overlay">
          <PhotoIcon sx={{ fontSize: 40, mb: 2 }} />
          <p>Drop files to attach</p>
        </Box>
      )}
    </Box>
  );
};

export default MessageInput; 