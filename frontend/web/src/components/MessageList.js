import React, { useEffect, useRef } from 'react';
import { Image } from 'react-bootstrap';
import { format } from 'timeago.js';
import { DEFAULT_AVATAR, MESSAGE_TYPES } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

const MessageList = () => {
  const { user } = useAuth();
  const { selectedChat, messages, isTyping } = useChat();
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!selectedChat) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center h-100 text-center p-4">
        <Image
          src="/logo192.png"
          alt="Chatware Logo"
          width={80}
          height={80}
          className="mb-4 opacity-50"
        />
        <h4 className="text-muted mb-2">Welcome to Chatware</h4>
        <p className="text-muted">
          Select a chat from the sidebar or start a new conversation
        </p>
      </div>
    );
  }

  const renderMessageContent = (message) => {
    switch (message.messageType) {
      case MESSAGE_TYPES.IMAGE:
        return (
          <Image
            src={message.fileUrl}
            alt="Image"
            fluid
            className="rounded"
            style={{ maxWidth: '250px', cursor: 'pointer' }}
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
        );
      case MESSAGE_TYPES.VIDEO:
        return (
          <video
            src={message.fileUrl}
            controls
            className="rounded"
            style={{ maxWidth: '250px' }}
          />
        );
      case MESSAGE_TYPES.AUDIO:
        return (
          <audio src={message.fileUrl} controls className="w-100" />
        );
      case MESSAGE_TYPES.FILE:
        return (
          <div
            className="d-flex align-items-center p-2 rounded bg-light"
            style={{ cursor: 'pointer' }}
            onClick={() => window.open(message.fileUrl, '_blank')}
          >
            <i className="bi bi-file-earmark me-2 fs-5"></i>
            <div>
              <div>{message.fileName}</div>
              <small className="text-muted">
                {(message.fileSize / 1024).toFixed(1)} KB
              </small>
            </div>
            <i className="bi bi-download ms-3"></i>
          </div>
        );
      case MESSAGE_TYPES.GIF:
        return (
          <Image
            src={message.fileUrl}
            alt="GIF"
            fluid
            className="rounded"
            style={{ maxWidth: '250px' }}
          />
        );
      default:
        return <span>{message.content}</span>;
    }
  };

  return (
    <div
      className="message-list p-3 d-flex flex-column"
      style={{
        height: 'calc(100vh - 140px)',
        overflowY: 'auto',
      }}
    >
      {messages.length === 0 ? (
        <div className="text-center my-auto">
          <p className="text-muted">No messages yet</p>
          <p className="text-muted">Start the conversation by sending a message</p>
        </div>
      ) : (
        <>
          {messages.map((message) => {
            const isSender = message.sender._id === user._id;
            return (
              <div
                key={message._id}
                className={`d-flex mb-3 ${
                  isSender ? 'justify-content-end' : 'justify-content-start'
                }`}
              >
                {!isSender && (
                  <Image
                    src={message.sender.profilePic || DEFAULT_AVATAR}
                    alt={message.sender.name}
                    className="avatar-sm rounded-circle mt-1 me-2"
                  />
                )}
                <div
                  className={`message-bubble p-2 px-3 rounded-3 ${
                    isSender
                      ? 'bg-primary text-white'
                      : 'bg-light border'
                  }`}
                  style={{ maxWidth: '75%' }}
                >
                  {selectedChat.isGroupChat && !isSender && (
                    <div className="small fw-bold mb-1">
                      {message.sender.name}
                    </div>
                  )}
                  <div>{renderMessageContent(message)}</div>
                  <div
                    className={`small mt-1 text-end ${
                      isSender ? 'text-white-50' : 'text-muted'
                    }`}
                  >
                    {format(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="d-flex mb-3">
              <div className="typing-indicator p-2 px-3 rounded-3 bg-light border">
                <div className="d-flex">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default MessageList; 