# Chatware Mobile App

Mobile client for the Chatware messaging platform built with React Native and Expo.

## Features

- User authentication (login, registration, password recovery)
- Real-time chat messaging with socket.io
- Group chat support
- Multimedia messaging (text, images, videos, files)
- Typing indicators
- Online status indicators
- Push notifications for new messages
- User profile management
- Dark/Light theme support

## Tech Stack

- React Native
- Expo
- React Navigation
- Socket.io Client
- Axios
- Formik & Yup
- React Native Paper

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or Yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)

### Installation

1. Clone the repository
2. Navigate to the mobile app directory:
   ```
   cd frontend/mobile
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Configuration

1. Open `src/config.js` and update the API URLs to point to your backend servers.
   - You'll need to use your actual local network IP address instead of localhost

### Running the App

Start the development server:
```
npm start
```
or
```
yarn start
```

This will launch the Expo DevTools in your browser. You can then:
- Run on an iOS simulator (Mac only)
- Run on an Android emulator
- Scan the QR code with the Expo Go app on your physical device

## Project Structure

```
frontend/mobile/
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React Context providers
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # App screens
│   │   ├── auth/        # Authentication screens
│   │   └── main/        # Main app screens
│   ├── services/        # API services
│   └── utils/           # Utility functions
├── App.js               # App entry point
└── ...
```

## Building for Production

To create a production build:

```
expo build:android
```

or

```
expo build:ios
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 