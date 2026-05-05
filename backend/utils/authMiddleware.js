const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

// ================= PROTECT MIDDLEWARE =================
const protect = async (req, res, next) => {
  let token;

  try {
    console.log('🔐 [PROTECT] Checking authentication...');
    
    // 1. Check Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token found in Authorization header');
    }
    // 2. Check cookies (for web clients)
    else if (req.cookies?.token) {
      token = req.cookies.token;
      console.log('✅ Token found in cookies');
    }

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
    }

    // 3. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token verified for user ID:', decoded.id);

    // 4. Find User with additional checks
    const user = await User.findById(decoded.id).select('-password -passwordHistory -passwordResetToken');

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({
        success: false,
        error: 'User no longer exists.',
      });
    }

    // 5. Check if user is active
    if (user.isActive === false) {
      console.log('❌ Account is deactivated');
      return res.status(403).json({
        success: false,
        error: 'Account deactivated. Contact administrator.',
      });
    }

    // 6. Attach user to request with full info
    req.user = {
      _id: user._id,
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role || user.systemRole || 'employee',
      systemRole: user.systemRole || user.role || 'employee',
      isActive: user.isActive,
      profilePicture: user.profilePicture
    };

    console.log('✅ User authenticated:', {
      id: req.user._id,
      role: req.user.role,
      systemRole: req.user.systemRole,
      email: req.user.email
    });

    // 7. Update last login (optional - remove if causing performance issues)
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).catch(err => console.log('Last login update skipped:', err.message));

    next();
  } catch (err) {
    console.error('❌ AUTH ERROR:', err.message);

    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: 'Authentication failed.',
      code: 'AUTH_FAILED'
    });
  }
};

// ================= AUTHORIZE MIDDLEWARE (Dynamic Roles) =================
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('🔐 [AUTHORIZE] Checking authorization...');
    console.log('📋 Required roles:', allowedRoles);
    
    if (!req.user) {
      console.log('❌ No user object in request');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated.',
      });
    }

    // Convert single string to array if needed
    const roles = Array.isArray(allowedRoles[0]) 
      ? allowedRoles[0] 
      : allowedRoles;

    // Get user role (check both role and systemRole fields)
    const userRole = req.user.role || req.user.systemRole;
    
    console.log('👤 User role:', userRole);
    console.log('🔑 Required roles:', roles);
    
    // Check if user has required role
    const hasRole = roles.includes(userRole);
    
    if (!hasRole) {
      console.log(`❌ Access denied. User role: ${userRole}, Required: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${userRole}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    console.log('✅ Authorization successful');
    next();
  };
};

// ================= OPTIONAL AUTH (For public routes that may have auth) =================
const optionalAuth = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = {
          _id: user._id,
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role || user.systemRole || 'employee',
          systemRole: user.systemRole || user.role || 'employee',
          isActive: user.isActive,
          profilePicture: user.profilePicture
        };
        console.log('✅ Optional auth: User attached');
      }
    }
  } catch (err) {
    // Silently fail for optional auth
    console.log('Optional auth failed (non-critical):', err.message);
  }

  next();
};

// ================= CHECK ROLE HELPER =================
const checkRole = (req, role) => {
  const userRole = req.user?.role || req.user?.systemRole;
  return userRole === role;
};

const hasAnyRole = (req, roles) => {
  const userRole = req.user?.role || req.user?.systemRole;
  return roles.includes(userRole);
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  checkRole,
  hasAnyRole
};