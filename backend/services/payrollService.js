const Payroll = require('../models/Payroll');
const User = require('../models/User');

class PayrollService {
  
  static async calculatePayroll(employeeId, year, month, generatedBy = null) {
    try {
      console.log(`📊 Calculating payroll for employee ${employeeId} - ${month} ${year}`);
      
      const employee = await User.findById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      // Check if payroll already exists
      const existingPayroll = await Payroll.findOne({
        employeeId,
        month: month.toString(),
        year: parseInt(year)
      });
      
      if (existingPayroll && existingPayroll.paymentStatus !== 'Pending') {
        throw new Error(`Payroll for ${month} ${year} already exists and is ${existingPayroll.paymentStatus}`);
      }
      
      // Get employee salary and allowances
      const basicSalary = employee.salary || 0;
      const allowances = {
        fuel: employee.fuelAllowance || 0,
        medical: employee.medicalAllowance || 0,
        special: employee.specialAllowance || 0,
        other: employee.otherAllowance || 0,
        total: 0
      };
      
      // Calculate totals
      const allowancesTotal = allowances.fuel + allowances.medical + allowances.special + allowances.other;
      allowances.total = allowancesTotal;
      const grossSalary = basicSalary + allowancesTotal;
      
      const bankDetails = {
        bankName: employee.bankName || '',
        accountNumber: employee.bankAccountNumber || '',
        accountTitle: employee.bankAccountTitle || ''
      };
      
      const payrollData = {
        employeeId,
        month: month.toString(),
        year: parseInt(year),
        basicSalary,
        allowances,
        grossSalary,
        netSalary: grossSalary,  // No deductions
        bankDetails,
        generatedBy,
        generatedAt: new Date(),
        notes: `Payroll generated for ${month} ${year}`
      };
      
      let payroll;
      if (existingPayroll) {
        payroll = await Payroll.findByIdAndUpdate(
          existingPayroll._id,
          { ...payrollData, isManuallyAdjusted: false },
          { new: true }
        );
      } else {
        payroll = await Payroll.create(payrollData);
      }
      
      console.log(`✅ Payroll created for ${employee.name}: Basic=${basicSalary}, Allowances=${allowancesTotal}, Gross=${grossSalary}`);
      return payroll;
      
    } catch (error) {
      console.error('Error calculating payroll:', error);
      throw error;
    }
  }
  
