const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  month: { 
    type: String, 
    required: true 
  },
  year: { 
    type: Number, 
    required: true 
  },
  
  // Salary fields
  salary: { type: Number, default: 0 },
  fuelAllowance: { type: Number, default: 0 },
  medicalAllowance: { type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },
  otherAllowance: { type: Number, default: 0 },
  
  // Employee snapshot
  employeeName: { type: String, default: '' },
  employeeCode: { type: String, default: '' },
  employeeDepartment: { type: String, default: '' },
  employeePosition: { type: String, default: '' },
  employeeEmail: { type: String, default: '' },  // ✅ IMPORTANT: Store email
  employeePhone: { type: String, default: '' },
  employeeAddress: { type: String, default: '' },
  employeeImage: { type: String, default: '' },
  
  // Bank Details
  bankName: { type: String, default: '' },
  bankAccountNumber: { type: String, default: '' },
  bankAccountTitle: { type: String, default: '' },
  
  // Payment Status
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Failed'], 
    default: 'Pending' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['Bank Transfer', 'Cash', 'Cheque'], 
    default: 'Bank Transfer' 
  },
  paymentDate: Date,
  transactionId: String,
  paidAt: Date,
  
  // Email tracking fields
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date, default: null },
  emailResendCount: { type: Number, default: 0 },
  
  // Notes
  notes: String,
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isManuallyCreated: { type: Boolean, default: false }
}, { 
  timestamps: true 
});

// Virtual for total salary
payrollSchema.virtual('totalSalary').get(function() {
  return (this.salary || 0) + (this.fuelAllowance || 0) + 
         (this.medicalAllowance || 0) + (this.specialAllowance || 0) + 
         (this.otherAllowance || 0);
});

// Compound index
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ employeeEmail: 1 });  // ✅ Add index for email lookup

module.exports = mongoose.model('Payroll', payrollSchema);