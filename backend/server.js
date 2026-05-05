const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Import ALL routes
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const uploadRoutes = require('./routes/upload');
const employeeDashboardRoutes = require('./routes/employeeDashboardRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Profile ROUTES
const adminProfileRoutes = require('./routes/adminProfileRoutes');
const hrProfileRoutes = require('./routes/hrProfileRoutes');
const employeeProfileRoutes = require('./routes/employeeProfileRoutes');

const app = express();

// ===== CREATE UPLOADS FOLDER =====
const createUploadsDir = () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const messagesDir = path.join(__dirname, 'uploads', 'messages');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Uploads directory created:', uploadsDir);
  }
  if (!fs.existsSync(messagesDir)) {
    fs.mkdirSync(messagesDir, { recursive: true });
    console.log('✅ Messages upload directory created:', messagesDir);
  }
};

createUploadsDir();

// ===== MIDDLEWARE =====
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'], 
  credentials: true 
}));

// JSON + URLENCODED parsing (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== MONGODB =====
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ===== TEST AUTH ENDPOINT =====
app.get('/api/test-auth', require('./utils/authMiddleware').protect, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      role: req.user.role,
      systemRole: req.user.systemRole,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// ===== ROUTES =====
// Auth first
app.use('/api/auth', require('./routes/auth'));

// Profile routes
app.use('/api/admin', adminProfileRoutes);
app.use('/api/hr', hrProfileRoutes);
app.use('/api/employees', employeeProfileRoutes);

// Core routes
app.use('/api/employees', require('./routes/employee'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leaves', require('./routes/leave'));
app.use('/api/admin/payroll', require('./routes/adminPayroll'));
app.use('/api/employee/payroll', require('./routes/employeePayroll'));

// ✅ HR Payroll Routes - Using correct filename hrPayroll.js
try {
  app.use('/api/hr/payroll', require('./routes/hrPayroll.js'));
  console.log('✅ HR Payroll Routes loaded successfully');
} catch (err) {
  console.error('❌ HR Payroll Routes NOT loaded:', err.message);
}

app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/employee-dashboard', employeeDashboardRoutes);
app.use('/api/messages', messageRoutes);

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HRM System API is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ===== TEMPORARY ROUTE FOR CREATING USERS (DELETE AFTER USE) =====
app.post('/api/temp/create-user', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');
    
    const { fullName, username, email, password, role } = req.body;
    
    // Check if user exists
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.json({ 
        success: false, 
        error: 'User already exists with this email or username' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
    
    // Create user
    const user = await User.create({
      name: fullName,
      fullName: fullName,
      username: username,
      email: email,
      password: hashedPassword,
      role: role || 'employee',
      systemRole: role || 'employee',
      isActive: true
    });
    
    res.json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== 404 HANDLER =====
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    error: `Route not found: ${req.originalUrl}`
  });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error'
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅✅✅ ALL ROUTES LOADED ✅✅✅`);
  console.log(`📍 HR Payroll Routes: http://localhost:${PORT}/api/hr/payroll`);
  console.log(`📍 Admin Payroll: http://localhost:${PORT}/api/admin/payroll`);
  console.log(`📍 Employee Payroll: http://localhost:${PORT}/api/employee/payroll`);
});