  static async generateBulkPayroll(employeeIds, year, month, generatedBy = null) {
    const results = { success: [], failed: [], skipped: [] };
    
    for (const employeeId of employeeIds) {
      try {
        const payroll = await this.calculatePayroll(employeeId, year, month, generatedBy);
        const employee = await User.findById(employeeId);
        results.success.push({
          employeeId,
          name: employee?.name || 'Unknown',
          payrollId: payroll._id,
          basicSalary: payroll.basicSalary,
          allowances: payroll.allowances.total,
          grossSalary: payroll.grossSalary
        });
      } catch (error) {
        results.failed.push({
          employeeId,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  static async generateAllPayroll(year, month, generatedBy = null) {
    const results = { success: [], failed: [], skipped: [] };
    
    try {
      const employees = await User.find({ 
        isActive: true,
        role: { $in: ['employee', 'hr', 'manager'] }
      });
      
      console.log(`📊 Generating payroll for ${employees.length} employees`);
      
      for (const employee of employees) {
        try {
          const existing = await Payroll.findOne({
            employeeId: employee._id,
            month: month.toString(),
            year: parseInt(year),
            paymentStatus: 'Paid'
          });
          
          if (existing) {
            results.skipped.push({
              employeeId: employee._id,
              name: employee.name,
              reason: 'Payroll already paid'
            });
            continue;
          }
          
          const payroll = await this.calculatePayroll(employee._id, year, month, generatedBy);
          results.success.push({
            employeeId: employee._id,
            name: employee.name,
            payrollId: payroll._id,
            basicSalary: payroll.basicSalary,
            allowances: payroll.allowances.total,
            grossSalary: payroll.grossSalary
          });
          
        } catch (error) {
          results.failed.push({
            employeeId: employee._id,
            name: employee.name,
            error: error.message
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Bulk generation error:', error);
      throw error;
    }
  }
  
  static async getAllPayrolls(filters = {}, page = 1, limit = 10) {
    try {
      const query = {};
      
      if (filters.year && filters.year !== 'all' && filters.year !== '') {
        query.year = parseInt(filters.year);
      }
      if (filters.month && filters.month !== 'all') {
        query.month = filters.month;
      }
      if (filters.status && filters.status !== 'all') {
        query.paymentStatus = filters.status;
      }
      if (filters.employeeId) {
        query.employeeId = filters.employeeId;
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const data = await Payroll.find(query)
        .populate('employeeId', 'name employeeId email department position salary fuelAllowance medicalAllowance specialAllowance otherAllowance bankName bankAccountNumber bankAccountTitle')
        .sort({ year: -1, month: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const formattedData = data.map(payroll => ({
        _id: payroll._id,
        employeeId: payroll.employeeId,
        employeeName: payroll.employeeId?.name || 'N/A',
        employeeCode: payroll.employeeId?.employeeId || 'N/A',
        employeeDepartment: payroll.employeeId?.department || 'N/A',
        month: payroll.month,
        year: payroll.year,
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        grossSalary: payroll.grossSalary,
        netSalary: payroll.netSalary,
        paymentStatus: payroll.paymentStatus,
        paymentDate: payroll.paymentDate,
        paymentMethod: payroll.paymentMethod,
        transactionId: payroll.transactionId,
        bankDetails: payroll.bankDetails,
        notes: payroll.notes,
        generatedAt: payroll.generatedAt,
        createdAt: payroll.createdAt
      }));
      
      const total = await Payroll.countDocuments(query);
      
      return {
        data: formattedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };
      
    } catch (error) {
      console.error('Get all payrolls error:', error);
      throw error;
    }
  }
  
  static async getPayrollWithDetails(payrollId) {
    try {
      const payroll = await Payroll.findById(payrollId)
        .populate('employeeId', 'name employeeId email department position salary fuelAllowance medicalAllowance specialAllowance otherAllowance bankName bankAccountNumber bankAccountTitle');
      
      if (!payroll) return null;
      
      return {
        _id: payroll._id,
        employeeId: payroll.employeeId,
        employeeName: payroll.employeeId?.name || 'N/A',
        employeeCode: payroll.employeeId?.employeeId || 'N/A',
        employeeDepartment: payroll.employeeId?.department || 'N/A',
        month: payroll.month,
        year: payroll.year,
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        grossSalary: payroll.grossSalary,
        netSalary: payroll.netSalary,
        paymentStatus: payroll.paymentStatus,
        paymentDate: payroll.paymentDate,
        paymentMethod: payroll.paymentMethod,
        transactionId: payroll.transactionId,
        bankDetails: payroll.bankDetails,
        notes: payroll.notes
      };
      
    } catch (error) {
      console.error('Get payroll details error:', error);
      throw error;
    }
  }
  
  static async updatePayrollStatus(payrollId, status, paymentDetails = {}, processedBy = null) {
    try {
      const updateData = {
        paymentStatus: status,
        ...(paymentDetails.paymentDate && { paymentDate: paymentDetails.paymentDate }),
        ...(paymentDetails.paymentMethod && { paymentMethod: paymentDetails.paymentMethod }),
        ...(paymentDetails.transactionId && { transactionId: paymentDetails.transactionId }),
        ...(paymentDetails.notes && { notes: paymentDetails.notes }),
        ...(status === 'Paid' && { processedAt: new Date(), processedBy })
      };
      
      const payroll = await Payroll.findByIdAndUpdate(
        payrollId,
        updateData,
        { new: true }
      ).populate('employeeId', 'name employeeId');
      
      return payroll;
      
    } catch (error) {
      console.error('Update status error:', error);
      throw error;
    }
  }
  
  static async processBulkPayment(payrollIds, paymentDetails, processedBy = null) {
    const results = { success: [], failed: [] };
    
    for (const payrollId of payrollIds) {
      try {
        const payroll = await this.updatePayrollStatus(
          payrollId,
          'Paid',
          paymentDetails,
          processedBy
        );
        
        results.success.push({
          payrollId,
          employeeName: payroll?.employeeId?.name || 'Unknown',
          basicSalary: payroll?.basicSalary || 0,
          allowances: payroll?.allowances?.total || 0,
          grossSalary: payroll?.grossSalary || 0
        });
        
      } catch (error) {
        results.failed.push({
          payrollId,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  static async deletePayroll(payrollId) {
    try {
      const payroll = await Payroll.findById(payrollId);
      if (!payroll) {
        throw new Error('Payroll not found');
      }
      
      if (payroll.paymentStatus === 'Paid') {
        throw new Error('Cannot delete a paid payroll record');
      }
      
      await Payroll.findByIdAndDelete(payrollId);
      return { success: true, message: 'Payroll deleted successfully' };
      
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }
  
  static async getStats(year, month) {
    try {
      const matchQuery = {};
      if (year && year !== 'all' && year !== '') matchQuery.year = parseInt(year);
      if (month && month !== 'all') matchQuery.month = month;
      
      const stats = await Payroll.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalPayrolls: { $sum: 1 },
            totalAmount: { $sum: '$grossSalary' },
            paidPayments: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
            pendingPayments: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, 1, 0] } },
            paidAmount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$grossSalary', 0] } },
            pendingAmount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, '$grossSalary', 0] } }
          }
        }
      ]);
      
      const result = stats[0] || {
        totalPayrolls: 0,
        totalAmount: 0,
        paidPayments: 0,
        pendingPayments: 0,
        paidAmount: 0,
        pendingAmount: 0,
        averageSalary: 0
      };
      
      result.averageSalary = result.totalPayrolls > 0 ? result.totalAmount / result.totalPayrolls : 0;
      
      return result;
      
    } catch (error) {
      console.error('Get stats error:', error);
      return {
        totalPayrolls: 0,
        pendingPayments: 0,
        paidPayments: 0,
        totalAmount: 0,
        averageSalary: 0
      };
    }
  }
  
  static async getEligibleEmployees() {
    try {
      const employees = await User.find(
        { 
          isActive: true,
          role: { $in: ['employee', 'hr', 'manager'] }
        },
        'name employeeId email department position salary fuelAllowance medicalAllowance specialAllowance otherAllowance bankName bankAccountNumber bankAccountTitle'
      ).sort({ name: 1 });
      
      return employees;
      
    } catch (error) {
      console.error('Get employees error:', error);
      throw error;
    }
  }
  
  static async getAvailableMonthsYears() {
    try {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const years = await Payroll.distinct('year');
      years.sort((a, b) => b - a);
      
      if (years.length === 0) {
        const currentYear = new Date().getFullYear();
        years.push(currentYear);
      }
      
      return { months, years };
      
    } catch (error) {
      console.error('Get months/years error:', error);
      const currentYear = new Date().getFullYear();
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return { months, years: [currentYear - 1, currentYear, currentYear + 1] };
    }
  }
}

module.exports = PayrollService;