import React, { useState, useRef } from 'react';
import { Form, Button, InputGroup, Dropdown, Spinner } from 'react-bootstrap';
import { MESSAGE_TYPES, SUPPORTED_IMAGE_FORMATS, MAX_FILE_SIZE } from '../config';
import { useChat } from '../contexts/ChatContext';
import { useSocket } from '../contexts/SocketContext';
import EmojiPickerButton from './EmojiPickerButton';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const { selectedChat, sendMessage } = useChat();
  const { socket } = useSocket();

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !selectedChat) return;
    socket.emit('typing', selectedChat._id);
  };

  const handleStopTyping = () => {
    if (!socket || !selectedChat) return;
    socket.emit('stop typing', selectedChat._id);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size should not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    // Determine file type
    let type = MESSAGE_TYPES.FILE;
    if (SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
      type = MESSAGE_TYPES.IMAGE;
    } else if (file.type.startsWith('video/')) {
      type = MESSAGE_TYPES.VIDEO;
    } else if (file.type.startsWith('audio/')) {
      type = MESSAGE_TYPES.AUDIO;
    }

    setFileType(type);
    setPreviewFile(file);
  };

  // Clear the selected file
  const clearFileSelection = () => {
    setPreviewFile(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if ((!message.trim() && !previewFile) || !selectedChat) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Create form data for file upload
      if (previewFile) {
        const formData = new FormData();
        formData.append('file', previewFile);
        formData.append('content', message.trim());
        formData.append('chatId', selectedChat._id);
        formData.append('messageType', fileType);

        await sendMessage(message.trim(), selectedChat._id, fileType, formData);
      } else {
        await sendMessage(message.trim(), selectedChat._id);
      }

      // Clear input after sending
      setMessage('');
      clearFileSelection();
      handleStopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle audio recording
  const startRecording = () => {
    setIsRecording(true);
    // Implement recording logic here
  };

  const stopRecording = async () => {
    setIsRecording(false);
    // Implement stop recording and send audio logic here
  };

  // Render file preview
  const renderFilePreview = () => {
    if (!previewFile) return null;

    return (
      <div className="file-preview p-2 border rounded mb-2 position-relative">
        {fileType === MESSAGE_TYPES.IMAGE && (
          <img
            src={URL.createObjectURL(previewFile)}
            alt="Preview"
            className="img-thumbnail"
            style={{ maxHeight: '100px' }}
          />
        )}
        {fileType === MESSAGE_TYPES.VIDEO && (
          <video
            src={URL.createObjectURL(previewFile)}
            className="img-thumbnail"
            style={{ maxHeight: '100px' }}
          />
        )}
        {fileType === MESSAGE_TYPES.AUDIO && (
          <audio
            src={URL.createObjectURL(previewFile)}
            controls
            className="w-100"
          />
        )}
        {fileType === MESSAGE_TYPES.FILE && (
          <div className="d-flex align-items-center">
            <i className="bi bi-file-earmark me-2 fs-5"></i>
            <div>
              <div>{previewFile.name}</div>
              <small className="text-muted">
                {(previewFile.size / 1024).toFixed(1)} KB
              </small>
            </div>
          </div>
        )}
        <Button
          variant="link"
          className="position-absolute top-0 end-0 text-danger p-1"
          onClick={clearFileSelection}
        >
          <i className="bi bi-x-circle-fill"></i>
        </Button>
      </div>
    );
  };

  // If no chat is selected, disable the input
  if (!selectedChat) {
    return (
      <div className="message-input-container p-3 border-top">
        <Form>
          <InputGroup>
            <Form.Control
              placeholder="Select a chat to start messaging"
              disabled
            />
            <Button variant="primary" disabled>
              <i className="bi bi-send"></i>
            </Button>
          </InputGroup>
        </Form>
      </div>
    );
  }

  return (
    <div className="message-input-container p-3 border-top">
      {renderFilePreview()}
      <Form onSubmit={handleSendMessage}>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            onFocus={handleTyping}
            onBlur={handleStopTyping}
          />

          <Form.Control
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div className="input-group-append d-flex">
            <EmojiPickerButton onEmojiClick={(emoji) => setMessage(prev => prev + emoji)} />
            
            <Dropdown>
              <Dropdown.Toggle variant="light" id="attachment-dropdown">
                <i className="bi bi-paperclip"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => fileInputRef.current.click()}>
                  <i className="bi bi-image me-2"></i> Image
                </Dropdown.Item>
                <Dropdown.Item onClick={() => fileInputRef.current.click()}>
                  <i className="bi bi-camera-video me-2"></i> Video
                </Dropdown.Item>
                <Dropdown.Item onClick={() => fileInputRef.current.click()}>
                  <i className="bi bi-file-earmark-music me-2"></i> Audio
                </Dropdown.Item>
                <Dropdown.Item onClick={() => fileInputRef.current.click()}>
                  <i className="bi bi-file-earmark me-2"></i> Document
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {isRecording ? (
              <Button variant="danger" onClick={stopRecording}>
                <i className="bi bi-record-fill"></i>
              </Button>
            ) : (
              <Button
                variant="primary"
                type="submit"
                disabled={(!message.trim() && !previewFile) || isSubmitting}
              >
                {isSubmitting ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <i className="bi bi-send"></i>
                )}
              </Button>
            )}
          </div>
        </InputGroup>
      </Form>
    </div>
  );
};

export default MessageInput; 