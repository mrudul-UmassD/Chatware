import React, { useState } from 'react';
import { Navbar, Button, Image, Dropdown } from 'react-bootstrap';
import { DEFAULT_AVATAR } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useSocket } from '../contexts/SocketContext';
import ChatInfoModal from './ChatInfoModal';
import UserProfileModal from './UserProfileModal';

const ChatHeader = ({ toggleSidebar }) => {
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { user } = useAuth();
  const { selectedChat } = useChat();
  const { isUserOnline } = useSocket();

  const getSenderData = () => {
    if (!user || !selectedChat) return null;
    const otherUser = selectedChat.users.find((u) => u._id !== user._id);
    return otherUser || { name: 'Unknown User', profilePic: DEFAULT_AVATAR };
  };

  return (
    <>
      <Navbar bg="light" className="px-3 py-2 border-bottom">
        <Button
          variant="light"
          className="d-lg-none me-2"
          onClick={toggleSidebar}
        >
          <i className="bi bi-list"></i>
        </Button>

        {selectedChat ? (
          <>
            <div className="d-flex align-items-center">
              {selectedChat.isGroupChat ? (
                <Image
                  src={selectedChat.groupPic || DEFAULT_AVATAR}
                  alt={selectedChat.chatName}
                  className="avatar-md rounded-circle"
                />
              ) : (
                <div className="position-relative">
                  <Image
                    src={getSenderData()?.profilePic || DEFAULT_AVATAR}
                    alt={getSenderData()?.name}
                    className="avatar-md rounded-circle"
                    onClick={() => !selectedChat.isGroupChat && setShowUserProfile(true)}
                    style={{ cursor: 'pointer' }}
                  />
                  {!selectedChat.isGroupChat && isUserOnline(getSenderData()?._id) && (
                    <span
                      className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-light"
                      style={{ width: '12px', height: '12px' }}
                    ></span>
                  )}
                </div>
              )}
              <div className="ms-3">
                <h6 className="mb-0">
                  {selectedChat.isGroupChat
                    ? selectedChat.chatName
                    : getSenderData()?.name}
                </h6>
                <small className="text-muted">
                  {selectedChat.isGroupChat
                    ? `${selectedChat.users.length} members`
                    : isUserOnline(getSenderData()?._id)
                    ? 'Online'
                    : 'Offline'}
                </small>
              </div>
            </div>

            <div className="ms-auto d-flex align-items-center">
              <Button
                variant="light"
                className="rounded-circle me-2"
                onClick={() => {
                  // Implement call functionality
                }}
              >
                <i className="bi bi-telephone"></i>
              </Button>
              <Button
                variant="light"
                className="rounded-circle me-2"
                onClick={() => {
                  // Implement video call functionality
                }}
              >
                <i className="bi bi-camera-video"></i>
              </Button>

              <Dropdown align="end">
                <Dropdown.Toggle variant="light" className="rounded-circle">
                  <i className="bi bi-three-dots-vertical"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setShowChatInfo(true)}>
                    <i className="bi bi-info-circle me-2"></i>
                    {selectedChat.isGroupChat ? 'Group Info' : 'Contact Info'}
                  </Dropdown.Item>
                  {selectedChat.isGroupChat && (
                    <>
                      <Dropdown.Item>
                        <i className="bi bi-person-plus me-2"></i>
                        Add Members
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Leave Group
                      </Dropdown.Item>
                    </>
                  )}
                  <Dropdown.Item className="text-danger">
                    <i className="bi bi-trash me-2"></i>
                    {selectedChat.isGroupChat ? 'Delete Group' : 'Delete Chat'}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </>
        ) : (
          <div className="d-flex align-items-center">
            <h6 className="mb-0">Select a chat to start messaging</h6>
          </div>
        )}
      </Navbar>

      {/* Modals */}
      {selectedChat && (
        <>
          {selectedChat.isGroupChat ? (
            <ChatInfoModal
              show={showChatInfo}
              onHide={() => setShowChatInfo(false)}
              chat={selectedChat}
            />
          ) : (
            <UserProfileModal
              show={showUserProfile || showChatInfo}
              onHide={() => {
                setShowUserProfile(false);
                setShowChatInfo(false);
              }}
              user={getSenderData()}
            />
          )}
        </>
      )}
    </>
  );
};

export default ChatHeader; 