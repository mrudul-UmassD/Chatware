const mongoose = require('mongoose');
const { User } = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed superadmin user
const seedSuperAdmin = async () => {
  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super-admin' });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email);
      return;
    }

    // Create superadmin
    const superAdmin = await User.create({
      name: 'Admin',
      email: 'admin@chatware.com',
      password: 'superadmin',
      role: 'super-admin',
    });

    console.log('Super admin created successfully:', superAdmin.email);
  } catch (error) {
    console.error('Error seeding super admin:', error);
  }
};

// Run the seed
const runSeed = async () => {
  const connected = await connectDB();
  
  if (connected) {
    await seedSuperAdmin();
    console.log('Seed completed.');
    process.exit(0);
  }
};

runSeed(); 