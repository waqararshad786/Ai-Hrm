const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../utils/authMiddleware');
const adminPayroll = require('../controllers/adminPayrollController');
const employeePayroll = require('../controllers/employeePayrollController');

// Admin aur HR dono ko allow
router.use(protect);
router.use(authorize('hr', 'admin'));

// HR/Admin ki apni salary (employee side se)
router.get('/my-salary', employeePayroll.getMyDashboard);
router.get('/my-payrolls', employeePayroll.getMyPayroll);
router.get('/my-years', employeePayroll.getPayrollYears);
router.get('/my-payslip/:id', employeePayroll.getMyPayslip);
router.get('/my-payslip/:id/download', employeePayroll.downloadPayslip);

// Sab employees ki salaries (admin payroll se)
router.get('/all-payrolls', adminPayroll.getAllPayroll);
router.get('/stats', adminPayroll.getPayrollStats);
router.get('/months-years', adminPayroll.getPayrollMonthsYears);
router.get('/employees-list', adminPayroll.getEmployeesForPayroll);
router.get('/payslip-view/:id', adminPayroll.generatePayslip);
router.get('/payslip-download/:id', adminPayroll.downloadPayslipFile);

console.log('✅ HR Payroll Routes Loaded');

module.exports = router;