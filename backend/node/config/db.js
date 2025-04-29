const mongoose = require('mongoose');

/**
 * Connect to MongoDB database using credentials from .env file
 * Supports both local MongoDB and MongoDB Atlas connections
 */
const connectDB = async () => {
  try {
    // Check if we're using MongoDB Atlas (cloud) or local MongoDB
    let uri = process.env.MONGODB_URI || 'mongodb+srv://httpgodmail:MongoDB@cluster0.cfeowwg.mongodb.net/';

    // If MongoDB Atlas credentials are provided, construct the connection string
    if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD && process.env.MONGODB_CLUSTER) {
      uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.mongodb.net/chatware?retryWrites=true&w=majority`;
    }

    console.log(`Connecting to MongoDB: ${uri.split('@')[0]}@****`);

    // Connect to MongoDB with appropriate options
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 