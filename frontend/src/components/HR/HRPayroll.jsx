import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, Upload, FileSpreadsheet,
  Send, CheckCircle, Clock,
  Filter, RefreshCw, 
  Eye, Edit,
  ChevronLeft, ChevronRight,
  Printer, AlertCircle,
  User, DollarSign, Users, Search,
  Plus
} from 'lucide-react';

// Badge Component
const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700'
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
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
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

const HRPayrollDashboard = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [stats, setStats] = useState({
    totalPayrolls: 0,
    pendingPayments: 0,
    paidPayments: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(false);
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

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    fetchPayrolls();
    fetchStats();
    fetchMonthsYears();
  }, [filters]);

  const calculateTotalSalary = (payroll) => {
    return (payroll.salary || 0) + (payroll.fuelAllowance || 0) + 
           (payroll.medicalAllowance || 0) + (payroll.specialAllowance || 0) + 
           (payroll.otherAllowance || 0);
  };

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      }).toString();
      
      const res = await axiosInstance.get(`/admin/payroll?${params}`);
      
      if (res.data.success) {
        setPayrolls(res.data.data || []);
        setPagination({
          total: res.data.total || 0,
          totalPages: res.data.totalPages || 1,
          currentPage: res.data.currentPage || 1
        });
      }
    } catch (error) {
      console.error('Payrolls fetch error:', error);
      alert('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({ month: filters.month, year: filters.year }).toString();
      const res = await axiosInstance.get(`/admin/payroll/stats?${params}`);
      if (res.data.success) {
        setStats(res.data.data || {});
      }
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  const fetchMonthsYears = async () => {
    try {
      const res = await axiosInstance.get('/admin/payroll/months-years');
      if (res.data.success && res.data.data) {
        setMonthsYears(res.data.data);
      } else {
        const currentYear = new Date().getFullYear();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
        setMonthsYears({ months, years });
      }
    } catch (error) {
      console.error('Months/Years error:', error);
    }
  };

  const handleDownloadPayslip = async (payrollId) => {
    window.open(`http://localhost:5000/api/admin/payroll/payslip/${payrollId}/download`, '_blank');
  };

  const handleDownloadPayslipWithTranscript = async (payrollId) => {
    try {
      const response = await axiosInstance.get(`/admin/payroll/${payrollId}`);
      if (!response.data.success || !response.data.data) throw new Error('Failed to fetch payroll data');
      
      const payroll = response.data.data;
      const totalSalary = calculateTotalSalary(payroll);
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Payslip - ${payroll.employeeName || 'Employee'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 40px; }
          .payslip { max-width: 900px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 30px; text-align: center; }
          .company-name { font-size: 28px; font-weight: bold; }
          .section { padding: 30px; border-bottom: 1px solid #e2e8f0; }
          .section-title { font-size: 18px; font-weight: bold; color: #1e3c72; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; }
          .label { font-weight: 600; color: #475569; }
          .value { color: #1e293b; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; }
          .amount { text-align: right; }
          .total-row { background: #f1f5f9; font-weight: bold; }
          .footer { padding: 20px; text-align: center; background: #f8fafc; font-size: 12px; color: #666; }
          .status-paid { color: #10b981; font-weight: bold; }
          .status-pending { color: #f59e0b; font-weight: bold; }
          button { margin-top: 20px; padding: 10px 24px; background: #1e3c72; color: white; border: none; border-radius: 8px; cursor: pointer; }
          @media print { body { background: white; padding: 0; } button { display: none; } }
        </style>
        </head>
        <body>
          <div class="payslip">
            <div class="header">
              <div class="company-name">HRM SYSTEM</div>
              <div style="margin-top: 10px;">MONTHLY PAYSLIP - ${payroll.month} ${payroll.year}</div>
            </div>
            <div class="section">
              <div class="section-title">Employee Information</div>
              <div class="info-grid">
                <div class="info-item"><span class="label">Employee ID:</span><span class="value">${payroll.employeeCode || 'N/A'}</span></div>
                <div class="info-item"><span class="label">Name:</span><span class="value">${payroll.employeeName || 'N/A'}</span></div>
                <div class="info-item"><span class="label">Department:</span><span class="value">${payroll.employeeDepartment || 'N/A'}</span></div>
                <div class="info-item"><span class="label">Position:</span><span class="value">${payroll.employeePosition || 'N/A'}</span></div>
                <div class="info-item"><span class="label">Status:</span><span class="value ${payroll.paymentStatus === 'Paid' ? 'status-paid' : 'status-pending'}">${payroll.paymentStatus || 'Pending'}</span></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Salary Details</div>
              <table>
                <thead><tr><th>Description</th><th class="amount">Amount (PKR)</th></tr></thead>
                <tbody>
                  <tr><td>Basic Salary</th><td class="amount">${(payroll.salary || 0).toLocaleString()} </td></tr>
                  <tr><td>Fuel Allowance</th><td class="amount">${(payroll.fuelAllowance || 0).toLocaleString()} </td></tr>
                  <tr><td>Medical Allowance</th><td class="amount">${(payroll.medicalAllowance || 0).toLocaleString()} </td></tr>
                  <tr><td>Special Allowance</th><td class="amount">${(payroll.specialAllowance || 0).toLocaleString()}  </td></tr>
                  <tr><td>Other Allowance</th><td class="amount">${(payroll.otherAllowance || 0).toLocaleString()}  </td></tr>
                  <tr class="total-row"><td><strong>TOTAL SALARY</strong></td><td class="amount"><strong>PKR ${totalSalary.toLocaleString()}</strong></td></tr>
                </tbody>
              </table>
            </div>
            <div class="footer">
              <div>Generated: ${new Date().toLocaleString()}</div>
              <button onclick="window.print()">🖨️ Print Payslip</button>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      alert('Failed to generate payslip: ' + error.message);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);
      const response = await axiosInstance.get('/admin/payroll/export/excel', {
        params: { year: filters.year, month: filters.month, status: filters.status }
      });
      
      const allPayrolls = response.data.data || [];
      if (allPayrolls.length === 0) {
        alert('No payroll records found');
        return;
      }
      
      const excelData = allPayrolls.map((p, i) => ({
        'SR #': i + 1,
        'Employee ID': p.employeeCode || 'N/A',
        'Employee Name': p.employeeName || 'N/A',
        'Department': p.employeeDepartment || 'N/A',
        'Month': p.month,
        'Year': p.year,
        'Basic Salary': p.salary || 0,
        'Fuel Allowance': p.fuelAllowance || 0,
        'Medical Allowance': p.medicalAllowance || 0,
        'Special Allowance': p.specialAllowance || 0,
        'Other Allowance': p.otherAllowance || 0,
        'Total Salary': calculateTotalSalary(p),
        'Status': p.paymentStatus || 'Pending'
      }));
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Payroll Records');
      XLSX.writeFile(wb, `Payroll_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      alert(`Exported ${allPayrolls.length} records!`);
    } catch (error) {
      alert('Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters({ ...filters, page: newPage });
    }
  };

  const StatusBadge = ({ status }) => {
    if (status === 'Paid') return <Badge variant="success">Paid</Badge>;
    if (status === 'Pending') return <Badge variant="warning">Pending</Badge>;
    return <Badge variant="default">{status || 'Pending'}</Badge>;
  };

  if (loading && payrolls.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">HR Payroll Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage employee payroll records</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <KpiCard title="Total Payrolls" value={stats.totalPayrolls || 0} icon={<FileSpreadsheet className="w-6 h-6 text-white" />} color="blue" />
          <KpiCard title="Paid" value={stats.paidPayments || 0} icon={<CheckCircle className="w-6 h-6 text-white" />} color="green" />
          <KpiCard title="Pending" value={stats.pendingPayments || 0} icon={<Clock className="w-6 h-6 text-white" />} color="yellow" />
          <KpiCard title="Total Amount" value={`PKR ${(stats.totalAmount || 0).toLocaleString()}`} icon={<DollarSign className="w-6 h-6 text-white" />} color="purple" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={handleExportToExcel} disabled={exportLoading} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={() => window.location.href = '/hr/dashboard'} className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2">
            Back to Dashboard
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">All Years</option>
              {monthsYears.years?.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value, page: 1 })} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="all">All Months</option>
              {monthsYears.months?.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
            <button onClick={() => setFilters({ year: '', month: 'all', status: 'all', page: 1, limit: 10 })} className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Payroll Records</h3>
                <p className="text-xs text-gray-400 mt-0.5">{payrolls.length} of {pagination.total} records</p>
              </div>
              <div className="text-sm text-gray-500">Page {pagination.currentPage} of {pagination.totalPages}</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Basic</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No payroll records found</p>
                    </td>
                  </tr>
                ) : (
                  payrolls.map((payroll) => {
                    const totalSalary = calculateTotalSalary(payroll);
                    return (
                      <tr key={payroll._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-sm text-gray-800">{payroll.employeeName || 'Unknown'}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{payroll.employeeDepartment || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{payroll.employeeCode || ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-sm text-gray-800">{payroll.month || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{payroll.year || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-semibold text-gray-800">PKR {(payroll.salary || 0).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-bold text-green-600">PKR {totalSalary.toLocaleString()}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            +{((payroll.fuelAllowance || 0) + (payroll.medicalAllowance || 0) + (payroll.specialAllowance || 0) + (payroll.otherAllowance || 0)).toLocaleString()} allowances
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={payroll.paymentStatus} />
                          {payroll.paymentDate && <div className="text-xs text-gray-400 mt-1">{new Date(payroll.paymentDate).toLocaleDateString()}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            <button onClick={() => handleDownloadPayslipWithTranscript(payroll._id)} className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors flex items-center gap-1">
                              <Eye className="w-3 h-3" /> View
                            </button>
                            <button onClick={() => handleDownloadPayslip(payroll._id)} className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors flex items-center gap-1">
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
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.total)} of {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                    <ChevronLeft className="w-4 h-4 inline" /> Previous
                  </button>
                  <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                    Next <ChevronRight className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRPayrollDashboard;