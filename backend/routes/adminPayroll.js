const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../utils/authMiddleware');
const adminPayroll = require('../controllers/adminPayrollController');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `payroll_import_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  }
});

// Debug middleware
router.use(protect);
router.use((req, res, next) => {
  console.log(`🔍 [ADMIN PAYROLL] User: ${req.user?.email}, Role: ${req.user?.role}`);
  next();
});

// ✅ HR KO ACCESS DENE KE LIYE 'hr' ADD KIYA
router.use(authorize('admin', 'superadmin', 'hr'));

// Routes
router.post('/generate', adminPayroll.generatePayroll);
router.post('/bulk-generate', adminPayroll.bulkGeneratePayroll);
router.post('/manual-create', adminPayroll.createManualPayroll);
router.get('/', adminPayroll.getAllPayroll);
router.get('/stats', adminPayroll.getPayrollStats);
router.get('/months-years', adminPayroll.getPayrollMonthsYears);
router.get('/employees', adminPayroll.getEmployeesForPayroll);
router.get('/:id', adminPayroll.getPayrollById);
router.get('/payslip/:id', adminPayroll.generatePayslip);
router.get('/payslip/:id/download', adminPayroll.downloadPayslipFile);
router.get('/:id/payslip-transcript', adminPayroll.getPayslipTranscript);
router.put('/:id', adminPayroll.updatePayroll);
router.patch('/:id/status', adminPayroll.updatePayrollStatus);
router.delete('/:id', adminPayroll.deletePayroll);
router.post('/bulk-payment', adminPayroll.processBulkPayment);
router.get('/export/excel', adminPayroll.exportToExcel);
router.post('/import/excel', upload.single('file'), adminPayroll.importFromExcel);
router.post('/:id/resend-email', adminPayroll.resendSalarySlipEmail);

console.log('✅ Admin Payroll Routes Loaded (HR Access Enabled)');

module.exports = router;