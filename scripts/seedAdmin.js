require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL || 'admin@decepticall.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const fullName = process.env.ADMIN_NAME || 'Admin User';
    const phone = process.env.ADMIN_PHONE || '+10000000000';

    let admin = await User.findOne({ email });
    if (admin) {
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
        console.log(`Upgraded existing user to admin: ${admin.email}`);
      } else {
        console.log(`Admin already exists: ${admin.email}`);
      }
      process.exit(0);
    }

    admin = await User.create({
      fullName,
      email,
      phone,
      password,
      role: 'admin',
    });

    console.log('Admin created successfully:');
    console.log({ email: admin.email, password, role: admin.role });
    process.exit(0);
  } catch (err) {
    console.error('Seed admin error:', err);
    process.exit(1);
  }
})();
