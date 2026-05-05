// hr/components/HRPayrollDashboard.jsx - FIXED VERSION

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Download, FileSpreadsheet, CheckCircle, Clock,
  Filter, RefreshCw, Eye, Printer,
  ChevronLeft, ChevronRight, DollarSign,
  User, Calendar, Building, Briefcase, Users,
  X, AlertCircle
} from 'lucide-react';

// Badge Component
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

// KPI Card Component
const KpiCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-500',
    purple: 'bg-purple-500', indigo: 'bg-indigo-500', emerald: 'bg-emerald-500'
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Payslip Modal Component
const PayslipModal = ({ isOpen, onClose, payroll, isHR, onDownload }) => {
  const [payslipHtml, setPayslipHtml] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && payroll) {
      fetchPayslip();
    }
  }, [isOpen, payroll]);

  const fetchPayslip = async () => {
    if (!payroll) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = isHR
        ? `http://localhost:5000/api/hr/payroll/my-payslip/${payroll._id}`
        : `http://localhost:5000/api/hr/payroll/payslip-view/${payroll._id}`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text'
      });
      
      if (response.data) {
        setPayslipHtml(response.data);
      } else {
        setError('No data received');
      }
    } catch (err) {
      console.error('Error fetching payslip:', err);
      setError(err.response?.data || 'Failed to load payslip');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!payroll) return;
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = isHR
        ? `http://localhost:5000/api/hr/payroll/my-payslip/${payroll._id}/download`
        : `http://localhost:5000/api/hr/payroll/payslip-download/${payroll._id}`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${payroll.employeeCode || 'HR'}_${payroll.month}_${payroll.year}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download payslip');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Payslip - {payroll?.employeeName || 'HR Manager'}
            </h3>
            <p className="text-sm text-gray-500">
              {payroll?.month} {payroll?.year}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading payslip...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-red-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                <p>{error}</p>
                <button 
                  onClick={fetchPayslip}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : payslipHtml ? (
            <iframe
              srcDoc={payslipHtml}
              title="Payslip"
              className="w-full h-[calc(90vh-120px)] border-0 bg-white rounded-lg"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No payslip data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Create axios instance
const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const HRPayrollDashboard = () => {
  const [allPayrolls, setAllPayrolls] = useState([]);
  const [myPayroll, setMyPayroll] = useState(null);
  const [myPayrollHistory, setMyPayrollHistory] = useState([]);
  const [stats, setStats] = useState({
    totalPayrolls: 0,
    pendingPayments: 0,
    paidPayments: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    year: new Date().getFullYear().toString(), 
    month: 'all', 
    status: 'all',
    page: 1, 
    limit: 10 
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, currentPage: 1 });
  const [monthsYears, setMonthsYears] = useState({ months: [], years: [] });
  const [exportLoading, setExportLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isHRPayroll, setIsHRPayroll] = useState(false);

  const axiosInstance = createAxiosInstance();

  // Get current user from token
  const getCurrentUser = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
        return payload;
      }
    } catch (e) {
      console.error('Error parsing token:', e);
    }
    return null;
  }, []);

  // Calculate total salary
  const calculateTotalSalary = (payroll) => {
    return (payroll.salary || 0) + (payroll.fuelAllowance || 0) + 
           (payroll.medicalAllowance || 0) + (payroll.specialAllowance || 0) + 
           (payroll.otherAllowance || 0);
  };

  // Fetch HR's own current payroll
  const fetchMyCurrentPayroll = async () => {
    try {
      console.log('📊 Fetching HR current payroll...');
      const response = await axiosInstance.get('/hr/payroll/my-salary');
      
      if (response.data?.success && response.data?.data?.currentPayroll) {
        setMyPayroll(response.data.data.currentPayroll);
      } else if (response.data?.success && response.data?.data) {
        setMyPayroll(response.data.data);
      } else {
        setMyPayroll(null);
      }
    } catch (error) {
      console.error('Error fetching my current payroll:', error);
      setMyPayroll(null);
    }
  };

  // Fetch HR's own payroll history
  const fetchMyPayrollHistory = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await axiosInstance.get(`/hr/payroll/my-payrolls?year=${currentYear}`);
      
      if (response.data?.success && response.data?.data) {
        setMyPayrollHistory(response.data.data);
      } else {
        setMyPayrollHistory([]);
      }
    } catch (error) {
      console.error('Error fetching my payroll history:', error);
      setMyPayrollHistory([]);
    }
  };

  // Fetch all employees payrolls
  const fetchAllPayrolls = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });
      
      if (filters.year && filters.year !== 'all') params.append('year', filters.year);
      if (filters.month && filters.month !== 'all') params.append('month', filters.month);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      
      const response = await axiosInstance.get(`/hr/payroll/all-payrolls?${params.toString()}`);
      
      if (response.data?.success) {
        let payrollData = response.data.data || [];
        
        // Filter out HR's own payroll from all payrolls
        if (currentUser?.email) {
          payrollData = payrollData.filter(p => p.employeeEmail !== currentUser.email);
        }
        
        setAllPayrolls(payrollData);
        setPagination({
          total: response.data.total || payrollData.length,
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || 1
        });
        
        setStats({
          totalPayrolls: response.data.total || payrollData.length,
          pendingPayments: payrollData.filter(p => p.paymentStatus === 'Pending').length,
          paidPayments: payrollData.filter(p => p.paymentStatus === 'Paid').length,
          totalAmount: payrollData.reduce((sum, p) => sum + calculateTotalSalary(p), 0)
        });
      }
    } catch (error) {
      console.error('Error fetching all payrolls:', error);
      setAllPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch months and years for filters
  const fetchMonthsYears = async () => {
    try {
      const response = await axiosInstance.get('/hr/payroll/months-years');
      
      if (response.data?.success && response.data?.data) {
        setMonthsYears(response.data.data);
      } else {
        const currentYear = new Date().getFullYear();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
        setMonthsYears({ months, years });
      }
    } catch (error) {
      console.error('Error fetching months/years:', error);
      const currentYear = new Date().getFullYear();
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
      setMonthsYears({ months, years });
    }
  };

  // ✅ FIXED: Open payslip modal
  const handleViewPayslip = (payroll, isHR = false) => {
    setSelectedPayroll(payroll);
    setIsHRPayroll(isHR);
    setModalOpen(true);
  };

  // Download payslip directly
  const handleDownloadPayslip = async (payroll, isHR = false) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isHR
        ? `http://localhost:5000/api/hr/payroll/my-payslip/${payroll._id}/download`
        : `http://localhost:5000/api/hr/payroll/payslip-download/${payroll._id}`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${payroll.employeeCode || 'HR'}_${payroll.month}_${payroll.year}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download payslip');
    }
  };

  // Export to Excel
  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);
      
      const params = new URLSearchParams();
      if (filters.year && filters.year !== 'all') params.append('year', filters.year);
      if (filters.month && filters.month !== 'all') params.append('month', filters.month);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      
      const response = await axiosInstance.get(`/hr/payroll/all-payrolls?${params.toString()}&limit=10000`);
      
      if (response.data?.success && response.data?.data) {
        const payrollData = response.data.data;
        const XLSX = await import('xlsx');
        
        const excelData = payrollData.map((p, i) => ({
          'SR #': i + 1,
          'Employee ID': p.employeeCode || 'N/A',
          'Employee Name': p.employeeName || 'N/A',
          'Email': p.employeeEmail || 'N/A',
          'Department': p.employeeDepartment || 'N/A',
          'Position': p.employeePosition || 'N/A',
          'Month': p.month,
          'Year': p.year,
          'Basic Salary': p.salary || 0,
          'Fuel Allowance': p.fuelAllowance || 0,
          'Medical Allowance': p.medicalAllowance || 0,
          'Special Allowance': p.specialAllowance || 0,
          'Other Allowance': p.otherAllowance || 0,
          'Total Salary': calculateTotalSalary(p),
          'Status': p.paymentStatus || 'Pending',
          'Payment Date': p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, 'Employee Payroll Records');
        XLSX.writeFile(wb, `Payroll_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
        alert(`Exported ${excelData.length} records!`);
      } else {
        alert('No data to export');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters({ ...filters, page: newPage });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleResetFilters = () => {
    setFilters({
      year: new Date().getFullYear().toString(),
      month: 'all',
      status: 'all',
      page: 1,
      limit: 10
    });
  };

  const StatusBadge = ({ status }) => {
    if (status === 'Paid') return <Badge variant="success">Paid</Badge>;
    if (status === 'Pending') return <Badge variant="warning">Pending</Badge>;
    return <Badge variant="default">{status || 'Pending'}</Badge>;
  };

  // Initialize data fetching
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchMyCurrentPayroll();
      fetchMyPayrollHistory();
      fetchMonthsYears();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchAllPayrolls();
    }
  }, [filters, currentUser]);

  if (loading && allPayrolls.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  const myCurrentTotal = myPayroll ? calculateTotalSalary(myPayroll) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Payslip Modal */}
      <PayslipModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPayroll(null);
        }}
        payroll={selectedPayroll}
        isHR={isHRPayroll}
        onDownload={handleDownloadPayslip}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-sm text-gray-500 mt-1">View your salary and employee payroll records</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <KpiCard title="Total Employees" value={pagination.total || stats.totalPayrolls} icon={<Users className="w-6 h-6 text-white" />} color="blue" />
          <KpiCard title="Paid This Month" value={stats.paidPayments || 0} icon={<CheckCircle className="w-6 h-6 text-white" />} color="green" />
          <KpiCard title="Pending Payments" value={stats.pendingPayments || 0} icon={<Clock className="w-6 h-6 text-white" />} color="yellow" />
          <KpiCard title="Total Payroll" value={`PKR ${(stats.totalAmount / 1000000).toFixed(1)}M`} icon={<DollarSign className="w-6 h-6 text-white" />} color="purple" />
        </div>

        {/* HR's OWN PAYROLL SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  My Payroll - Current Month
                </h2>
                <p className="text-indigo-200 text-sm mt-1">
                  {myPayroll ? `${myPayroll.month} ${myPayroll.year}` : 'No payroll record found'}
                </p>
              </div>
              {myPayroll && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewPayslip(myPayroll, true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" /> View Payslip
                  </button>
                  <button
                    onClick={() => handleDownloadPayslip(myPayroll, true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Download
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {myPayroll ? (
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500">Net Salary</p>
                  <p className="text-xl font-bold text-emerald-600">PKR {myCurrentTotal.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500">Basic Salary</p>
                  <p className="text-lg font-semibold text-gray-800">PKR {(myPayroll.salary || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500">Total Allowances</p>
                  <p className="text-lg font-semibold text-blue-600">PKR {((myPayroll.fuelAllowance || 0) + (myPayroll.medicalAllowance || 0) + (myPayroll.specialAllowance || 0) + (myPayroll.otherAllowance || 0)).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500">Status</p>
                  <StatusBadge status={myPayroll.paymentStatus} />
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500">Month</p>
                  <p className="text-sm font-medium text-gray-800">{myPayroll.month} {myPayroll.year}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-800">{myPayroll.employeeDepartment || 'Human Resources'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No payroll record found for current month</p>
            </div>
          )}
        </div>

        {/* My Payroll History */}
        {myPayrollHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                My Payroll History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Period</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Basic Salary</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Allowances</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myPayrollHistory.map((payroll, idx) => {
                    const total = calculateTotalSalary(payroll);
                    const allowances = (payroll.fuelAllowance || 0) + (payroll.medicalAllowance || 0) + 
                                      (payroll.specialAllowance || 0) + (payroll.otherAllowance || 0);
                    return (
                      <tr key={payroll._id || idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">{payroll.month} {payroll.year}</td>
                        <td className="px-4 py-3 text-right text-sm">PKR {(payroll.salary || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm text-emerald-600">+PKR {allowances.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-semibold">PKR {total.toLocaleString()}</td>
                        <td className="px-4 py-3"><StatusBadge status={payroll.paymentStatus} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewPayslip(payroll, true)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            <button
                              onClick={() => handleDownloadPayslip(payroll, true)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                            >
                              <Printer className="w-3 h-3" /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ALL EMPLOYEES PAYROLL SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Employee Payroll Records
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{allPayrolls.length} of {pagination.total} records</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportToExcel} disabled={exportLoading} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export Excel
                </button>
                <button onClick={fetchAllPayrolls} className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select 
                value={filters.year} 
                onChange={(e) => handleFilterChange('year', e.target.value)} 
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Years</option>
                {monthsYears.years?.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select 
                value={filters.month} 
                onChange={(e) => handleFilterChange('month', e.target.value)} 
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Months</option>
                {monthsYears.months?.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select 
                value={filters.status} 
                onChange={(e) => handleFilterChange('status', e.target.value)} 
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
              <button 
                onClick={handleResetFilters} 
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Filter className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Basic</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No payroll records found</p>
                    </td>
                  </tr>
                ) : (
                  allPayrolls.map((payroll) => {
                    const totalSalary = calculateTotalSalary(payroll);
                    return (
                      <tr key={payroll._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm text-gray-800">{payroll.employeeName || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">{payroll.employeeCode || ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{payroll.employeeDepartment || 'N/A'}</span>
                          <div className="text-xs text-gray-400">{payroll.employeePosition || ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-800">{payroll.month || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{payroll.year || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm text-gray-800">PKR {(payroll.salary || 0).toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm font-bold text-emerald-600">PKR {totalSalary.toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={payroll.paymentStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewPayslip(payroll, false)}
                              className="flex items-center gap-1 px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium rounded-lg transition-colors"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            <button
                              onClick={() => handleDownloadPayslip(payroll, false)}
                              className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                            >
                              <Printer className="w-3 h-3" /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.total)} of {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage - 1)} 
                    disabled={pagination.currentPage === 1} 
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4 inline" /> Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-600">Page {pagination.currentPage} of {pagination.totalPages}</span>
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage + 1)} 
                    disabled={pagination.currentPage === pagination.totalPages} 
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next <ChevronRight className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="flex justify-center">
          <button
            onClick={() => window.location.href = '/hr/dashboard'}
            className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRPayrollDashboard;