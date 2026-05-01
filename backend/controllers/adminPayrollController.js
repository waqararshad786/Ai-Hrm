const Payroll = require('../models/Payroll');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendSalarySlipEmail } = require('../utils/emailService');
const PDFDocument = require('pdfkit');

// ======================= HELPER: GENERATE PDF BUFFER =======================
const generatePayslipPDFBuffer = async (payroll, employee) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);
      
      const totalSalary = (payroll.salary || 0) + (payroll.fuelAllowance || 0) + 
                         (payroll.medicalAllowance || 0) + (payroll.specialAllowance || 0) + 
                         (payroll.otherAllowance || 0);
      
      // Company Header
      doc.fontSize(20).font('Helvetica-Bold').text('HRM SYSTEMS', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Official Salary Slip', { align: 'center' });
      doc.moveDown();
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      
      // Employee Details
      doc.fontSize(14).font('Helvetica-Bold').text('EMPLOYEE DETAILS', { underline: true });
      doc.moveDown(0.5);
      
      const empName = employee?.name || payroll.employeeName || 'N/A';
      const empId = employee?.employeeId || payroll.employeeCode || 'N/A';
      const empDept = employee?.department || payroll.employeeDepartment || 'N/A';
      const empPosition = employee?.position || payroll.employeePosition || 'N/A';
      const empEmail = employee?.email || payroll.employeeEmail || 'N/A';
      
      doc.fontSize(10).font('Helvetica-Bold').text('Employee Name:', 50, doc.y, { continued: true });
      doc.font('Helvetica').text(` ${empName}`, { continued: false });
      doc.moveDown(0.3);
      
      doc.font('Helvetica-Bold').text('Employee ID:', 50, doc.y, { continued: true });
      doc.font('Helvetica').text(` ${empId}`, { continued: false });
      doc.moveDown(0.3);
      
      doc.font('Helvetica-Bold').text('Department:', 50, doc.y, { continued: true });
      doc.font('Helvetica').text(` ${empDept}`, { continued: false });
      doc.moveDown(0.3);
      
      doc.font('Helvetica-Bold').text('Position:', 50, doc.y, { continued: true });
      doc.font('Helvetica').text(` ${empPosition}`, { continued: false });
      doc.moveDown(0.3);
      
      doc.font('Helvetica-Bold').text('Email:', 50, doc.y, { continued: true });
      doc.font('Helvetica').text(` ${empEmail}`, { continued: false });
      doc.moveDown();
      
      doc.fontSize(10).font('Helvetica-Bold').text(`Payroll Period: ${payroll.month} ${payroll.year}`, 50, doc.y);
      doc.font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      
      // Earnings Section
      doc.fontSize(14).font('Helvetica-Bold').text('EARNINGS', { underline: true });
      doc.moveDown(0.5);
      
      let earningsY = doc.y;
      doc.fontSize(10).font('Helvetica').text('Basic Salary:', 50, earningsY);
      doc.font('Helvetica').text(`PKR ${(payroll.salary || 0).toLocaleString()}`, 350, earningsY, { align: 'right' });
      earningsY += 20;
      
      doc.font('Helvetica').text('Fuel Allowance:', 50, earningsY);
      doc.font('Helvetica').text(`PKR ${(payroll.fuelAllowance || 0).toLocaleString()}`, 350, earningsY, { align: 'right' });
      earningsY += 20;
      
      doc.font('Helvetica').text('Medical Allowance:', 50, earningsY);
      doc.font('Helvetica').text(`PKR ${(payroll.medicalAllowance || 0).toLocaleString()}`, 350, earningsY, { align: 'right' });
      earningsY += 20;
      
      doc.font('Helvetica').text('Special Allowance:', 50, earningsY);
      doc.font('Helvetica').text(`PKR ${(payroll.specialAllowance || 0).toLocaleString()}`, 350, earningsY, { align: 'right' });
      earningsY += 20;
      
      doc.font('Helvetica').text('Other Allowance:', 50, earningsY);
      doc.font('Helvetica').text(`PKR ${(payroll.otherAllowance || 0).toLocaleString()}`, 350, earningsY, { align: 'right' });
      earningsY += 20;
      
      doc.y = earningsY;
      doc.moveDown();
      
      doc.fontSize(11).font('Helvetica-Bold').text('Gross Salary:', 50, doc.y);
      doc.font('Helvetica-Bold').text(`PKR ${totalSalary.toLocaleString()}`, 350, doc.y, { align: 'right' });
      doc.moveDown(2);
      
      // Net Salary
      doc.strokeColor('#10b981').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica-Bold').text('NET SALARY:', 50, doc.y);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#059669').text(`PKR ${totalSalary.toLocaleString()}`, 350, doc.y, { align: 'right' });
      doc.fillColor('#000000');
      doc.moveDown(0.5);
      doc.strokeColor('#10b981').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(2);
      
      // Payment Information
      doc.fontSize(12).font('Helvetica-Bold').text('PAYMENT INFORMATION', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Payment Status: ${payroll.paymentStatus || 'Pending'}`, 50, doc.y);
      if (payroll.paymentDate) {
        doc.text(`Payment Date: ${new Date(payroll.paymentDate).toLocaleDateString()}`, 350, doc.y - 15, { align: 'right' });
      }
      if (payroll.transactionId) {
        doc.moveDown();
        doc.text(`Transaction ID: ${payroll.transactionId}`, 50, doc.y);
      }
      if (payroll.paymentMethod) {
        doc.text(`Payment Method: ${payroll.paymentMethod}`, 350, doc.y - 15, { align: 'right' });
      }
      
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').fillColor('#999999');
      doc.text('This is a system-generated document. For any discrepancies, please contact HR department.', 50, 750, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ======================= GET ALL PAYROLLS =======================
const getAllPayroll = async (req, res) => {
  try {
    console.log('📊 Getting all payrolls');
    console.log('Query params:', req.query);
    
    const { month, year, status, employeeId, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (month && month !== 'all') filter.month = month;
    if (year && year !== 'all' && year !== '') filter.year = parseInt(year);
    if (status && status !== 'all') filter.paymentStatus = status;
    if (employeeId && employeeId !== 'all') {
      filter.employeeId = new mongoose.Types.ObjectId(employeeId);
    }
    
    console.log('Filter:', filter);
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const payrolls = await Payroll.find(filter)
      .sort({ year: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    console.log(`Found ${payrolls.length} payrolls`);
    
    if (payrolls.length > 0) {
      console.log('Sample payroll:', {
        id: payrolls[0]._id,
        employeeName: payrolls[0].employeeName,
        employeeEmail: payrolls[0].employeeEmail,
        salary: payrolls[0].salary
      });
    }
    
    const total = await Payroll.countDocuments(filter);
    
    res.json({
      success: true,
      count: payrolls.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: payrolls
    });
  } catch (error) {
    console.error('❌ getAllPayroll error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= GENERATE SINGLE PAYROLL =======================
const generatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;
    
    console.log('📥 Generating payroll for:', { employeeId, month, year });
    
    if (!employeeId || !month || !year) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee ID, month, and year are required' 
      });
    }
    
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    console.log('👤 Employee found:', { name: employee.name, email: employee.email });
    
    const existingPayroll = await Payroll.findOne({
      employeeId,
      month,
      year: parseInt(year)
    });
    
    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        error: `Payroll already exists for ${employee.name} for ${month} ${year}`
      });
    }
    
    const payroll = new Payroll({
      employeeId: employee._id,
      month: month,
      year: parseInt(year),
      salary: employee.salary || 0,
      fuelAllowance: employee.fuelAllowance || 0,
      medicalAllowance: employee.medicalAllowance || 0,
      specialAllowance: employee.specialAllowance || 0,
      otherAllowance: employee.otherAllowance || 0,
      employeeName: employee.name || '',
      employeeCode: employee.employeeId || '',
      employeeDepartment: employee.department || 'General',
      employeePosition: employee.position || 'Employee',
      employeeEmail: employee.email || '',  // ✅ IMPORTANT: Store email
      employeePhone: employee.phone || '',
      employeeAddress: employee.presentAddress || '',
      employeeImage: employee.profilePicture || '',
      bankName: employee.bankName || '',
      bankAccountNumber: employee.bankAccountNumber || '',
      bankAccountTitle: employee.bankAccountTitle || '',
      paymentStatus: 'Pending',
      generatedBy: req.user?._id,
      notes: `Payroll generated for ${month} ${year}`
    });
    
    await payroll.save();
    
    console.log(`✅ Payroll generated:`, {
      name: employee.name,
      email: employee.email,
      salary: payroll.salary
    });
    
    res.status(201).json({
      success: true,
      message: `Payroll generated for ${employee.name}`,
      data: payroll
    });
    
  } catch (error) {
    console.error('❌ generatePayroll error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= GET EMPLOYEES FOR PAYROLL =======================
const getEmployeesForPayroll = async (req, res) => {
  try {
    const employees = await User.find(
      { 
        isActive: true,
        role: { $in: ['employee', 'hr', 'manager'] }
      },
      '_id name employeeId email department position salary fuelAllowance medicalAllowance specialAllowance otherAllowance profilePicture phone presentAddress bankName bankAccountNumber bankAccountTitle'
    ).sort({ name: 1 });
    
    console.log(`📋 Found ${employees.length} employees for payroll`);
    
    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('❌ getEmployeesForPayroll error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= GET PAYROLL STATS =======================
const getPayrollStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const filter = {};
    if (month && month !== 'all') filter.month = month;
    if (year && year !== 'all' && year !== '') filter.year = parseInt(year);
    
    const payrolls = await Payroll.find(filter);
    
    const totalAmount = payrolls.reduce((sum, p) => {
      const total = (p.salary || 0) + (p.fuelAllowance || 0) + (p.medicalAllowance || 0) + 
                    (p.specialAllowance || 0) + (p.otherAllowance || 0);
      return sum + total;
    }, 0);
    
    const stats = {
      totalPayrolls: payrolls.length,
      totalAmount: totalAmount,
      paidPayments: payrolls.filter(p => p.paymentStatus === 'Paid').length,
      pendingPayments: payrolls.filter(p => p.paymentStatus === 'Pending').length,
      failedPayments: payrolls.filter(p => p.paymentStatus === 'Failed').length,
      averageSalary: payrolls.length > 0 ? totalAmount / payrolls.length : 0
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ getPayrollStats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= GET MONTHS & YEARS =======================
const getPayrollMonthsYears = async (req, res) => {
  try {
    console.log('📅 getPayrollMonthsYears called');
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentYear = new Date().getFullYear();
    let years = [];
    
    const existingYears = await Payroll.distinct('year');
    console.log('Existing years from DB:', existingYears);
    
    if (!existingYears || existingYears.length === 0) {
      for (let i = 2; i >= 0; i--) {
        years.push(currentYear - i);
      }
      years.push(currentYear + 1);
      years.push(currentYear + 2);
    } else {
      years = [...existingYears];
      if (!years.includes(currentYear)) years.push(currentYear);
      if (!years.includes(currentYear + 1)) years.push(currentYear + 1);
      if (!years.includes(currentYear - 1)) years.push(currentYear - 1);
    }
    
    years = [...new Set(years)];
    years.sort((a, b) => b - a);
    
    console.log('Final years to send:', years);
    
    res.json({
      success: true,
      data: { months, years }
    });
  } catch (error) {
    console.error('❌ getPayrollMonthsYears error:', error);
    const currentYear = new Date().getFullYear();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const years = [currentYear + 2, currentYear + 1, currentYear, currentYear - 1, currentYear - 2];
    
    res.json({
      success: true,
      data: { months, years }
    });
  }
};

// ======================= UPDATE PAYROLL =======================
const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const payroll = await Payroll.findByIdAndUpdate(id, updates, { new: true });
    
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'Payroll not found' });
    }
    
    res.json({
      success: true,
      message: 'Payroll updated successfully',
      data: payroll
    });
  } catch (error) {
    console.error('❌ updatePayroll error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= UPDATE PAYROLL STATUS (WITH EMAIL) =======================
const updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentDate, transactionId, notes } = req.body;
    
    // Get original payroll before update
    const originalPayroll = await Payroll.findById(id);
    
    if (!originalPayroll) {
      return res.status(404).json({ success: false, error: 'Payroll not found' });
    }
    
    const updateData = {
      paymentStatus,
      ...(paymentDate && { paymentDate }),
      ...(transactionId && { transactionId }),
      ...(notes && { notes }),
      ...(paymentStatus === 'Paid' && { paidAt: new Date() })
    };
    
    const payroll = await Payroll.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'Payroll not found' });
    }
    
    // 📧 Send email if status changed to 'Paid'
    let emailSent = false;
    let emailError = null;
    
    if (paymentStatus === 'Paid' && originalPayroll.paymentStatus !== 'Paid') {
      console.log(`📧 Payroll ${id} marked as PAID. Preparing to send email...`);
      
      try {
        // Get employee details - either from payroll.employeeId or use stored email
        let employee = null;
        let employeeEmail = payroll.employeeEmail;
        
        if (payroll.employeeId) {
          employee = await User.findById(payroll.employeeId);
        }
        
        // If employee not found but we have stored email, create basic employee object
        if (!employee && employeeEmail) {
          employee = {
            name: payroll.employeeName,
            email: employeeEmail,
            employeeId: payroll.employeeCode,
            department: payroll.employeeDepartment,
            position: payroll.employeePosition
          };
          console.log(`📧 Using stored employee data for email: ${employeeEmail}`);
        }
        
        if (employee && employee.email) {
          console.log(`📧 Attempting to send email to: ${employee.email}`);
          
          const pdfBuffer = await generatePayslipPDFBuffer(payroll, employee);
          const emailResult = await sendSalarySlipEmail(employee, payroll, pdfBuffer);
          
          if (emailResult.success) {
            emailSent = true;
            console.log(`✅ Salary slip email sent successfully to ${employee.email}`);
            await Payroll.findByIdAndUpdate(id, { 
              emailSent: true, 
              emailSentAt: new Date() 
            });
          } else {
            emailError = emailResult.error;
            console.error(`❌ Failed to send email: ${emailError}`);
          }
        } else {
          emailError = `Employee email not found for payroll ${id}. Stored email: ${employeeEmail}`;
          console.error(`❌ ${emailError}`);
        }
      } catch (pdfError) {
        emailError = pdfError.message;
        console.error(`❌ Error: ${pdfError.message}`);
      }
    }
    
    res.json({
      success: true,
      message: `Payroll status updated to ${paymentStatus}`,
      data: payroll,
      emailNotification: emailSent ? {
        sent: true,
        message: `Salary slip email sent to employee`
      } : {
        sent: false,
        message: emailError || 'Email not sent (status not changed to Paid)'
      }
    });
  } catch (error) {
    console.error('❌ updatePayrollStatus error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= BULK GENERATE PAYROLL =======================
const bulkGeneratePayroll = async (req, res) => {
  try {
    const { employeeIds, month, year } = req.body;
    
    console.log('📦 Bulk generate payroll:', { employeeIdsCount: employeeIds?.length, month, year });
    
    if (!employeeIds || !employeeIds.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee IDs are required' 
      });
    }
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        error: 'Month and year are required' 
      });
    }
    
    const results = { success: [], failed: [] };
    
    for (const employeeId of employeeIds) {
      try {
        const employee = await User.findById(employeeId);
        if (!employee) {
          results.failed.push({ employeeId, error: 'Employee not found' });
          continue;
        }
        
        const existing = await Payroll.findOne({ employeeId, month, year: parseInt(year) });
        if (existing) {
          results.failed.push({ employeeId, error: 'Payroll already exists' });
          continue;
        }
        
        const payroll = new Payroll({
          employeeId: employee._id,
          month: month,
          year: parseInt(year),
          salary: employee.salary || 0,
          fuelAllowance: employee.fuelAllowance || 0,
          medicalAllowance: employee.medicalAllowance || 0,
          specialAllowance: employee.specialAllowance || 0,
          otherAllowance: employee.otherAllowance || 0,
          employeeName: employee.name || '',
          employeeCode: employee.employeeId || '',
          employeeDepartment: employee.department || 'General',
          employeePosition: employee.position || 'Employee',
          employeeEmail: employee.email || '',  // ✅ Store email
          employeePhone: employee.phone || '',
          employeeAddress: employee.presentAddress || '',
          employeeImage: employee.profilePicture || '',
          bankName: employee.bankName || '',
          bankAccountNumber: employee.bankAccountNumber || '',
          bankAccountTitle: employee.bankAccountTitle || '',
          paymentStatus: 'Pending',
          generatedBy: req.user?._id,
          notes: `Bulk payroll generated for ${month} ${year}`
        });
        
        await payroll.save();
        results.success.push({ employeeId, name: employee.name });
        
      } catch (error) {
        console.error(`Error for employee ${employeeId}:`, error.message);
        results.failed.push({ employeeId, error: error.message });
      }
    }
    
    console.log(`✅ Bulk generate complete: Success=${results.success.length}, Failed=${results.failed.length}`);
    
    res.json({
      success: true,
      message: `Generated ${results.success.length} payrolls, Failed ${results.failed.length}`,
      data: results
    });
  } catch (error) {
    console.error('❌ bulkGeneratePayroll error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= DELETE PAYROLL =======================
const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payroll = await Payroll.findByIdAndDelete(id);
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'Payroll not found' });
    }
    
    res.json({
      success: true,
      message: 'Payroll deleted successfully'
    });
  } catch (error) {
    console.error('❌ deletePayroll error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= GENERATE PAYSLIP =======================
const generatePayslip = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payroll = await Payroll.findById(id);
    
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'Payroll not found' });
    }
    
    const totalSalary = (payroll.salary || 0) + (payroll.fuelAllowance || 0) + 
                        (payroll.medicalAllowance || 0) + (payroll.specialAllowance || 0) + 
                        (payroll.otherAllowance || 0);
    
    const payslipHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${payroll.employeeName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 40px; }
          .payslip { max-width: 900px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 30px; text-align: center; }
          .company-name { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
          .payslip-title { font-size: 18px; opacity: 0.9; }
          .employee-section { padding: 30px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
          .employee-info { display: flex; gap: 30px; align-items: center; flex-wrap: wrap; }
          .employee-photo { width: 100px; height: 100px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .employee-photo img { width: 100%; height: 100%; object-fit: cover; }
          .employee-photo-placeholder { width: 100px; height: 100px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px; }
          .employee-details { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .detail-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; }
          .detail-label { font-weight: 600; color: #475569; }
          .detail-value { color: #1e293b; }
          .salary-section { padding: 30px; }
          .section-title { font-size: 18px; font-weight: bold; color: #1e3c72; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; font-weight: 600; color: #475569; }
          .amount { text-align: right; }
          .total-row { background: #f1f5f9; font-weight: bold; }
          .total-row td { border-top: 2px solid #cbd5e1; }
          .bank-section { padding: 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
          .bank-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .footer { padding: 20px 30px; text-align: center; background: #f1f5f9; color: #64748b; font-size: 12px; }
          .status-paid { color: #10b981; font-weight: bold; }
          .status-pending { color: #f59e0b; font-weight: bold; }
          @media print {
            body { background: white; padding: 0; }
            .payslip { box-shadow: none; }
            button { display: none; }
          }
          button { margin: 20px auto; display: block; padding: 12px 24px; background: #1e3c72; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="payslip">
          <div class="header">
            <div class="company-name">HRM SYSTEM</div>
            <div class="payslip-title">MONTHLY PAYSLIP</div>
            <div style="margin-top: 10px;">${payroll.month} ${payroll.year}</div>
          </div>
          
          <div class="employee-section">
            <div class="employee-info">
              <div class="employee-photo">
                ${payroll.employeeImage ? 
                  `<img src="${payroll.employeeImage}" alt="Employee Photo">` : 
                  `<div class="employee-photo-placeholder">👤</div>`
                }
              </div>
              <div class="employee-details">
                <div class="detail-item"><span class="detail-label">Employee ID:</span><span class="detail-value">${payroll.employeeCode || 'N/A'}</span></div>
                <div class="detail-item"><span class="detail-label">Name:</span><span class="detail-value">${payroll.employeeName || 'N/A'}</span></div>
                <div class="detail-item"><span class="detail-label">Department:</span><span class="detail-value">${payroll.employeeDepartment || 'N/A'}</span></div>
                <div class="detail-item"><span class="detail-label">Position:</span><span class="detail-value">${payroll.employeePosition || 'N/A'}</span></div>
                <div class="detail-item"><span class="detail-label">Email:</span><span class="detail-value">${payroll.employeeEmail || 'N/A'}</span></div>
                <div class="detail-item"><span class="detail-label">Phone:</span><span class="detail-value">${payroll.employeePhone || 'N/A'}</span></div>
                <div class="detail-item"><span class="detail-label">Address:</span><span class="detail-value">${payroll.employeeAddress || 'N/A'}</span></div>
                <div class="detail-item"><span class="detail-label">Status:</span><span class="detail-value ${payroll.paymentStatus === 'Paid' ? 'status-paid' : 'status-pending'}">${payroll.paymentStatus || 'Pending'}</span></div>
              </div>
            </div>
          </div>
          
          <div class="salary-section">
            <div class="section-title">Salary Breakdown</div>
            <table>
              <thead>
                <tr><th>Earnings</th><th class="amount">Amount (PKR)</th></tr>
              </thead>
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
          
          <div class="bank-section">
            <div class="section-title">Bank Details</div>
            <div class="bank-details">
              <div class="detail-item"><span class="detail-label">Bank Name:</span><span class="detail-value">${payroll.bankName || 'N/A'}</span></div>
              <div class="detail-item"><span class="detail-label">Account Number:</span><span class="detail-value">${payroll.bankAccountNumber || 'N/A'}</span></div>
              <div class="detail-item"><span class="detail-label">Account Title:</span><span class="detail-value">${payroll.bankAccountTitle || 'N/A'}</span></div>
              <div class="detail-item"><span class="detail-label">Payment Method:</span><span class="detail-value">${payroll.paymentMethod || 'Bank Transfer'}</span></div>
              ${payroll.transactionId ? `<div class="detail-item"><span class="detail-label">Transaction ID:</span><span class="detail-value">${payroll.transactionId}</span></div>` : ''}
              ${payroll.paymentDate ? `<div class="detail-item"><span class="detail-label">Payment Date:</span><span class="detail-value">${new Date(payroll.paymentDate).toLocaleDateString()}</span></div>` : ''}
            </div>
          </div>
          
          <div class="footer">
            <div>This is a system generated payslip. No signature required.</div>
            <div>Generated on: ${new Date().toLocaleString()}</div>
            <button onclick="window.print()">🖨️ Print Payslip</button>
          </div>
        </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(payslipHTML);
  } catch (error) {
    console.error('❌ generatePayslip error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= DOWNLOAD PAYSLIP =======================
const downloadPayslipFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payroll = await Payroll.findById(id);
    
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'Payroll not found' });
    }
    
    const totalSalary = (payroll.salary || 0) + (payroll.fuelAllowance || 0) + 
                        (payroll.medicalAllowance || 0) + (payroll.specialAllowance || 0) + 
                        (payroll.otherAllowance || 0);
    
    const payslipHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${payroll.employeeName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; }
          .payslip { max-width: 900px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 30px; text-align: center; }
          .company-name { font-size: 28px; font-weight: bold; }
          .employee-section { padding: 30px; background: #f8fafc; }
          .employee-info { display: flex; gap: 30px; align-items: center; flex-wrap: wrap; }
          .employee-photo-placeholder { width: 100px; height: 100px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px; }
          .employee-details { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .detail-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; }
          .detail-label { font-weight: 600; }
          .salary-section { padding: 30px; }
          .section-title { font-size: 18px; font-weight: bold; color: #1e3c72; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; }
          .amount { text-align: right; }
          .total-row { background: #f1f5f9; font-weight: bold; }
          .footer { padding: 20px; text-align: center; background: #f1f5f9; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="payslip">
          <div class="header">
            <div class="company-name">HRM SYSTEM</div>
            <div>MONTHLY PAYSLIP - ${payroll.month} ${payroll.year}</div>
          </div>
          <div class="employee-section">
            <div class="employee-info">
              <div class="employee-photo-placeholder">👤</div>
              <div class="employee-details">
                <div class="detail-item"><span>Employee ID:</span><span>${payroll.employeeCode || 'N/A'}</span></div>
                <div class="detail-item"><span>Name:</span><span>${payroll.employeeName || 'N/A'}</span></div>
                <div class="detail-item"><span>Department:</span><span>${payroll.employeeDepartment || 'N/A'}</span></div>
                <div class="detail-item"><span>Position:</span><span>${payroll.employeePosition || 'N/A'}</span></div>
                <div class="detail-item"><span>Address:</span><span>${payroll.employeeAddress || 'N/A'}</span></div>
              </div>
            </div>
          </div>
          <div class="salary-section">
            <div class="section-title">Salary Details</div>
            <table>
              <tr><th>Description</th><th class="amount">Amount (PKR)</th></tr>
              <tr><td>Basic Salary</th><td class="amount">${(payroll.salary || 0).toLocaleString()} </td></tr>
              <tr><td>Fuel Allowance</th><td class="amount">${(payroll.fuelAllowance || 0).toLocaleString()} </td></tr>
              <tr><td>Medical Allowance</th><td class="amount">${(payroll.medicalAllowance || 0).toLocaleString()} </td></tr>
              <tr><td>Special Allowance</th><td class="amount">${(payroll.specialAllowance || 0).toLocaleString()}  </td></tr>
              <tr><td>Other Allowance</th><td class="amount">${(payroll.otherAllowance || 0).toLocaleString()}  </td></tr>
              <tr class="total-row"><td><strong>TOTAL</strong></td><td class="amount"><strong>PKR ${totalSalary.toLocaleString()}</strong></td></tr>
            </table>
          </div>
          <div class="footer">
            Generated: ${new Date().toLocaleString()}
          </div>
        </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="payslip_${payroll.employeeCode}_${payroll.month}_${payroll.year}.html"`);
    res.send(payslipHTML);
  } catch (error) {
    console.error('❌ downloadPayslipFile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= GET PAYSLIP TRANSCRIPT =======================
const getPayslipTranscript = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payroll = await Payroll.findById(id);
    
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'Payroll not found' });
    }
    
    const totalSalary = (payroll.salary || 0) + (payroll.fuelAllowance || 0) + 
                        (payroll.medicalAllowance || 0) + (payroll.specialAllowance || 0) + 
                        (payroll.otherAllowance || 0);
    
    res.json({
      success: true,
      data: {
        employeeName: payroll.employeeName,
        employeeCode: payroll.employeeCode,
        employeeDepartment: payroll.employeeDepartment,
        month: payroll.month,
        year: payroll.year,
        salary: payroll.salary,
        fuelAllowance: payroll.fuelAllowance,
        medicalAllowance: payroll.medicalAllowance,
        specialAllowance: payroll.specialAllowance,
        otherAllowance: payroll.otherAllowance,
        totalSalary: totalSalary,
        paymentStatus: payroll.paymentStatus,
        paymentDate: payroll.paymentDate,
        bankName: payroll.bankName,
        bankAccountNumber: payroll.bankAccountNumber
      }
    });
  } catch (error) {
    console.error('❌ getPayslipTranscript error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= GET PAYROLL BY ID =======================
const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payroll = await Payroll.findById(id);
    
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'Payroll not found' });
    }
    
    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    console.error('❌ getPayrollById error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= PROCESS BULK PAYMENT (WITH EMAIL) =======================
const processBulkPayment = async (req, res) => {
  try {
    const { payrollIds, paymentMethod, transactionId, notes } = req.body;
    
    if (!payrollIds || !payrollIds.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payroll IDs are required' 
      });
    }
    
    const results = { success: [], failed: [], emailsSent: [] };
    
    for (const payrollId of payrollIds) {
      try {
        const payroll = await Payroll.findById(payrollId);
        
        if (!payroll) {
          results.failed.push({ payrollId, error: 'Payroll not found' });
          continue;
        }
        
        if (payroll.paymentStatus === 'Paid') {
          results.failed.push({ payrollId, error: 'Already paid' });
          continue;
        }
        
        // Update payroll
        payroll.paymentStatus = 'Paid';
        payroll.paymentDate = new Date();
        payroll.paymentMethod = paymentMethod || 'Bank Transfer';
        payroll.transactionId = transactionId || `BULK-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
        payroll.notes = notes || 'Bulk payment processed';
        payroll.paidAt = new Date();
        
        await payroll.save();
        results.success.push(payrollId);
        
        // 📧 Send email
        let employee = null;
        let employeeEmail = payroll.employeeEmail;
        
        if (payroll.employeeId) {
          employee = await User.findById(payroll.employeeId);
        }
        
        if (!employee && employeeEmail) {
          employee = {
            name: payroll.employeeName,
            email: employeeEmail,
            employeeId: payroll.employeeCode,
            department: payroll.employeeDepartment,
            position: payroll.employeePosition
          };
        }
        
        if (employee && employee.email) {
          try {
            const pdfBuffer = await generatePayslipPDFBuffer(payroll, employee);
            const emailResult = await sendSalarySlipEmail(employee, payroll, pdfBuffer);
            
            if (emailResult.success) {
              results.emailsSent.push({
                payrollId,
                employeeEmail: employee.email,
                employeeName: employee.name
              });
              await Payroll.findByIdAndUpdate(payrollId, { emailSent: true, emailSentAt: new Date() });
              console.log(`✅ Email sent to ${employee.email}`);
            }
          } catch (emailError) {
            console.error(`Email failed for ${employee.email}:`, emailError.message);
          }
        }
        
      } catch (error) {
        results.failed.push({ payrollId, error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${results.success.length} payrolls, Emails sent: ${results.emailsSent.length}`,
      data: results
    });
  } catch (error) {
    console.error('❌ processBulkPayment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= CREATE MANUAL PAYROLL =======================
const createManualPayroll = async (req, res) => {
  try {
    const { employeeId, month, year, salary, fuelAllowance, medicalAllowance, specialAllowance, otherAllowance, notes } = req.body;
    
    if (!employeeId || !month || !year) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee, month, and year are required' 
      });
    }
    
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    const existing = await Payroll.findOne({ employeeId, month, year: parseInt(year) });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payroll already exists for this period' 
      });
    }
    
    const payroll = new Payroll({
      employeeId: employee._id,
      month: month,
      year: parseInt(year),
      salary: salary || employee.salary || 0,
      fuelAllowance: fuelAllowance || employee.fuelAllowance || 0,
      medicalAllowance: medicalAllowance || employee.medicalAllowance || 0,
      specialAllowance: specialAllowance || employee.specialAllowance || 0,
      otherAllowance: otherAllowance || employee.otherAllowance || 0,
      employeeName: employee.name || '',
      employeeCode: employee.employeeId || '',
      employeeDepartment: employee.department || 'General',
      employeePosition: employee.position || 'Employee',
      employeeEmail: employee.email || '',  // ✅ Store email
      employeePhone: employee.phone || '',
      employeeAddress: employee.presentAddress || '',
      employeeImage: employee.profilePicture || '',
      bankName: employee.bankName || '',
      bankAccountNumber: employee.bankAccountNumber || '',
      bankAccountTitle: employee.bankAccountTitle || '',
      paymentStatus: 'Pending',
      isManuallyCreated: true,
      notes: notes || 'Manually created by admin',
      generatedBy: req.user?._id
    });
    
    await payroll.save();
    
    res.status(201).json({
      success: true,
      message: `Manual payroll created for ${employee.name}`,
      data: payroll
    });
  } catch (error) {
    console.error('❌ createManualPayroll error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= EXPORT TO EXCEL =======================
const exportToExcel = async (req, res) => {
  try {
    const { year, month, status, limit = 10000 } = req.query;
    
    const filter = {};
    if (year && year !== 'all' && year !== '') filter.year = parseInt(year);
    if (month && month !== 'all') filter.month = month;
    if (status && status !== 'all') filter.paymentStatus = status;
    
    const payrolls = await Payroll.find(filter).limit(parseInt(limit));
    
    const exportData = payrolls.map(p => {
      const total = (p.salary || 0) + (p.fuelAllowance || 0) + (p.medicalAllowance || 0) + 
                    (p.specialAllowance || 0) + (p.otherAllowance || 0);
      
      return {
        'Employee ID': p.employeeCode || 'N/A',
        'Employee Name': p.employeeName || 'N/A',
        'Employee Email': p.employeeEmail || 'N/A',
        'Department': p.employeeDepartment || 'N/A',
        'Month': p.month,
        'Year': p.year,
        'Basic Salary': p.salary || 0,
        'Fuel Allowance': p.fuelAllowance || 0,
        'Medical Allowance': p.medicalAllowance || 0,
        'Special Allowance': p.specialAllowance || 0,
        'Other Allowance': p.otherAllowance || 0,
        'Total Salary': total,
        'Status': p.paymentStatus || 'Pending',
        'Payment Date': p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '',
        'Payment Method': p.paymentMethod || '',
        'Transaction ID': p.transactionId || '',
        'Bank Name': p.bankName || '',
        'Account Number': p.bankAccountNumber || ''
      };
    });
    
    res.json({
      success: true,
      data: exportData,
      count: exportData.length
    });
  } catch (error) {
    console.error('❌ exportToExcel error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= IMPORT FROM EXCEL =======================
const importFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    res.json({
      success: true,
      message: 'Import functionality - please implement excel parsing',
      data: { imported: 0, failed: 0 }
    });
  } catch (error) {
    console.error('❌ importFromExcel error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ======================= RESEND EMAIL =======================
const resendSalarySlipEmail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'Payroll not found' });
    }
    
    if (payroll.paymentStatus !== 'Paid') {
      return res.status(400).json({ 
        success: false, 
        error: 'Salary slip can only be sent for paid payrolls' 
      });
    }
    
    // Get employee email from payroll
    let employeeEmail = payroll.employeeEmail;
    let employee = null;
    
    if (payroll.employeeId) {
      employee = await User.findById(payroll.employeeId);
    }
    
    if (!employee && employeeEmail) {
      employee = {
        name: payroll.employeeName,
        email: employeeEmail,
        employeeId: payroll.employeeCode,
        department: payroll.employeeDepartment,
        position: payroll.employeePosition
      };
    }
    
    if (!employee || !employee.email) {
      return res.status(404).json({ 
        success: false, 
        error: `Employee email not found. Stored email: ${employeeEmail}` 
      });
    }
    
    const pdfBuffer = await generatePayslipPDFBuffer(payroll, employee);
    const emailResult = await sendSalarySlipEmail(employee, payroll, pdfBuffer);
    
    if (emailResult.success) {
      await Payroll.findByIdAndUpdate(id, { 
        emailSent: true, 
        emailSentAt: new Date(),
        emailResendCount: (payroll.emailResendCount || 0) + 1
      });
      
      res.json({
        success: true,
        message: `Salary slip email resent to ${employee.email}`
      });
    } else {
      throw new Error(emailResult.error);
    }
  } catch (error) {
    console.error('❌ resendSalarySlipEmail error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllPayroll,
  generatePayroll,
  getEmployeesForPayroll,
  getPayrollStats,
  getPayrollMonthsYears,
  updatePayroll,
  updatePayrollStatus,
  bulkGeneratePayroll,
  deletePayroll,
  generatePayslip,
  downloadPayslipFile,
  getPayslipTranscript,
  createManualPayroll,
  exportToExcel,
  importFromExcel,
  processBulkPayment,
  getPayrollById,
  resendSalarySlipEmail
};