const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// Helper function to generate payslip HTML
const generatePayslipHTML = (payroll, employee) => {
  const totalSalary = (payroll.salary || 0) + (payroll.fuelAllowance || 0) + 
                      (payroll.medicalAllowance || 0) + (payroll.specialAllowance || 0) + 
                      (payroll.otherAllowance || 0);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payslip - ${payroll.employeeName || 'Employee'}</title>
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
              <tr><td>Basic Salary</td><td class="amount">${(payroll.salary || 0).toLocaleString()}</td></tr>
              <tr><td>Fuel Allowance</td><td class="amount">${(payroll.fuelAllowance || 0).toLocaleString()}</td></tr>
              <tr><td>Medical Allowance</td><td class="amount">${(payroll.medicalAllowance || 0).toLocaleString()}</td></tr>
              <tr><td>Special Allowance</td><td class="amount">${(payroll.specialAllowance || 0).toLocaleString()}</td></tr>
              <tr><td>Other Allowance</td><td class="amount">${(payroll.otherAllowance || 0).toLocaleString()}</td></tr>
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
};

// ======================= GET EMPLOYEE DASHBOARD =======================
const getMyDashboard = async (req, res) => {
  try {
    console.log('🔥 getMyDashboard called');
    console.log('📋 User object:', req.user);
    
    // ✅ FIX: Check if user exists
    if (!req.user || !req.user._id) {
      console.error('❌ No user found in request');
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated',
        message: 'Please login again'
      });
    }
    
    const employeeId = req.user._id;
    console.log('👤 Employee ID:', employeeId);
    
    // Get current month/year
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    
    console.log('📅 Current period:', currentMonth, currentYear);
    
    // Get current month payroll
    const currentPayroll = await Payroll.findOne({
      employeeId,
      month: currentMonth,
      year: currentYear
    });
    
    console.log('📊 Current payroll found:', currentPayroll ? 'Yes' : 'No');
    
    // Get YTD summary
    const ytdSummary = await Payroll.aggregate([
      {
        $match: {
          employeeId: new mongoose.Types.ObjectId(employeeId),
          year: currentYear,
          paymentStatus: 'Paid'
        }
      },
      {
        $group: {
          _id: null,
          totalNetSalary: { $sum: { $add: ['$salary', '$fuelAllowance', '$medicalAllowance', '$specialAllowance', '$otherAllowance'] } },
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('📈 YTD Summary:', ytdSummary);
    
    // Get recent payrolls (last 5)
    const recentPayrolls = await Payroll.find({ 
      employeeId,
      paymentStatus: 'Paid'
    })
    .sort({ year: -1, createdAt: -1 })
    .limit(5)
    .lean();
    
    console.log('📋 Recent payrolls:', recentPayrolls.length);
    
    // Calculate totals for current payroll
    const currentTotalSalary = currentPayroll ? 
      (currentPayroll.salary || 0) + (currentPayroll.fuelAllowance || 0) + 
      (currentPayroll.medicalAllowance || 0) + (currentPayroll.specialAllowance || 0) + 
      (currentPayroll.otherAllowance || 0) : 0;
    
    // Transform current payroll for frontend
    const transformedCurrentPayroll = currentPayroll ? {
      month: currentPayroll.month,
      year: currentPayroll.year,
      netSalary: currentTotalSalary,
      basicSalary: currentPayroll.salary || 0,
      allowances: (currentPayroll.fuelAllowance || 0) + (currentPayroll.medicalAllowance || 0) + 
                  (currentPayroll.specialAllowance || 0) + (currentPayroll.otherAllowance || 0),
      bonus: currentPayroll.specialAllowance || 0,
      deductions: 0,
      status: currentPayroll.paymentStatus === 'Paid' ? 'Processed' : 
              currentPayroll.paymentStatus === 'Pending' ? 'Pending' : 'Generated',
      paymentDate: currentPayroll.paidAt || currentPayroll.createdAt
    } : null;
    
    res.json({
      success: true,
      data: {
        currentPayroll: transformedCurrentPayroll,
        ytdSummary: ytdSummary[0] || {
          totalNetSalary: 0,
          totalAllowances: 0,
          totalDeductions: 0,
          count: 0
        },
        recentPayrolls: recentPayrolls.map(p => ({
          _id: p._id,
          month: p.month,
          year: p.year,
          netSalary: (p.salary || 0) + (p.fuelAllowance || 0) + (p.medicalAllowance || 0) + 
                     (p.specialAllowance || 0) + (p.otherAllowance || 0),
          paymentDate: p.paidAt || p.createdAt,
          status: p.paymentStatus === 'Paid' ? 'Processed' : 'Pending'
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ getMyDashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ======================= GET EMPLOYEE PAYROLLS BY YEAR =======================
const getMyPayroll = async (req, res) => {
  try {
    console.log('🔥 getMyPayroll called');
    console.log('📋 Query params:', req.query);
    
    // ✅ FIX: Check if user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    const { year } = req.query;
    const employeeId = req.user._id;
    
    if (!year) {
      return res.status(400).json({ 
        success: false, 
        error: 'Year parameter is required' 
      });
    }
    
    const payrolls = await Payroll.find({
      employeeId,
      year: parseInt(year)
    })
    .sort({ year: -1, createdAt: -1 })
    .lean();
    
    console.log('📊 Found payrolls:', payrolls.length);
    
    // Transform data for frontend
    const transformedPayrolls = payrolls.map(payroll => {
      const allowances = (payroll.fuelAllowance || 0) + (payroll.medicalAllowance || 0) + 
                        (payroll.specialAllowance || 0) + (payroll.otherAllowance || 0);
      const totalSalary = (payroll.salary || 0) + allowances;
      
      return {
        _id: payroll._id,
        month: payroll.month,
        year: payroll.year,
        basicSalary: payroll.salary || 0,
        allowances: allowances,
        bonus: payroll.specialAllowance || 0,
        deductions: 0,
        netSalary: totalSalary,
        status: payroll.paymentStatus === 'Paid' ? 'Processed' : 
                payroll.paymentStatus === 'Pending' ? 'Pending' : 'Generated',
        paymentDate: payroll.paidAt || payroll.createdAt,
        createdAt: payroll.createdAt,
        updatedAt: payroll.updatedAt
      };
    });
    
    res.json({
      success: true,
      data: transformedPayrolls
    });
    
  } catch (error) {
    console.error('❌ getMyPayroll error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ======================= GET PAYROLL YEARS =======================
const getPayrollYears = async (req, res) => {
  try {
    console.log('🔥 getPayrollYears called');
    
    // ✅ FIX: Check if user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    const employeeId = req.user._id;
    
    const years = await Payroll.aggregate([
      {
        $match: {
          employeeId: new mongoose.Types.ObjectId(employeeId)
        }
      },
      {
        $group: {
          _id: '$year'
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);
    
    const yearList = years.map(item => item._id);
    
    // If no years found, add current year
    if (yearList.length === 0) {
      yearList.push(new Date().getFullYear());
    }
    
    console.log('📅 Available years:', yearList);
    
    res.json({
      success: true,
      data: yearList
    });
    
  } catch (error) {
    console.error('❌ getPayrollYears error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ======================= GET PAYSLIP =======================
const getMyPayslip = async (req, res) => {
  try {
    console.log('🔥 getMyPayslip called for ID:', req.params.id);
    
    if (!req.user || !req.user._id) {
      return res.status(401).send('User not authenticated');
    }
    
    const { id } = req.params;
    const employeeId = req.user._id;
    
    const payroll = await Payroll.findOne({
      _id: id,
      employeeId
    });
    
    if (!payroll) {
      return res.status(404).send('Payslip not found or access denied');
    }
    
    // Generate HTML payslip
    const payslipHTML = generatePayslipHTML(payroll);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(payslipHTML);
    
  } catch (error) {
    console.error('❌ getMyPayslip error:', error);
    res.status(500).send('Error generating payslip');
  }
};

// ======================= DOWNLOAD PAYSLIP =======================
const downloadPayslip = async (req, res) => {
  try {
    console.log('🔥 downloadPayslip called for ID:', req.params.id);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const { id } = req.params;
    const employeeId = req.user._id;
    
    const payroll = await Payroll.findOne({
      _id: id,
      employeeId
    });
    
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'Payslip not found' });
    }
    
    const payslipHTML = generatePayslipHTML(payroll);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${payroll.month}-${payroll.year}.html"`);
    res.send(payslipHTML);
    
  } catch (error) {
    console.error('❌ downloadPayslip error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= REQUEST CORRECTION =======================
const requestCorrection = async (req, res) => {
  try {
    console.log('🔥 requestCorrection called for ID:', req.params.id);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const { id } = req.params;
    const { issue, details } = req.body;
    const employeeId = req.user._id;
    
    const payroll = await Payroll.findOne({
      _id: id,
      employeeId
    });
    
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'Payroll not found' });
    }
    
    // Add correction request
    if (!payroll.correctionRequests) {
      payroll.correctionRequests = [];
    }
    
    payroll.correctionRequests.push({
      issue: issue || 'Salary Discrepancy',
      details: details || 'No details provided',
      requestedBy: employeeId,
      requestedAt: new Date(),
      status: 'Pending'
    });
    
    await payroll.save();
    
    res.json({
      success: true,
      message: 'Correction request submitted successfully'
    });
    
  } catch (error) {
    console.error('❌ requestCorrection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getMyDashboard,
  getMyPayroll,
  getPayrollYears,
  getMyPayslip,
  downloadPayslip,
  requestCorrection
};