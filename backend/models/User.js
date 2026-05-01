const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // System Information
  employeeId: { 
    type: String, 
    unique: true,
    sparse: true,
    default: function() {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 900 + 100);
      return `EMP${timestamp}${random}`;
    }
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'], 
    trim: true 
  },
  fatherName: {
    type: String,
    default: '',
    trim: true
  },
  username: { 
    type: String, 
    unique: true,
    sparse: true,
    trim: true, 
    lowercase: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    trim: true, 
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false 
  },
  role: { 
    type: String, 
    enum: ['admin', 'hr', 'employee', 'manager', 'team-lead'],
    default: 'employee' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  // Personal Information
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'male'
  },
  dateOfBirth: Date,
  bloodGroup: {
    type: String,
    enum: ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    default: ''
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed', 'separated'],
    default: 'single'
  },
  idCardNumber: {
    type: String,
    default: '',
    trim: true
  },
  idCardIssueDate: Date,
  idCardExpiryDate: Date,
  
  // Employment Information
  employeeType: {
    type: String,
    enum: ['permanent', 'contract', 'intern', 'probation', 'consultant', 'visitor', 'part-time', 'freelance', 'other'],
    default: 'permanent'
  },
  customEmployeeType: {
    type: String,
    default: ''
  },
  employmentStatus: {
    type: String,
    enum: ['active', 'on-leave', 'suspended', 'terminated', 'resigned'],
    default: 'active'
  },
  department: { 
    type: String, 
    default: 'General' 
  },
  customDepartment: {
    type: String,
    default: ''
  },
  position: { 
    type: String, 
    default: 'Employee' 
  },
  customPosition: {
    type: String,
    default: ''
  },
  joiningDate: { 
    type: Date, 
    default: Date.now 
  },
  probationPeriod: {
    type: String,
    enum: ['1', '2', '3', '6', '12', 'none', 'other'],
    default: '3'
  },
  customProbationPeriod: {
    type: String,
    default: ''
  },
  reportingManager: {
    type: String,
    default: ''
  },
  
  // Contact Information
  phone: { 
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        const digits = v.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
      },
      message: 'Phone number must be 10-15 digits'
    }
  },
  alternatePhone: {
    type: String,
    default: ''
  },
  
  // Address Information
  presentAddress: {
    type: String,
    default: ''
  },
  permanentAddress: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: 'Pakistan'
  },
  postalCode: {
    type: String,
    default: ''
  },
  
  // Emergency Contacts
  emergencyContacts: [{
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relation: { 
      type: String,
      enum: ['parent', 'spouse', 'sibling', 'child', 'friend', 'relative', 'colleague', 'other'],
      default: 'parent'
    }
  }],
  
  // Salary Information - IMPORTANT: These must exist
  salary: { 
    type: Number, 
    default: 50000,
    min: [0, 'Salary cannot be negative']
  },
  fuelAllowance: {
    type: Number,
    default: 0,
    min: 0
  },
  medicalAllowance: {
    type: Number,
    default: 0,
    min: 0
  },
  specialAllowance: {
    type: Number,
    default: 0,
    min: 0
  },
  otherAllowance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'PKR',
    enum: ['PKR', 'USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR'],
    trim: true
  },
  salaryFrequency: {
    type: String,
    default: 'monthly',
    enum: ['hourly', 'daily', 'weekly', 'bi-weekly', 'monthly', 'annually'],
    trim: true
  },
  
  // Bank Information
  bankName: {
    type: String,
    default: ''
  },
  bankAccountNumber: {
    type: String,
    default: ''
  },
  bankAccountTitle: {
    type: String,
    default: ''
  },
  bankBranchCode: {
    type: String,
    default: ''
  },
  ibanNumber: {
    type: String,
    default: ''
  },
  
  // Qualifications & Skills
  qualifications: {
    type: String,
    default: ''
  },
  experiences: [{
    company: String,
    position: String,
    duration: String,
    description: String
  }],
  skills: [{
    name: { type: String, required: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    }
  }],
  previousExperience: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Profile Information
  profilePicture: {
    type: String,
    default: ''
  },
  
  // System Information
  hasSystemAccess: {
    type: Boolean,
    default: true
  },
  
  // Custom roles
  customSystemRole: {
    type: String,
    default: ''
  },
  
  // Password Management
  passwordChanged: { 
    type: Boolean, 
    default: false 
  },
  lastPasswordChange: { 
    type: Date, 
    default: null 
  },
  passwordExpiryDate: {
    type: Date,
    default: function() {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 90);
      return expiry;
    }
  },
  passwordHistory: [{
    password: { type: String, required: true },
    changedAt: { type: Date, default: Date.now }
  }],
  temporaryPassword: {
    type: Boolean,
    default: true
  },
  
  // Leave Balance
  leaveBalance: {
    annual: { type: Number, default: 12 },
    casual: { type: Number, default: 7 },
    sick: { type: Number, default: 10 },
    earned: { type: Number, default: 5 },
    maternity: { type: Number, default: 180 },
    paternity: { type: Number, default: 15 }
  },

  // FIXED: Proper Map initialization with default function
  monthlyLeaveTracker: {
    type: Map,
    of: {
      leavesUsed: { type: Number, default: 0 },
      leavesAvailable: { type: Number, default: 2 },
      lastReset: { type: Date, default: Date.now }
    },
    default: () => {
      const now = new Date();
      const monthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;
      const map = new Map();
      map.set(monthYear, {
        leavesUsed: 0,
        leavesAvailable: 2,
        lastReset: now
      });
      return map;
    }
  },
  
  // Login Tracking
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },

  // Password Reset
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetTokenExpires: {
    type: Date,
    default: null
  },
  passwordResetTokenUsed: {
    type: Boolean,
    default: false
  },
  
  // Email notification tracking
  welcomeEmailSent: {
    type: Boolean,
    default: false
  },
  welcomeEmailSentAt: {
    type: Date,
    default: null
  },
  emailNotificationPreferences: {
    type: Map,
    of: Boolean,
    default: () => new Map([
      ['passwordReset', true],
      ['accountUpdates', true],
      ['securityAlerts', true]
    ])
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===== VIRTUAL FIELDS =====
userSchema.virtual('fullName').get(function() {
  return this.name;
});

userSchema.virtual('totalSalary').get(function() {
  const total = (this.salary || 0) + 
                (this.fuelAllowance || 0) + 
                (this.medicalAllowance || 0) + 
                (this.specialAllowance || 0) + 
                (this.otherAllowance || 0);
  return total;
});

userSchema.virtual('formattedSalary').get(function() {
  if (!this.totalSalary || this.totalSalary <= 0) return 'Not Set';
  
  const currencySymbols = {
    'PKR': '₨',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'AED': 'د.إ',
    'SAR': 'ر.س'
  };
  
  const symbol = currencySymbols[this.currency] || this.currency;
  const formattedAmount = this.totalSalary.toLocaleString();
  
  return `${symbol}${formattedAmount} per ${this.salaryFrequency}`;
});

// ===== MIDDLEWARE =====
userSchema.pre('save', async function(next) {
  console.log('🔄 User pre-save hook triggered for:', this.email);
  
  // Set username from email if not provided
  if (!this.username && this.email) {
    this.username = this.email.split('@')[0].toLowerCase();
  }
  
  // Ensure monthlyLeaveTracker is properly initialized as Map
  if (!this.monthlyLeaveTracker || !(this.monthlyLeaveTracker instanceof Map)) {
    console.log('📊 Initializing monthlyLeaveTracker as Map');
    const now = new Date();
    const monthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;
    this.monthlyLeaveTracker = new Map();
    this.monthlyLeaveTracker.set(monthYear, {
      leavesUsed: 0,
      leavesAvailable: 2,
      lastReset: now
    });
  }
  
  // Only hash password if it's modified
  if (this.isModified('password')) {
    console.log('🔑 Password is being modified');
    try {
      const currentPassword = this.password;
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(currentPassword, salt);
      
      if (!this.passwordHistory) {
        this.passwordHistory = [];
      }
      
      if (this.passwordHistory.length >= 5) {
        this.passwordHistory.shift();
      }
      
      this.passwordHistory.push({
        password: this.password,
        changedAt: new Date()
      });
      
      this.passwordChanged = true;
      this.lastPasswordChange = new Date();
      this.temporaryPassword = false;
      
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 90);
      this.passwordExpiryDate = expiry;
      
    } catch (error) {
      console.error('❌ Password hashing error:', error);
      return next(error);
    }
  }
  
  // Ensure leaveBalance exists
  if (!this.leaveBalance || typeof this.leaveBalance !== 'object') {
    this.leaveBalance = {};
  }
  
  const defaultBalances = {
    annual: 12,
    casual: 7,
    sick: 10,
    earned: 5,
    maternity: 180,
    paternity: 15
  };
  
  Object.keys(defaultBalances).forEach(type => {
    if (this.leaveBalance[type] === undefined || this.leaveBalance[type] === null) {
      this.leaveBalance[type] = defaultBalances[type];
    }
  });
  
  next();
});

// ===== INSTANCE METHODS =====
userSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    if (this.isLocked) {
      console.log('🔒 Account is locked');
      return false;
    }
    
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    
    if (!isMatch) {
      this.loginAttempts += 1;
      console.log(`❌ Login failed. Attempt ${this.loginAttempts}`);
      
      if (this.loginAttempts >= 5) {
        this.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        console.log('🔒 Account locked for 30 minutes');
      }
      
      await this.save();
    } else {
      this.loginAttempts = 0;
      this.lockUntil = null;
      this.lastLogin = new Date();
      await this.save();
      console.log('✅ Login successful');
    }
    
    return isMatch;
  } catch (error) {
    console.error('❌ Password match error:', error);
    return false;
  }
};

userSchema.methods.getCurrentMonthTracker = function() {
  if (!this.monthlyLeaveTracker || !(this.monthlyLeaveTracker instanceof Map)) {
    const now = new Date();
    const monthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;
    this.monthlyLeaveTracker = new Map();
    this.monthlyLeaveTracker.set(monthYear, {
      leavesUsed: 0,
      leavesAvailable: 2,
      lastReset: now
    });
  }
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthYear = `${currentMonth}-${currentYear}`;
  
  let tracker = this.monthlyLeaveTracker.get(monthYear);
  
  if (!tracker) {
    tracker = {
      leavesUsed: 0,
      leavesAvailable: 2,
      lastReset: now
    };
    this.monthlyLeaveTracker.set(monthYear, tracker);
  }
  
  return tracker;
};

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ===== STATIC METHODS =====
userSchema.statics.generateRandomPassword = function(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// ===== INDEXES =====
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ salary: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 'text', email: 'text', employeeId: 'text' });

module.exports = mongoose.model('User', userSchema);