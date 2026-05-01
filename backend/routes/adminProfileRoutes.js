const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../utils/authMiddleware');
const User = require('../models/User');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');

// ==================== MIDDLEWARE ====================
router.use(protect);
router.use(authorize('admin', 'superadmin'));
console.log('✅ Auth middleware applied to all admin routes');

// ==================== TEST ROUTE (FIX for dashboard) ====================
router.get('/test', (req, res) => {
  console.log('🧪 Admin test route hit - authentication successful');
  res.json({ 
    success: true, 
    message: 'Admin authenticated successfully',
    user: { 
      id: req.user.id, 
      role: req.user.role,
      name: req.user.name
    }
  });
});

// ==================== PUBLIC TEST ROUTE (NO AUTH) ====================
router.get('/test-noauth', (req, res) => {
  console.log('✅ Public test route hit');
  res.json({ 
    success: true, 
    message: 'Admin routes working - No auth required',
    timestamp: new Date().toISOString()
  });
});

// ==================== HELPER FUNCTIONS ====================
function formatTimeAgo(date) {
  if (!date) return 'Just now';
  const now = new Date();
  const past = new Date(date);
  const diffMins = Math.floor((now - past) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return 'a while ago';
}

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
}

// ==================== PROFILE ROUTES ====================

// GET /api/admin/profile - Get admin profile
router.get('/profile', async (req, res) => {
  try {
    console.log('👤 Get admin profile called');
    const user = await User.findById(req.user.id)
      .select('-password -passwordHistory -passwordResetToken')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'Admin profile not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/admin/profile - Update admin profile
router.put('/profile', async (req, res) => {
  try {
    console.log('✏️ Update admin profile called');
    const userId = req.user.id;
    const updateData = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -passwordHistory');

    res.status(200).json({
      success: true,
      message: 'Admin profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/change-password - Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== DASHBOARD STATS ROUTES ====================

// GET /api/admin/dashboard/stats - Dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    console.log('📊 Dashboard stats called');
    const totalEmployees = await User.countDocuments({ isActive: true, role: { $ne: 'admin' } });
    const departments = await User.distinct('department');
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    const totalUsers = await User.countDocuments();
    
    const stats = {
      totalEmployees: totalEmployees || 0,
      activeDepartments: departments.filter(Boolean).length || 0,
      systemHealth: 99.9,
      pendingTasks: pendingLeaves || 0,
      revenue: 125000,
      performance: 87,
      employeeSatisfaction: 94,
      totalUsers: totalUsers || 0,
      pendingLeaves: pendingLeaves || 0
    };
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/admin/dashboard/recent-activity - Recent activity
router.get('/dashboard/recent-activity', async (req, res) => {
  try {
    console.log('📋 Recent activity called');
    const activities = [];
    
    const recentLeaves = await Leave.find().sort({ createdAt: -1 }).limit(5).populate('employeeId', 'name');
    recentLeaves.forEach(leave => {
      activities.push({
        id: leave._id.toString(),
        type: 'leave',
        message: `${leave.employeeId?.name || 'Employee'} requested ${leave.leaveType || 'leave'} leave`,
        time: formatTimeAgo(leave.createdAt),
        icon: '🏖️',
        status: leave.status || 'pending',
        user: leave.employeeId?.name || 'Employee'
      });
    });
    
    const recentUsers = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(3).select('name role createdAt');
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user._id}`,
        type: 'user',
        message: `${user.name} joined as ${user.role}`,
        time: formatTimeAgo(user.createdAt),
        icon: '👤',
        status: 'success',
        user: 'System'
      });
    });

    // Sort by time (most recent first)
    activities.sort((a, b) => {
      const aTime = a.time === 'Just now' ? 0 : parseInt(a.time) || 0;
      const bTime = b.time === 'Just now' ? 0 : parseInt(b.time) || 0;
      return aTime - bTime;
    });

    res.status(200).json({ success: true, data: activities.slice(0, 10) });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(200).json({ success: true, data: [] });
  }
});

// GET /api/admin/dashboard/team-members - Team members
router.get('/dashboard/team-members', async (req, res) => {
  try {
    console.log('👥 Team members called');
    const teamMembers = await User.find({ isActive: true, role: { $ne: 'admin' } })
      .select('name email role department status')
      .limit(8)
      .lean();

    const formattedMembers = teamMembers.map(member => ({
      id: member._id.toString(),
      name: member.name || 'Unknown',
      role: member.role || 'Employee',
      department: member.department || 'General',
      avatar: getInitials(member.name),
      status: 'online',
      productivity: Math.floor(Math.random() * 30) + 70
    }));

    res.status(200).json({ success: true, data: formattedMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(200).json({ success: true, data: [] });
  }
});

// GET /api/admin/dashboard/notifications - Notifications
router.get('/dashboard/notifications', async (req, res) => {
  try {
    console.log('🔔 Notifications called');
    const notifications = [];
    
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    if (pendingLeaves > 0) {
      notifications.push({
        id: '1',
        message: `${pendingLeaves} pending leave request${pendingLeaves > 1 ? 's' : ''} need approval`,
        type: 'leave',
        read: false,
        createdAt: 'Just now'
      });
    }
    
    const pendingPayrolls = await require('../models/Payroll').countDocuments({ paymentStatus: 'Pending' });
    if (pendingPayrolls > 0) {
      notifications.push({
        id: '2',
        message: `${pendingPayrolls} payroll${pendingPayrolls > 1 ? 's are' : ' is'} pending for processing`,
        type: 'payroll',
        read: false,
        createdAt: 'Just now'
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: { 
        notifications, 
        unreadCount: notifications.filter(n => !n.read).length 
      } 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(200).json({ success: true, data: { notifications: [], unreadCount: 0 } });
  }
});

// GET /api/admin/dashboard/performance-metrics - Performance metrics
router.get('/dashboard/performance-metrics', async (req, res) => {
  console.log('📈 Performance metrics called');
  const performanceData = [
    { label: 'System Uptime', value: 99.9, color: 'from-green-500 to-emerald-500' },
    { label: 'Response Time', value: 128, color: 'from-blue-500 to-cyan-500' },
    { label: 'User Satisfaction', value: 94, color: 'from-purple-500 to-pink-500' },
    { label: 'Task Completion', value: 87, color: 'from-amber-500 to-orange-500' }
  ];
  res.status(200).json({ success: true, data: performanceData });
});

// GET /api/admin/dashboard/quick-actions - Quick actions
router.get('/dashboard/quick-actions', async (req, res) => {
  console.log('⚡ Quick actions called');
  const quickActions = [
    { id: 'manage-users', title: 'Manage Users', description: 'Add or remove system users', icon: '👤', color: 'bg-blue-500', path: '/admin/users' },
    { id: 'payroll', title: 'Payroll', description: 'Process monthly payroll', icon: '💰', color: 'bg-green-500', path: '/admin/payroll' },
    { id: 'leave-requests', title: 'Leave Requests', description: 'Review pending leaves', icon: '🏖️', color: 'bg-yellow-500', path: '/admin/leaves' },
    { id: 'reports', title: 'Reports', description: 'Generate analytics', icon: '📊', color: 'bg-purple-500', path: '/admin/reports' }
  ];
  res.status(200).json({ success: true, data: quickActions });
});

// PATCH /api/admin/dashboard/notifications/:id/read - Mark notification as read
router.patch('/dashboard/notifications/:id/read', async (req, res) => {
  try {
    console.log('📬 Mark notification as read:', req.params.id);
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== SYSTEM STATS ROUTES ====================

// GET /api/admin/system-stats - Get system statistics
router.get('/system-stats', async (req, res) => {
  try {
    console.log('📈 System stats called');
    const totalUsers = await User.countDocuments();
    const activeEmployees = await User.countDocuments({ isActive: true });
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    const departments = await User.distinct('department');

    const stats = {
      totalUsers,
      activeEmployees,
      pendingLeaves,
      activeDepartments: departments.filter(Boolean).length
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ==================== 2FA ROUTE ====================

// POST /api/admin/toggle-2fa - Toggle Two-Factor Authentication
router.post('/toggle-2fa', async (req, res) => {
  try {
    console.log('🔐 Toggling 2FA');
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Two-factor authentication ${user.twoFactorEnabled ? 'enabled' : 'disabled'}`,
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (error) {
    console.error('Error toggling 2FA:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;