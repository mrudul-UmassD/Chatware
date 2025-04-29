import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListGroup,
  Badge,
  InputGroup,
  Form,
  Button,
  Offcanvas,
  Nav,
  Image,
  Dropdown,
} from 'react-bootstrap';
import { format } from 'timeago.js';
import { DEFAULT_AVATAR, ROLES } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useSocket } from '../contexts/SocketContext';
import CreateGroupModal from './CreateGroupModal';

const Sidebar = ({ mobile, show, onHide }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { user, logout } = useAuth();
  const { chats, selectedChat, setSelectedChat, fetchMessages, unreadCount, removeNotification } = useChat();
  const { isUserOnline } = useSocket();
  const navigate = useNavigate();

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat._id);
    removeNotification(chat._id);
    if (mobile) {
      onHide();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getSenderData = (chat) => {
    if (!user) return null;
    const otherUser = chat.users.find((u) => u._id !== user._id);
    return otherUser || { name: 'Unknown User', profilePic: DEFAULT_AVATAR };
  };

  const content = (
    <>
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <div className="d-flex align-items-center">
          <Image
            src={user?.profilePic || DEFAULT_AVATAR}
            alt={user?.name}
            className="avatar-md rounded-circle"
          />
          <div className="ms-3">
            <h6 className="mb-0">{user?.name}</h6>
            <small className="text-muted">{user?.email}</small>
          </div>
        </div>
        <Dropdown align="end">
          <Dropdown.Toggle variant="light" size="sm" id="user-dropdown" className="rounded-circle">
            <i className="bi bi-three-dots-vertical"></i>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => navigate('/profile')}>
              <i className="bi bi-person me-2"></i> Profile
            </Dropdown.Item>
            {user?.role !== ROLES.USER && (
              <Dropdown.Item onClick={() => navigate('/admin')}>
                <i className="bi bi-gear me-2"></i> Admin Panel
              </Dropdown.Item>
            )}
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i> Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <div className="p-3">
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="outline-secondary" onClick={() => setSearchQuery('')}>
            {searchQuery ? <i className="bi bi-x"></i> : <i className="bi bi-search"></i>}
          </Button>
        </InputGroup>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Chats</h6>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateGroup(true)}
          >
            <i className="bi bi-plus-lg me-1"></i> New Group
          </Button>
        </div>

        <ListGroup variant="flush">
          {chats
            .filter(
              (chat) =>
                chat.isGroupChat
                  ? chat.chatName.toLowerCase().includes(searchQuery.toLowerCase())
                  : getSenderData(chat)?.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
            )
            .map((chat) => (
              <ListGroup.Item
                key={chat._id}
                action
                active={selectedChat?._id === chat._id}
                className="border-0 rounded mb-1"
                onClick={() => handleSelectChat(chat)}
              >
                <div className="d-flex align-items-center">
                  {chat.isGroupChat ? (
                    <div className="position-relative">
                      <Image
                        src={chat.groupPic || DEFAULT_AVATAR}
                        alt={chat.chatName}
                        className="avatar-md rounded-circle"
                      />
                      <Badge
                        bg="success"
                        className="position-absolute bottom-0 end-0 rounded-circle border border-light p-1"
                        style={{ width: '12px', height: '12px' }}
                      ></Badge>
                    </div>
                  ) : (
                    <div className="position-relative">
                      <Image
                        src={getSenderData(chat)?.profilePic || DEFAULT_AVATAR}
                        alt={getSenderData(chat)?.name}
                        className="avatar-md rounded-circle"
                      />
                      {isUserOnline(getSenderData(chat)?._id) && (
                        <Badge
                          bg="success"
                          className="position-absolute bottom-0 end-0 rounded-circle border border-light p-1"
                          style={{ width: '12px', height: '12px' }}
                        ></Badge>
                      )}
                    </div>
                  )}
                  <div className="ms-3 flex-grow-1 overflow-hidden">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 text-truncate">
                        {chat.isGroupChat ? chat.chatName : getSenderData(chat)?.name}
                      </h6>
                      {chat.latestMessage && (
                        <small className="text-muted">
                          {format(chat.latestMessage.createdAt)}
                        </small>
                      )}
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <p className="text-truncate mb-0 small text-muted">
                        {chat.latestMessage ? (
                          <>
                            {chat.isGroupChat &&
                              `${chat.latestMessage.sender.name}: `}
                            {chat.latestMessage.content}
                          </>
                        ) : (
                          'No messages yet'
                        )}
                      </p>
                      {unreadCount[chat._id] > 0 && (
                        <Badge bg="primary" pill className="ms-2">
                          {unreadCount[chat._id]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
        </ListGroup>
      </div>

      <CreateGroupModal
        show={showCreateGroup}
        onHide={() => setShowCreateGroup(false)}
      />
    </>
  );

  return mobile ? (
    <Offcanvas show={show} onHide={onHide} responsive="lg">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Chats</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>{content}</Offcanvas.Body>
    </Offcanvas>
  ) : (
    <div className="sidebar h-100 border-end">{content}</div>
  );
};

export default Sidebar; 