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

// ✅ DEBUG MIDDLEWARE - Add this to see user role
router.use(protect);
router.use((req, res, next) => {
  console.log(`🔍 [DEBUG] User role: ${req.user?.role}, SystemRole: ${req.user?.systemRole}`);
  console.log(`🔍 [DEBUG] Request URL: ${req.method} ${req.originalUrl}`);
  next();
});
router.use(authorize('hr', 'admin'));

// Generation Routes
router.post('/generate', adminPayroll.generatePayroll);
router.post('/bulk-generate', adminPayroll.bulkGeneratePayroll);

// Fetch Routes
router.get('/', adminPayroll.getAllPayroll);
router.get('/stats', adminPayroll.getPayrollStats);
router.get('/months-years', adminPayroll.getPayrollMonthsYears);
router.get('/employees', adminPayroll.getEmployeesForPayroll);
router.get('/payslip/:id', adminPayroll.generatePayslip);
router.get('/:id', adminPayroll.getPayrollById);

// Update Routes
router.put('/:id', adminPayroll.updatePayroll);
router.patch('/:id/status', adminPayroll.updatePayrollStatus);
router.delete('/:id', adminPayroll.deletePayroll);

// Excel Export/Import
router.get('/export/excel', adminPayroll.exportToExcel);
router.post('/import/excel', upload.single('file'), adminPayroll.importFromExcel);
// Download payslip
router.get('/payslip/:id/download', adminPayroll.downloadPayslipFile);
// Bulk Payment
router.post('/bulk-payment', adminPayroll.processBulkPayment);

module.exports = router;