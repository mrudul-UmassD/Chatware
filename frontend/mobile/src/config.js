// API URLs - use your actual IP addresses for local development
export const API_URL = 'http://192.168.1.100:5000';
export const SOCKET_URL = 'http://192.168.1.100:5000';
export const PYTHON_API_URL = 'http://192.168.1.100:8000';

// Default avatar
export const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

// Maximum file upload size (in bytes)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Supported file types
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const SUPPORTED_AUDIO_FORMATS = ['audio/mp3', 'audio/mpeg', 'audio/wav'];
export const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/webm'];
export const SUPPORTED_DOCUMENT_FORMATS = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

// Roles
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin'
};

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  FILE: 'file',
  GIF: 'gif'
};

// Theme configuration
export const LIGHT_THEME = {
  primary: '#3f51b5',
  secondary: '#f50057',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#303030'
};

export const DARK_THEME = {
  primary: '#5c6bc0',
  secondary: '#ff4081',
  background: '#303030',
  surface: '#424242',
  text: '#ffffff'
}; 