# Chatware

A secure real-time chat application with end-to-end encryption for web and mobile platforms.

## Features

- End-to-end encryption using AES for all messages
- Real-time messaging with Socket.IO
- Group chat support with encryption
- File sharing capabilities
- Location tracking for user geolocation
- Web and mobile applications with shared backend
- Authentication with JWT

## Project Structure

```
chatware/
├── backend/          # Node.js backend API
├── frontend/
│   ├── web/          # React web client
│   └── mobile/       # React Native mobile app
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MongoDB (local or Atlas)

### Environment Variables Setup

Both the backend and frontend use environment variables for configuration.

1. For the backend:
   ```bash
   cd backend
   cp .env.example .env  # Then edit the .env file with your configuration
   ```

2. For the web client:
   ```bash
   cd frontend/web
   cp .env.example .env  # Then edit the .env file with your configuration
   ```

3. For the mobile app:
   ```bash
   cd frontend/mobile
   cp .env.example .env  # Then edit the .env file with your configuration
   ```

### MongoDB Setup

You have two options for MongoDB setup:

#### Option 1: Local MongoDB

1. Install MongoDB on your local machine
2. In the backend `.env` file, set:
   ```
   MONGODB_URI=mongodb://localhost:27017/chatware
   ```

#### Option 2: MongoDB Atlas (Cloud)

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. In the backend `.env` file, set your Atlas credentials:
   ```
   MONGODB_USER=your_mongodb_username
   MONGODB_PASSWORD=your_mongodb_password
   MONGODB_CLUSTER=your_cluster_name
   ```

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Web Client Setup

```bash
cd frontend/web
npm install
npm start
```

### Mobile App Setup

```bash
cd frontend/mobile
npm install
npx expo start
```

## Security Features

### End-to-End Encryption

All messages are encrypted using AES encryption with the following workflow:

1. Each user generates a unique keypair on login
2. Public keys are exchanged via the server
3. Messages are encrypted with recipient's public key
4. Only the intended recipient can decrypt messages with their private key

## API Documentation

API documentation can be found at `/api/docs` when running the backend server.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request