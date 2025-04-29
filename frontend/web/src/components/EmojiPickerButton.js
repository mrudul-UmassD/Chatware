import React, { useState, useRef, useEffect } from 'react';
import { Dropdown, Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

// List of common emojis - can be expanded or connected to a full emoji picker library
const commonEmojis = [
  '😀', '😂', '😊', '😍', '🥰', '😎', '🤔', '😴',
  '👍', '👌', '✌️', '🙏', '💪', '🫡', '🎉', '🔥',
  '❤️', '💯', '🤝', '👏', '🚀', '✅', '⭐', '💡'
];

const EmojiPickerButton = ({ onEmojiClick }) => {
  const [show, setShow] = useState(false);
  const dropdownRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="emoji-picker-dropdown">
      <Button
        variant="light"
        onClick={() => setShow(!show)}
        className="emoji-btn"
      >
        <i className="bi bi-emoji-smile"></i>
      </Button>

      {show && (
        <div className="emoji-picker-container position-absolute bottom-100 end-0 bg-white p-2 border rounded shadow mb-2">
          <div className="d-flex flex-wrap" style={{ maxWidth: '250px' }}>
            {commonEmojis.map((emoji, index) => (
              <div
                key={index}
                className="emoji-item p-1"
                onClick={() => {
                  onEmojiClick(emoji);
                  setShow(false);
                }}
                style={{ cursor: 'pointer', fontSize: '1.5rem' }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

EmojiPickerButton.propTypes = {
  onEmojiClick: PropTypes.func.isRequired
};

export default EmojiPickerButton; 