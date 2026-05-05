// hr/components/HRDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import {
  FaUsers, FaBriefcase, FaCalendarAlt, FaMoneyBillWave,
  FaEnvelope, FaUserClock, FaFileAlt, FaChartLine,
  FaBell, FaClipboardList, FaUserTie, FaHandshake,
  FaCheckCircle, FaClock, FaSpinner, FaEye,
  FaDownload, FaPlus, FaArrowRight
} from 'react-icons/fa';

// ─── UI Components ───────────────────────────────────────────────────────────

const StatCard = ({ title, value, change, icon, color, link }) => {
  const navigate = useNavigate();
  const colors = {
    blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-500',
    red: 'bg-red-500', purple: 'bg-purple-500', indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500', orange: 'bg-orange-500'
  };
  
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => link && navigate(link)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-xs mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]} shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const QuickActionCard = ({ icon: Icon, title, description, onClick, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
    red: 'bg-red-50 text-red-600 group-hover:bg-red-100',
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
  };
  
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all w-full text-left"
    >
      <div className={`p-3 rounded-xl ${colors[color]} transition-colors`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <FaArrowRight className="text-gray-400 group-hover:text-gray-600 transition-colors" />
    </button>
  );
};

const ActivityItem = ({ icon: Icon, title, time, description, status }) => (
  <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
    <div className="p-2 bg-gray-100 rounded-lg">
      <Icon className="w-4 h-4 text-gray-600" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      {status && <Badge variant={status === 'approved' ? 'success' : status === 'pending' ? 'warning' : 'danger'}>{status}</Badge>}
    </div>
  </div>
);

// ─── Main Dashboard Component ─────────────────────────────────────────────────

const HRDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEmployees: 0,
      activeJobs: 0,
      pendingLeaves: 0,
      pendingApprovals: 0,
      newMessages: 0,
      processedPayrolls: 0,
      pendingPayrolls: 0,
      totalPayrollAmount: 0,
      attendanceRate: 0,
      newHires: 0,
      departmentsCount: 0
    },
    recentActivities: [],
    pendingActions: [],
    upcomingEvents: [],
    quickStats: {}
  });

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Parallel API calls
      const [
        statsRes,
        employeesRes,
        recruitmentRes,
        leavesRes,
        messagesRes,
        attendanceRes,
        payrollRes
      ] = await Promise.allSettled([
        axiosInstance.get('/hr/dashboard/stats'),
        axiosInstance.get('/hr/employees/count'),
        axiosInstance.get('/recruitment/jobs'),
        axiosInstance.get('/leaves/pending'),
        axiosInstance.get('/messages?status=pending-approval'),
        axiosInstance.get('/attendance/today-stats'),
        axiosInstance.get('/hr/payroll/summary')
      ]);

      // Process Stats
      let stats = {
        totalEmployees: 0,
        activeJobs: 0,
        pendingLeaves: 0,
        pendingApprovals: 0,
        newMessages: 0,
        processedPayrolls: 0,
        pendingPayrolls: 0,
        totalPayrollAmount: 0,
        attendanceRate: 0,
        newHires: 0,
        departmentsCount: 0
      };

      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.success) {
        stats = { ...stats, ...statsRes.value.data.data };
      }

      if (employeesRes.status === 'fulfilled' && employeesRes.value?.data?.success) {
        stats.totalEmployees = employeesRes.value.data.data?.total || 0;
      }

      if (recruitmentRes.status === 'fulfilled' && recruitmentRes.value?.data?.success) {
        const jobs = recruitmentRes.value.data.data || [];
        stats.activeJobs = jobs.filter(j => j.status === 'Open').length;
      }

      if (leavesRes.status === 'fulfilled' && leavesRes.value?.data?.success) {
        stats.pendingLeaves = leavesRes.value.data.data?.length || 0;
      }

      if (messagesRes.status === 'fulfilled' && messagesRes.value?.data?.success) {
        stats.pendingApprovals = messagesRes.value.data.data?.length || 0;
        stats.newMessages = messagesRes.value.data.data?.filter(m => m.status === 'new').length || 0;
      }

      if (payrollRes.status === 'fulfilled' && payrollRes.value?.data?.success) {
        const payroll = payrollRes.value.data.data || {};
        stats.processedPayrolls = payroll.processed || 0;
        stats.pendingPayrolls = payroll.pending || 0;
        stats.totalPayrollAmount = payroll.totalAmount || 0;
      }

      setDashboardData(prev => ({ ...prev, stats }));

      // Fetch recent activities
      try {
        const activityRes = await axiosInstance.get('/hr/dashboard/recent-activities');
        if (activityRes.data?.success) {
          setDashboardData(prev => ({ ...prev, recentActivities: activityRes.data.data || [] }));
        }
      } catch (e) { console.log('Activities fetch failed:', e); }

      // Fetch pending actions
      try {
        const pendingRes = await axiosInstance.get('/hr/dashboard/pending-actions');
        if (pendingRes.data?.success) {
          setDashboardData(prev => ({ ...prev, pendingActions: pendingRes.data.data || [] }));
        }
      } catch (e) { console.log('Pending actions fetch failed:', e); }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default stats for demo
      setDashboardData(prev => ({
        ...prev,
        stats: {
          totalEmployees: 125,
          activeJobs: 8,
          pendingLeaves: 5,
          pendingApprovals: 3,
          newMessages: 12,
          processedPayrolls: 42,
          pendingPayrolls: 8,
          totalPayrollAmount: 2850000,
          attendanceRate: 94,
          newHires: 4,
          departmentsCount: 6
        },
        recentActivities: [
          { id: 1, type: 'leave', title: 'Leave Request', time: '2 hours ago', description: 'John Doe requested annual leave', status: 'pending' },
          { id: 2, type: 'hiring', title: 'New Candidate', time: '5 hours ago', description: 'Sarah applied for Senior Developer position', status: 'new' },
          { id: 3, type: 'payroll', title: 'Payroll Processed', time: 'Yesterday', description: 'September payroll processed successfully', status: 'approved' }
        ],
        pendingActions: [
          { id: 1, type: 'leave', title: 'Leave Approval', count: 5, link: '/hr/leave' },
          { id: 2, type: 'recruitment', title: 'Candidates to Review', count: 12, link: '/hr/recruitment' },
          { id: 3, type: 'payroll', title: 'Pending Payroll', count: 8, link: '/hr/payroll' },
          { id: 4, type: 'messages', title: 'Unread Messages', count: 12, link: '/hr/messages' }
        ]
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-indigo-600 text-3xl mx-auto mb-4" />
          <p className="text-gray-600">Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  const { stats, recentActivities, pendingActions } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaUserTie className="text-indigo-500" />
                HR Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back! Here's what's happening with your workforce today.
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <FaSpinner className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            change="+12"
            icon={<FaUsers className="text-white text-lg" />}
            color="blue"
            link="/hr/employees"
          />
          <StatCard
            title="Active Jobs"
            value={stats.activeJobs}
            icon={<FaBriefcase className="text-white text-lg" />}
            color="green"
            link="/hr/recruitment"
          />
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaves}
            icon={<FaCalendarAlt className="text-white text-lg" />}
            color="yellow"
            link="/hr/leave"
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={<FaBell className="text-white text-lg" />}
            color="red"
            link="/hr/messages"
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="New Messages"
            value={stats.newMessages}
            icon={<FaEnvelope className="text-white text-lg" />}
            color="purple"
            link="/hr/messages"
          />
          <StatCard
            title="Attendance Rate"
            value={`${stats.attendanceRate}%`}
            icon={<FaUserClock className="text-white text-lg" />}
            color="emerald"
          />
          <StatCard
            title="Total Payroll"
            value={`PKR ${(stats.totalPayrollAmount / 1000000).toFixed(1)}M`}
            icon={<FaMoneyBillWave className="text-white text-lg" />}
            color="orange"
            link="/hr/payroll"
          />
          <StatCard
            title="New Hires"
            value={stats.newHires}
            change="+3"
            icon={<FaHandshake className="text-white text-lg" />}
            color="indigo"
            link="/hr/employees"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickActionCard
              icon={FaPlus}
              title="Post New Job"
              description="Create and publish job openings"
              onClick={() => navigate('/hr/recruitment')}
              color="blue"
            />
            <QuickActionCard
              icon={FaClipboardList}
              title="Process Leave Requests"
              description="Review and approve employee leaves"
              onClick={() => navigate('/hr/leave')}
              color="green"
            />
            <QuickActionCard
              icon={FaFileAlt}
              title="View Payroll"
              description="View employee payroll records"
              onClick={() => navigate('/hr/payroll')}
              color="purple"
            />
            <QuickActionCard
              icon={FaEnvelope}
              title="Send Announcement"
              description="Communicate with employees"
              onClick={() => navigate('/hr/messages/compose')}
              color="orange"
            />
            <QuickActionCard
              icon={FaUsers}
              title="Employee Management"
              description="Add or edit employee records"
              onClick={() => navigate('/hr/employees')}
              color="indigo"
            />
            <QuickActionCard
              icon={FaChartLine}
              title="View Reports"
              description="Generate HR analytics reports"
              onClick={() => alert('Reports coming soon')}
              color="red"
            />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                  <p className="text-sm text-gray-500">Latest updates from your team</p>
                </div>
                <button className="text-sm text-indigo-600 hover:text-indigo-700">View All</button>
              </div>
            </div>
            <div className="p-4 divide-y divide-gray-100">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No recent activities</div>
              ) : (
                recentActivities.map((activity, idx) => (
                  <ActivityItem
                    key={idx}
                    icon={activity.type === 'leave' ? FaCalendarAlt : activity.type === 'hiring' ? FaBriefcase : FaMoneyBillWave}
                    title={activity.title}
                    time={activity.time}
                    description={activity.description}
                    status={activity.status}
                  />
                ))
              )}
            </div>
          </div>

          {/* Pending Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Pending Actions</h2>
                  <p className="text-sm text-gray-500">Items requiring your attention</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {pendingActions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">All caught up!</div>
              ) : (
                pendingActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(action.link)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        action.type === 'leave' ? 'bg-yellow-100' :
                        action.type === 'recruitment' ? 'bg-blue-100' :
                        action.type === 'payroll' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        {action.type === 'leave' ? <FaCalendarAlt className="text-yellow-600" /> :
                         action.type === 'recruitment' ? <FaBriefcase className="text-blue-600" /> :
                         action.type === 'payroll' ? <FaMoneyBillWave className="text-green-600" /> :
                         <FaEnvelope className="text-purple-600" />}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.count} items pending</p>
                      </div>
                    </div>
                    <FaArrowRight className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Department Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Department Overview</h2>
            <p className="text-sm text-gray-500">Employee distribution by department</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'Engineering', count: 42, color: 'blue' },
                { name: 'Product', count: 12, color: 'purple' },
                { name: 'Design', count: 8, color: 'pink' },
                { name: 'Marketing', count: 15, color: 'green' },
                { name: 'Sales', count: 20, color: 'orange' },
                { name: 'HR', count: 6, color: 'indigo' }
              ].map(dept => (
                <div key={dept.name} className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-600">{dept.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{dept.count}</p>
                  <p className="text-xs text-gray-400">employees</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Important Notice - Payroll */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FaMoneyBillWave className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-800">Payroll Information</h3>
              <p className="text-xs text-amber-700 mt-1">
                Your personal payroll records are available in the Payroll section. 
                Payroll processing for employees is managed by the finance team.
              </p>
              <button 
                onClick={() => navigate('/hr/payroll')}
                className="mt-2 text-xs font-medium text-amber-800 hover:text-amber-900 underline"
              >
                View Payroll →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;