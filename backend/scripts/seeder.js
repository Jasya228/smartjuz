import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin exists
    const adminExists = await Admin.findOne({ email: 'admin@aspc.kz' });
    if (!adminExists) {
      await Admin.create({
        name: 'System Admin',
        email: 'admin@aspc.kz',
        password: 'password123', // Will be hashed by mongoose pre-save hook
        role: 'superadmin'
      });
      console.log('Admin User Created: admin@aspc.kz / password123');
    } else {
      console.log('Admin already exists.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
