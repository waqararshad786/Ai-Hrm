import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ✅ FIX: FormInput component ke BAHAR define kiya — yahi bug ki wajah thi
// Pehle yeh component ke ANDAR tha, har render pe naya component banta tha
// jis ki wajah se focus uth jata tha aur sirf 1 character likhta tha
const FormInput = ({ label, name, type = 'text', placeholder, required = false, formData, errors, fieldSuggestions, onChange, onBlur, ...props }) => {
  const currentValue = formData[name] === undefined || formData[name] === null ? '' : formData[name];
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={currentValue}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
          ${errors[name] ? 'border-red-500 bg-red-50' : 'border-gray-300'}
          ${fieldSuggestions[name] && !errors[name] && currentValue ? 'border-yellow-400' : ''}`}
        {...props}
      />
      {errors[name] && (
        <p className="mt-2 text-sm text-red-600 flex items-start">
          <span className="mr-1">⚠️</span> {errors[name]}
        </p>
      )}
      {fieldSuggestions[name] && !errors[name] && currentValue && (
        <p className="mt-2 text-sm text-yellow-600 flex items-start">
          <span className="mr-1">💡</span> {fieldSuggestions[name]}
        </p>
      )}
    </div>
  );
};

const AddEmployee = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    idCardNumber: '',
    idCardIssueDate: '',
    idCardExpiryDate: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: '',
    maritalStatus: 'single',
    employeeType: 'permanent',
    showEmployeeTypeCustom: false,
    customEmployeeType: '',
    employmentStatus: 'active',
    showEmploymentStatusCustom: false,
    customEmploymentStatus: '',
    role: 'employee',
    department: 'General',
    showDepartmentCustom: false,
    customDepartment: '',
    position: 'Employee',
    showPositionCustom: false,
    customPosition: '',
    joiningDate: '',
    probationPeriod: '3',
    showProbationPeriodCustom: false,
    customProbationPeriod: '',
    reportingManager: '',
    systemRole: 'employee',
    showSystemRoleCustom: false,
    customSystemRole: '',
    presentAddress: '',
    permanentAddress: '',
    city: '',
    state: '',
    country: 'Pakistan',
    postalCode: '',
    emergencyContacts: [
      { name: '', phone: '', relation: 'parent' }
    ],
    salary: '',
    fuelAllowance: '',
    medicalAllowance: '',
    specialAllowance: '',
    otherAllowance: '',
    totalSalary: '0',
    currency: 'PKR',
    salaryFrequency: 'monthly',
    bankName: '',
    bankAccountNumber: '',
    bankAccountTitle: '',
    bankBranchCode: '',
    ibanNumber: '',
    qualifications: '',
    experiences: [{ company: '', position: '', duration: '', description: '' }],
    previousExperience: '',
    skills: [{ name: '', level: 'intermediate' }],
    isActive: true,
    hasSystemAccess: true
  });
  
  const [documents, setDocuments] = useState({
    profilePicture: null,
    cv: null,
    cnicFront: null,
    cnicBack: null,
    degree: null,
    experienceLetters: [],
    otherDocuments: []
  });
  
  const [documentPreviews, setDocumentPreviews] = useState({});
  const [profilePreview, setProfilePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fieldSuggestions, setFieldSuggestions] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatedEmployeeId, setGeneratedEmployeeId] = useState('');
  
  const departments = [
    'General', 'IT', 'Human Resources', 'Finance', 'Marketing', 'Sales',
    'Operations', 'Customer Service', 'Research & Development', 'Administration',
    'Engineering', 'Product', 'Quality Assurance', 'Legal', 'Procurement',
    'Logistics', 'Healthcare', 'Education'
  ];

  const employeeTypes = [
    { value: 'permanent', label: 'Permanent Employee' },
    { value: 'contract', label: 'Contractual Employee' },
    { value: 'intern', label: 'Intern/Trainee' },
    { value: 'probation', label: 'Probationary' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'visitor', label: 'Visitor/Special Access' },
    { value: 'part-time', label: 'Part-time Employee' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'other', label: 'Other (Add Custom)' }
  ];

  const employmentStatuses = [
    { value: 'active', label: 'Active' },
    { value: 'on-leave', label: 'On Leave' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'resigned', label: 'Resigned' },
    { value: 'other', label: 'Other (Add Custom)' }
  ];

  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  const maritalStatuses = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'separated', label: 'Separated' }
  ];

  const bloodGroups = [
    { value: '', label: 'Select Blood Group' },
    { value: 'A+', label: 'A Positive (A+)' },
    { value: 'A-', label: 'A Negative (A-)' },
    { value: 'B+', label: 'B Positive (B+)' },
    { value: 'B-', label: 'B Negative (B-)' },
    { value: 'O+', label: 'O Positive (O+)' },
    { value: 'O-', label: 'O Negative (O-)' },
    { value: 'AB+', label: 'AB Positive (AB+)' },
    { value: 'AB-', label: 'AB Negative (AB-)' }
  ];

  const emergencyRelations = [
    { value: 'parent', label: 'Parent' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'child', label: 'Child' },
    { value: 'friend', label: 'Friend' },
    { value: 'relative', label: 'Relative' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'other', label: 'Other' }
  ];

  const probationPeriods = [
    { value: '1', label: '1 Month' },
    { value: '2', label: '2 Months' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '12', label: '12 Months' },
    { value: 'none', label: 'No Probation' },
    { value: 'other', label: 'Other (Add Custom)' }
  ];

  const pakistaniCities = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot', 'Sargodha', 'Bahawalpur',
    'Sukkur', 'Jhang', 'Sheikhupura', 'Mardan', 'Gujrat', 'Kasur',
    'Rahim Yar Khan', 'Other'
  ];

  const salaryFrequencies = ['hourly', 'daily', 'weekly', 'bi-weekly', 'monthly', 'annually'];
  
  const currencies = [
    { code: 'PKR', name: 'Pakistani Rupee (₨)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'AED', name: 'UAE Dirham (د.إ)' },
    { code: 'SAR', name: 'Saudi Riyal (ر.س)' }
  ];

  const systemRoles = [
    { value: 'employee', label: 'Employee (Basic Access)' },
    { value: 'hr', label: 'HR Personnel' },
    { value: 'admin', label: 'Administrator' },
    { value: 'other', label: 'Other (Add Custom)' }
  ];

  const skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  const validateName = (name) => {
    if (name && name.length > 10) {
      return { valid: false, message: 'Name cannot exceed 10 characters' };
    }
    return { valid: true, message: '' };
  };

  const validateFatherName = (name) => {
    if (name && name.length > 10) {
      return { valid: false, message: 'Father name cannot exceed 10 characters' };
    }
    return { valid: true, message: '' };
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) return { valid: true, message: '' };
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Please enter a valid email address (e.g., name@company.com)' };
    }
    return { valid: true, message: '' };
  };

  const validateCNIC = (cnic) => {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnic) return { valid: true, message: '' };
    if (!cnicRegex.test(cnic)) {
      return { valid: false, message: 'CNIC must be in format: 12345-1234567-1' };
    }
    return { valid: true, message: '' };
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phone) return { valid: true, message: '' };
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return { valid: false, message: 'Phone number must be 10-15 digits (e.g., +923001234567)' };
    }
    return { valid: true, message: '' };
  };

  const validateDateOfBirth = (dob) => {
    if (!dob) return { valid: true, message: '' };
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    
    if (age < 18) {
      return { valid: false, message: 'Employee must be at least 18 years old' };
    }
    if (age > 60) {
      return { valid: false, message: 'Employee must be under 60 years old' };
    }
    return { valid: true, message: '' };
  };

  const validateCNICDates = (issueDate, expiryDate) => {
    if (!issueDate || !expiryDate) return { valid: true, message: '' };
    
    const issue = new Date(issueDate);
    const expiry = new Date(expiryDate);
    const diffYears = (expiry - issue) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (diffYears > 10) {
      return { valid: false, message: 'CNIC validity cannot exceed 10 years from issue date' };
    }
    if (issue > expiry) {
      return { valid: false, message: 'Issue date cannot be after expiry date' };
    }
    if (expiry < new Date()) {
      return { valid: false, message: 'CNIC has expired' };
    }
    return { valid: true, message: '' };
  };

  const getFieldSuggestion = (fieldName, value) => {
    const suggestions = {
      name: value ? `Enter full name (max 10 chars). Current: ${value.length}/10` : 'Enter employee\'s full name (e.g., John Doe)',
      fatherName: value ? `Enter father\'s name (max 10 chars). Current: ${value.length}/10` : 'Enter father\'s full name',
      email: 'Format: name@company.com (e.g., john.doe@company.com)',
      phone: 'Format: +923001234567 or 03001234567 (10-15 digits)',
      idCardNumber: 'Format: 12345-1234567-1 (5 digits-7 digits-1 digit)',
      idCardIssueDate: 'Select date when CNIC was issued',
      idCardExpiryDate: 'Select date when CNIC expires (max 10 years from issue date)',
      dateOfBirth: 'Select date (Age must be between 18-60 years)',
      presentAddress: 'Enter complete address with house number, street, area',
      joiningDate: 'Select employee\'s first working day',
      salary: 'Enter basic monthly salary amount',
      bankAccountNumber: 'Enter 13-24 digit account number'
    };
    return suggestions[fieldName] || '';
  };

  const showRealTimeError = useCallback((fieldName, value) => {
    let validation;
    switch (fieldName) {
      case 'name':
        validation = validateName(value);
        break;
      case 'fatherName':
        validation = validateFatherName(value);
        break;
      case 'email':
        validation = validateEmail(value);
        break;
      case 'idCardNumber':
        validation = validateCNIC(value);
        break;
      case 'phone':
        validation = validatePhone(value);
        break;
      case 'dateOfBirth':
        validation = validateDateOfBirth(value);
        break;
      case 'idCardIssueDate':
      case 'idCardExpiryDate':
        validation = validateCNICDates(
          fieldName === 'idCardIssueDate' ? value : formData.idCardIssueDate,
          fieldName === 'idCardExpiryDate' ? value : formData.idCardExpiryDate
        );
        break;
      default:
        return;
    }
    
    if (validation && !validation.valid) {
      setErrors(prev => ({ ...prev, [fieldName]: validation.message }));
    } else if (validation && validation.valid) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
    
    const suggestion = getFieldSuggestion(fieldName, value);
    setFieldSuggestions(prev => ({ ...prev, [fieldName]: suggestion }));
  }, [formData.idCardIssueDate, formData.idCardExpiryDate]);

  const showFieldMap = {
    employeeType:    'showEmployeeTypeCustom',
    employmentStatus:'showEmploymentStatusCustom',
    department:      'showDepartmentCustom',
    position:        'showPositionCustom',
    probationPeriod: 'showProbationPeriodCustom',
    systemRole:      'showSystemRoleCustom',
  };

  const calculateTotalSalary = (formValues) => {
    const salary  = parseFloat(formValues.salary)           || 0;
    const fuel    = parseFloat(formValues.fuelAllowance)    || 0;
    const medical = parseFloat(formValues.medicalAllowance) || 0;
    const special = parseFloat(formValues.specialAllowance) || 0;
    const other   = parseFloat(formValues.otherAllowance)   || 0;
    return salary + fuel + medical + special + other;
  };

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'salary' || name === 'fuelAllowance' || name === 'medicalAllowance' || 
        name === 'specialAllowance' || name === 'otherAllowance') {
      setFormData(prev => {
        const updated = { ...prev, [name]: value };
        const newTotal = calculateTotalSalary(updated);
        return { ...updated, totalSalary: newTotal.toString() };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  }, []);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    if (value !== undefined && value !== '') {
      showRealTimeError(name, value);
    }
  }, [showRealTimeError]);

  const handleDropdownChange = (e) => {
    const { name, value } = e.target;
    const showField = showFieldMap[name];

    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(showField ? { [showField]: value === 'other' } : {})
    }));
  };

  const handleArrayFieldChange = (field, index, subField, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = { ...newArray[index], [subField]: value };
      return { ...prev, [field]: newArray };
    });
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { name: '', phone: '', relation: 'parent' }]
    }));
  };

  const removeEmergencyContact = (index) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
    }));
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experiences: [...prev.experiences, { company: '', position: '', duration: '', description: '' }]
    }));
  };

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', level: 'intermediate' }]
    }));
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleDocumentUpload = async (docType, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    try {
      setUploading(true);
      
      if (docType === 'profilePicture' || docType === 'cnicFront' || docType === 'cnicBack') {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          if (docType === 'profilePicture') {
            setProfilePreview(e.target.result);
          } else {
            setDocumentPreviews(prev => ({ ...prev, [docType]: e.target.result }));
          }
        };
        reader.readAsDataURL(file);
      }
      
      if (docType !== 'experienceLetters' && docType !== 'otherDocuments') {
        setDocuments(prev => ({ ...prev, [docType]: files[0] }));
      } else {
        const uploadFormData = new FormData();
        files.forEach(file => uploadFormData.append('files', file));
        
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:5000/api/upload/documents/multiple',
          uploadFormData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        if (response.data.success) {
          setDocuments(prev => ({
            ...prev,
            [docType]: [...prev[docType], ...response.data.filePaths]
          }));
        }
      }
    } catch (error) {
      console.error('Upload documents error:', error);
      alert('Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (docType, index = null) => {
    if (index !== null) {
      setDocuments(prev => ({
        ...prev,
        [docType]: prev[docType].filter((_, i) => i !== index)
      }));
    } else {
      setDocuments(prev => ({ ...prev, [docType]: null }));
      if (docType === 'profilePicture') {
        setProfilePreview('');
      } else if (docType === 'cnicFront' || docType === 'cnicBack') {
        setDocumentPreviews(prev => ({ ...prev, [docType]: null }));
      }
    }
  };

  const addCustomOption = (field) => {
    const customField = `custom${field.charAt(0).toUpperCase() + field.slice(1)}`;
    const customValue = formData[customField];
    const showField = showFieldMap[field];
    
    if (customValue && customValue.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: customValue,
        ...(showField ? { [showField]: false } : {})
      }));
    }
  };

  const uploadFile = async (file, endpoint) => {
    if (!file) return null;
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `http://localhost:5000/api/upload/${endpoint}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) return response.data.filePath;
      return null;
    } catch (error) {
      console.error(`Upload ${endpoint} error:`, error.response?.data || error.message);
      return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.length > 10) {
      newErrors.name = 'Name cannot exceed 10 characters';
    }
    
    if (!formData.fatherName) {
      newErrors.fatherName = 'Father name is required';
    } else if (formData.fatherName.length > 10) {
      newErrors.fatherName = 'Father name cannot exceed 10 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) newErrors.email = emailValidation.message;
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.valid) newErrors.phone = phoneValidation.message;
    }
    
    if (!formData.idCardNumber) {
      newErrors.idCardNumber = 'CNIC number is required';
    } else {
      const cnicValidation = validateCNIC(formData.idCardNumber);
      if (!cnicValidation.valid) newErrors.idCardNumber = cnicValidation.message;
    }
    
    if (!formData.idCardIssueDate) {
      newErrors.idCardIssueDate = 'CNIC issue date is required';
    }
    
    if (!formData.idCardExpiryDate) {
      newErrors.idCardExpiryDate = 'CNIC expiry date is required';
    }
    
    if (formData.idCardIssueDate && formData.idCardExpiryDate) {
      const cnicDateValidation = validateCNICDates(formData.idCardIssueDate, formData.idCardExpiryDate);
      if (!cnicDateValidation.valid) {
        newErrors.idCardIssueDate = cnicDateValidation.message;
        newErrors.idCardExpiryDate = cnicDateValidation.message;
      }
    }
    
    if (!formData.employeeType) {
      newErrors.employeeType = 'Employee type is required';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (!formData.position) {
      newErrors.position = 'Position is required';
    }
    
    if (!formData.joiningDate) {
      newErrors.joiningDate = 'Joining date is required';
    }
    
    if (!formData.presentAddress) {
      newErrors.presentAddress = 'Present address is required';
    }
    
    if (formData.dateOfBirth) {
      const dobValidation = validateDateOfBirth(formData.dateOfBirth);
      if (!dobValidation.valid) newErrors.dateOfBirth = dobValidation.message;
    }
    
    formData.emergencyContacts.forEach((contact, index) => {
      if (contact.name && !contact.phone) {
        newErrors[`emergencyContactPhone_${index}`] = 'Emergency contact phone is required';
      }
      if (contact.phone && !contact.name) {
        newErrors[`emergencyContactName_${index}`] = 'Emergency contact name is required';
      }
    });
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.keys(validationErrors)[0];
      document.querySelector(`[name="${firstError}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setLoading(true);
    setServerError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('authToken');
      
      let profilePictureUrl = null;
      if (documents.profilePicture) {
        try {
          profilePictureUrl = await uploadFile(documents.profilePicture, 'profile');
        } catch (uploadError) {
          console.warn('Profile picture upload failed, continuing without it:', uploadError.message);
        }
      }
      
      const generateTemporaryPassword = (name, email) => {
        const firstName  = name.split(' ')[0].toLowerCase();
        const namePart   = firstName.slice(0, Math.min(4, firstName.length));
        const emailPart  = email.split('@')[0].slice(0, 3).toLowerCase();
        const randomNums = Math.floor(1000 + Math.random() * 9000);
        const specialChars = '!@#$%&*';
        const specialChar  = specialChars[Math.floor(Math.random() * specialChars.length)];
        return `${namePart.charAt(0).toUpperCase()}${namePart.slice(1)}${emailPart}${randomNums}${specialChar}`;
      };
      
      const temporaryPassword = generateTemporaryPassword(formData.name, formData.email);
      const resolvedSystemRole = formData.customSystemRole || formData.systemRole;

      const employeeData = {
        userAccount: {
          name:     formData.name,
          username: formData.email.split('@')[0],
          email:    formData.email,
          password: temporaryPassword,
          role:     resolvedSystemRole
        },
        
        employeeProfile: {
          name:             formData.name,
          fatherName:       formData.fatherName,
          email:            formData.email,
          phone:            formData.phone,
          alternatePhone:   formData.alternatePhone,
          idCardNumber:     formData.idCardNumber,
          idCardIssueDate:  formData.idCardIssueDate,
          idCardExpiryDate: formData.idCardExpiryDate,
          dateOfBirth:      formData.dateOfBirth,
          gender:           formData.gender,
          bloodGroup:       formData.bloodGroup,
          maritalStatus:    formData.maritalStatus,
          
          employeeType:    formData.customEmployeeType || formData.employeeType,
          department:      formData.customDepartment   || formData.department,
          position:        formData.customPosition     || formData.position,
          joiningDate:     formData.joiningDate,
          probationPeriod: formData.customProbationPeriod || formData.probationPeriod,
          reportingManager:formData.reportingManager,
          role:            resolvedSystemRole,
          isActive:        formData.isActive,
          hasSystemAccess: formData.hasSystemAccess,
          
          presentAddress:  formData.presentAddress,
          permanentAddress:formData.permanentAddress || formData.presentAddress,
          city:            formData.city,
          state:           formData.state,
          country:         formData.country,
          postalCode:      formData.postalCode,
          
          emergencyContacts: formData.emergencyContacts
            .filter(c => c.name && c.phone)
            .map(c => ({ name: c.name, phone: c.phone, relation: c.relation })),
          
          salary:           parseFloat(formData.salary)           || 0,
          fuelAllowance:    parseFloat(formData.fuelAllowance)    || 0,
          medicalAllowance: parseFloat(formData.medicalAllowance) || 0,
          specialAllowance: parseFloat(formData.specialAllowance) || 0,
          otherAllowance:   parseFloat(formData.otherAllowance)   || 0,
          currency:         formData.currency,
          salaryFrequency:  formData.salaryFrequency,
          
          bankName:          formData.bankName,
          bankAccountNumber: formData.bankAccountNumber,
          bankAccountTitle:  formData.bankAccountTitle,
          bankBranchCode:    formData.bankBranchCode,
          ibanNumber:        formData.ibanNumber,
          
          qualifications:    formData.qualifications,
          previousExperience:formData.previousExperience ? parseFloat(formData.previousExperience) : 0,
          experiences: formData.experiences
            .filter(exp => exp.company || exp.position)
            .map(exp => ({
              company:     exp.company,
              position:    exp.position,
              duration:    exp.duration,
              description: exp.description
            })),
          skills: formData.skills
            .filter(s => s.name)
            .map(s => ({ name: s.name, level: s.level })),
          
          ...(profilePictureUrl && { profilePicture: profilePictureUrl })
        }
      };
      
      const response = await axios.post(
        'http://localhost:5000/api/employees/create-with-account',
        employeeData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setGeneratedPassword(temporaryPassword);
        setGeneratedEmployeeId(response.data.data?.employeeId || response.data.employeeId || 'EMP-XXX');
        
        let successMsg = '✅ Employee added successfully!';
        successMsg += response.data.emailSent
          ? ' Login credentials have been sent to their email.'
          : ' Please provide the login credentials manually.';
        
        setSuccessMessage(successMsg);
        setShowPasswordModal(true);
        
        setTimeout(() => {
          setFormData({
            name: '', fatherName: '', email: '', phone: '', alternatePhone: '',
            idCardNumber: '', idCardIssueDate: '', idCardExpiryDate: '',
            dateOfBirth: '', gender: 'male', bloodGroup: '', maritalStatus: 'single',
            employeeType: 'permanent', showEmployeeTypeCustom: false, customEmployeeType: '',
            employmentStatus: 'active', showEmploymentStatusCustom: false, customEmploymentStatus: '',
            role: 'employee',
            department: 'General', showDepartmentCustom: false, customDepartment: '',
            position: 'Employee', showPositionCustom: false, customPosition: '',
            joiningDate: '',
            probationPeriod: '3', showProbationPeriodCustom: false, customProbationPeriod: '',
            reportingManager: '',
            systemRole: 'employee', showSystemRoleCustom: false, customSystemRole: '',
            presentAddress: '', permanentAddress: '', city: '', state: '',
            country: 'Pakistan', postalCode: '',
            emergencyContacts: [{ name: '', phone: '', relation: 'parent' }],
            salary: '', fuelAllowance: '', medicalAllowance: '', specialAllowance: '',
            otherAllowance: '', totalSalary: '0', currency: 'PKR', salaryFrequency: 'monthly',
            bankName: '', bankAccountNumber: '', bankAccountTitle: '', bankBranchCode: '', ibanNumber: '',
            qualifications: '',
            experiences: [{ company: '', position: '', duration: '', description: '' }],
            previousExperience: '',
            skills: [{ name: '', level: 'intermediate' }],
            isActive: true, hasSystemAccess: true
          });
          setDocuments({
            profilePicture: null, cv: null, cnicFront: null, cnicBack: null,
            degree: null, experienceLetters: [], otherDocuments: []
          });
          setProfilePreview('');
          setDocumentPreviews({});
          setErrors({});
          setFieldSuggestions({});
        }, 2000);
      } else {
        throw new Error(response.data.error || 'Failed to create employee');
      }
      
    } catch (error) {
      console.error('Add employee error:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.error || error.response.data?.message || 'Failed to add employee';
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          setServerError(`Error: Email ${formData.email} already exists. Please use a different email.`);
        } else {
          setServerError(`Error: ${errorMessage}`);
        }
      } else if (error.request) {
        setServerError('Network error. Please check your connection.');
      } else {
        setServerError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/admin/employees');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Profile picture should be less than 2MB');
      return;
    }
    
    setDocuments(prev => ({ ...prev, profilePicture: file }));
    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const getPositionsByDepartment = (dept) => {
    const positions = {
      'General':         ['Employee', 'Assistant', 'Coordinator', 'Trainee', 'Associate'],
      'IT':              ['Software Developer', 'Senior Developer', 'Team Lead', 'Project Manager',
                          'System Administrator', 'Network Engineer', 'Database Administrator',
                          'IT Support Specialist', 'DevOps Engineer', 'QA Engineer', 'UI/UX Designer',
                          'Data Analyst', 'Security Analyst', 'IT Manager'],
      'Human Resources': ['HR Manager', 'HR Generalist', 'Recruitment Specialist', 'Talent Acquisition',
                          'Compensation & Benefits Analyst', 'Training & Development Manager',
                          'Employee Relations Specialist', 'HR Business Partner', 'Payroll Administrator'],
      'Finance':         ['Finance Manager', 'Senior Accountant', 'Financial Analyst', 'Controller',
                          'Accounts Officer', 'Audit Associate', 'Tax Specialist', 'Cost Accountant',
                          'Finance Director'],
      'default':         ['Manager', 'Senior Manager', 'Director', 'Executive', 'Specialist',
                          'Analyst', 'Coordinator', 'Supervisor', 'Team Lead', 'Consultant']
    };
    return positions[dept] || positions.default;
  };

  const availablePositions = getPositionsByDepartment(formData.department);
  const currencySymbol = { PKR: '₨', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SAR: 'ر.س' }[formData.currency] || '₨';

  const PasswordInfoModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <span className="text-green-600 text-2xl">🔑</span>
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
            Employee Account Created Successfully
          </h3>
          <div className="mt-2 px-7 py-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-800">Login Credentials:</p>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Employee ID:</span>
                  <p className="font-mono text-lg font-bold text-gray-900">{generatedEmployeeId || 'Generating...'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="font-medium text-gray-900">{formData.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">System Role:</span>
                  <p className="font-medium text-gray-900 capitalize">{formData.customSystemRole || formData.systemRole}</p>
                </div>
                {generatedPassword && (
                  <div>
                    <span className="text-sm text-gray-600">Temporary Password:</span>
                    <div className="flex items-center justify-between bg-yellow-50 p-2 rounded">
                      <code className="font-mono text-lg font-bold">{generatedPassword}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedPassword)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800">⚠️ Important Instructions:</p>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>Credentials have been sent to employee's email</li>
                <li>Employee must change password on first login</li>
                <li>Keep this password secure until employee confirms receipt</li>
                <li>Contact IT if email is not received within 15 minutes</li>
              </ul>
            </div>
          </div>
          <div className="items-center px-4 py-3">
            <button
              onClick={() => { setShowPasswordModal(false); navigate('/admin/employees'); }}
              className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              OK, Return to Employees
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {showPasswordModal && <PasswordInfoModal />}
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
              <p className="mt-2 text-gray-600">Complete employee profile for HRM system. All fields with * are required.</p>
            </div>
            <button
              onClick={() => navigate('/admin/employees')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Employees
            </button>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between max-w-3xl">
              {['Basic Info', 'Employment', 'Address', 'Emergency', 'Salary', 'Documents'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index < 5 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium">{step}</span>
                  {index < 5 && <div className="ml-4 w-16 h-0.5 bg-blue-600"></div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {serverError && !successMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{serverError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
            
            {/* Section 1: Personal Information */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">1</span>
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <FormInput 
                    label="Full Name" 
                    name="name" 
                    placeholder="John Doe" 
                    required
                    formData={formData}
                    errors={errors}
                    fieldSuggestions={fieldSuggestions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <FormInput 
                    label="Father Name" 
                    name="fatherName" 
                    placeholder="Father's Name" 
                    required
                    formData={formData}
                    errors={errors}
                    fieldSuggestions={fieldSuggestions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <FormInput 
                    label="Email Address" 
                    name="email" 
                    type="email" 
                    placeholder="john.doe@company.com" 
                    required
                    formData={formData}
                    errors={errors}
                    fieldSuggestions={fieldSuggestions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <FormInput 
                    label="Primary Phone" 
                    name="phone" 
                    type="tel" 
                    placeholder="+923134750548" 
                    required
                    formData={formData}
                    errors={errors}
                    fieldSuggestions={fieldSuggestions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <FormInput 
                    label="Alternate Phone" 
                    name="alternatePhone" 
                    type="tel" 
                    placeholder="+923001234567"
                    formData={formData}
                    errors={errors}
                    fieldSuggestions={fieldSuggestions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <FormInput 
                    label="CNIC/NICOP Number" 
                    name="idCardNumber" 
                    placeholder="42101-1234567-1" 
                    required
                    formData={formData}
                    errors={errors}
                    fieldSuggestions={fieldSuggestions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <FormInput 
                    label="CNIC Issue Date" 
                    name="idCardIssueDate" 
                    type="date" 
                    required
                    formData={formData}
                    errors={errors}
                    fieldSuggestions={fieldSuggestions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <FormInput 
                    label="CNIC Expiry Date" 
                    name="idCardExpiryDate" 
                    type="date" 
                    required
                    formData={formData}
                    errors={errors}
                    fieldSuggestions={fieldSuggestions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <FormInput 
                    label="Date of Birth" 
                    name="dateOfBirth" 
                    type="date"
                    formData={formData}
                    errors={errors}
                    fieldSuggestions={fieldSuggestions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {genders.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {bloodGroups.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {maritalStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Employment Information */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">2</span>
                Employment Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Type *</label>
                  <select name="employeeType" value={formData.employeeType} onChange={handleDropdownChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.employeeType ? 'border-red-500' : 'border-gray-300'}`}>
                    <option value="">Select Type</option>
                    {employeeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {formData.showEmployeeTypeCustom && (
                    <div className="mt-2">
                      <input type="text" name="customEmployeeType" value={formData.customEmployeeType || ''} onChange={handleChange}
                        placeholder="Enter custom employee type"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <button type="button" onClick={() => addCustomOption('employeeType')}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Add Custom Type
                      </button>
                    </div>
                  )}
                  {errors.employeeType && <p className="mt-2 text-sm text-red-600">{errors.employeeType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select name="department" value={formData.department} onChange={handleDropdownChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.department ? 'border-red-500' : 'border-gray-300'}`}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    <option value="other">Other (Add Custom)</option>
                  </select>
                  {formData.showDepartmentCustom && (
                    <div className="mt-2">
                      <input type="text" name="customDepartment" value={formData.customDepartment || ''} onChange={handleChange}
                        placeholder="Enter custom department"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <button type="button" onClick={() => addCustomOption('department')}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Add Custom Department
                      </button>
                    </div>
                  )}
                  {errors.department && <p className="mt-2 text-sm text-red-600">{errors.department}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                  <select name="position" value={formData.position} onChange={handleDropdownChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.position ? 'border-red-500' : 'border-gray-300'}`}>
                    <option value="">Select Position</option>
                    {availablePositions.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="other">Other (Add Custom)</option>
                  </select>
                  {formData.showPositionCustom && (
                    <div className="mt-2">
                      <input type="text" name="customPosition" value={formData.customPosition || ''} onChange={handleChange}
                        placeholder="Enter custom position"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <button type="button" onClick={() => addCustomOption('position')}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Add Custom Position
                      </button>
                    </div>
                  )}
                  {errors.position && <p className="mt-2 text-sm text-red-600">{errors.position}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date *</label>
                  <input type="date" name="joiningDate" value={formData.joiningDate || ''} onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.joiningDate ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.joiningDate && <p className="mt-2 text-sm text-red-600">{errors.joiningDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Probation Period</label>
                  <select name="probationPeriod" value={formData.probationPeriod} onChange={handleDropdownChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {probationPeriods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  {formData.showProbationPeriodCustom && (
                    <div className="mt-2">
                      <input type="text" name="customProbationPeriod" value={formData.customProbationPeriod || ''} onChange={handleChange}
                        placeholder="Enter custom probation period"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <button type="button" onClick={() => addCustomOption('probationPeriod')}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Add Custom Period
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Manager</label>
                  <input type="text" name="reportingManager" value={formData.reportingManager || ''} onChange={handleChange}
                    placeholder="Manager's name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">System Role</label>
                  <select name="systemRole" value={formData.systemRole} onChange={handleDropdownChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {systemRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  {formData.showSystemRoleCustom && (
                    <div className="mt-2">
                      <input type="text" name="customSystemRole" value={formData.customSystemRole || ''} onChange={handleChange}
                        placeholder="Enter custom system role"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <button type="button" onClick={() => addCustomOption('systemRole')}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Add Custom Role
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Address Information */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">3</span>
                Address Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Present Address *</label>
                  <textarea name="presentAddress" value={formData.presentAddress || ''} onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="House #, Street, Area" rows="3"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.presentAddress ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.presentAddress && <p className="mt-2 text-sm text-red-600">{errors.presentAddress}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permanent Address</label>
                  <textarea name="permanentAddress" value={formData.permanentAddress || ''} onChange={handleChange}
                    placeholder="Permanent residential address" rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  <div className="mt-2 flex items-center">
                    <input type="checkbox" id="sameAsPresent"
                      onChange={(e) => {
                        if (e.target.checked) setFormData(prev => ({ ...prev, permanentAddress: prev.presentAddress }));
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                    <label htmlFor="sameAsPresent" className="ml-2 text-sm text-gray-600">Same as present address</label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <select name="city" value={formData.city || ''} onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select City</option>
                      {pakistaniCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                    <input type="text" name="state" value={formData.state || ''} onChange={handleChange}
                      placeholder="Sindh, Punjab, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <input type="text" name="postalCode" value={formData.postalCode || ''} onChange={handleChange}
                      placeholder="75000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Emergency Contacts */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">4</span>
                Emergency Contacts
              </h2>
              
              <div className="space-y-4">
                {formData.emergencyContacts.map((contact, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name {index === 0 && '*'}</label>
                        <input type="text" value={contact.name || ''}
                          onChange={(e) => handleArrayFieldChange('emergencyContacts', index, 'name', e.target.value)}
                          placeholder="Full name"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`emergencyContactName_${index}`] ? 'border-red-500' : 'border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone {index === 0 && '*'}</label>
                        <input type="tel" value={contact.phone || ''}
                          onChange={(e) => handleArrayFieldChange('emergencyContacts', index, 'phone', e.target.value)}
                          placeholder="+923001234567"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`emergencyContactPhone_${index}`] ? 'border-red-500' : 'border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                        <select value={contact.relation}
                          onChange={(e) => handleArrayFieldChange('emergencyContacts', index, 'relation', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          {emergencyRelations.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>
                    </div>
                    {index > 0 && (
                      <button type="button" onClick={() => removeEmergencyContact(index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                
                <button type="button" onClick={addEmergencyContact}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400 flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Another Emergency Contact
                </button>
              </div>
            </div>

            {/* Section 5: Salary Information */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">5</span>
                Salary Information
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: 'salary',           label: 'Basic Salary',      placeholder: '50000' },
                    { name: 'fuelAllowance',     label: 'Fuel Allowance',    placeholder: '5000'  },
                    { name: 'medicalAllowance',  label: 'Medical Allowance', placeholder: '3000'  },
                    { name: 'specialAllowance',  label: 'Special Allowance', placeholder: '2000'  },
                    { name: 'otherAllowance',    label: 'Other Allowance',   placeholder: '1000'  },
                  ].map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          {currencySymbol}
                        </span>
                        <input type="number" name={field.name} value={formData[field.name] || ''} onChange={handleChange}
                          placeholder={field.placeholder} step="0.01" min="0"
                          className="flex-1 min-w-0 block w-full px-3 py-3 rounded-none rounded-r-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select name="currency" value={formData.currency} onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      {currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary Frequency</label>
                    <select name="salaryFrequency" value={formData.salaryFrequency} onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      {salaryFrequencies.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Total Monthly Salary:</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {currencySymbol}{parseFloat(formData.totalSalary || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">Frequency: {formData.salaryFrequency}</p>
                      <p className="text-sm text-blue-700">Currency: {formData.currency}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                      <input type="text" name="bankName" value={formData.bankName || ''} onChange={handleChange}
                        placeholder="e.g., HBL, MCB, UBL"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                      <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber || ''} onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="1234567890123"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.bankAccountNumber ? 'border-red-500' : 'border-gray-300'}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Title</label>
                      <input type="text" name="bankAccountTitle" value={formData.bankAccountTitle || ''} onChange={handleChange}
                        placeholder="As per bank records"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">IBAN Number</label>
                      <input type="text" name="ibanNumber" value={formData.ibanNumber || ''} onChange={handleChange}
                        placeholder="PK00XXXX0000000000000000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Additional Information & Documents */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">6</span>
                Additional Information & Documents
              </h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                  <textarea name="qualifications" value={formData.qualifications || ''} onChange={handleChange}
                    placeholder="e.g., BS Computer Science, MBA, Certifications" rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>

                {/* Work Experience */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Work Experience</h3>
                  <div className="space-y-4">
                    {formData.experiences.map((exp, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                            <input type="text" value={exp.company || ''}
                              onChange={(e) => handleArrayFieldChange('experiences', index, 'company', e.target.value)}
                              placeholder="Company name"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                            <input type="text" value={exp.position || ''}
                              onChange={(e) => handleArrayFieldChange('experiences', index, 'position', e.target.value)}
                              placeholder="Job title"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                            <input type="text" value={exp.duration || ''}
                              onChange={(e) => handleArrayFieldChange('experiences', index, 'duration', e.target.value)}
                              placeholder="e.g., 2 years"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <input type="text" value={exp.description || ''}
                              onChange={(e) => handleArrayFieldChange('experiences', index, 'description', e.target.value)}
                              placeholder="Brief description"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                        </div>
                        <button type="button" onClick={() => removeExperience(index)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-800">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addExperience}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400 flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Work Experience
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Previous Experience (Years)</label>
                    <input type="number" name="previousExperience" value={formData.previousExperience || ''} onChange={handleChange}
                      placeholder="0" min="0" max="50" step="0.5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
                  <div className="space-y-4">
                    {formData.skills.map((skill, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Skill Name</label>
                            <input type="text" value={skill.name || ''}
                              onChange={(e) => handleArrayFieldChange('skills', index, 'name', e.target.value)}
                              placeholder="e.g., JavaScript, React, Project Management"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
                            <select value={skill.level}
                              onChange={(e) => handleArrayFieldChange('skills', index, 'level', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                              {skillLevels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeSkill(index)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-800">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addSkill}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400 flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Skill
                    </button>
                  </div>
                </div>

                {/* Documents Upload */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Documents Upload</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CV/Resume (PDF)</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {documents.cv ? (
                          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center">
                              <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{documents.cv.name}</p>
                                <p className="text-xs text-gray-500">{(documents.cv.size / 1024).toFixed(2)} KB</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeDocument('cv')} className="text-red-600 hover:text-red-800">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-500">Upload CV/Resume</p>
                          </>
                        )}
                        <input type="file" onChange={(e) => handleDocumentUpload('cv', e)}
                          accept=".pdf,.doc,.docx"
                          className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {['cnicFront', 'cnicBack'].map(docType => (
                        <div key={docType}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {docType === 'cnicFront' ? 'CNIC Front Side' : 'CNIC Back Side'}
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            {documents[docType] ? (
                              <div className="relative">
                                <img src={documentPreviews[docType]} alt={docType}
                                  className="mx-auto h-32 object-contain" />
                                <button type="button" onClick={() => removeDocument(docType)}
                                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <>
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-2 text-sm text-gray-500">Upload {docType === 'cnicFront' ? 'CNIC Front' : 'CNIC Back'}</p>
                              </>
                            )}
                            <input type="file" onChange={(e) => handleDocumentUpload(docType, e)} accept="image/*"
                              className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other Documents (Certificates, Experience Letters, etc.)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        {documents.otherDocuments.length > 0 ? (
                          <div className="space-y-3">
                            {documents.otherDocuments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center">
                                  <svg className="h-6 w-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                  </div>
                                </div>
                                <button type="button" onClick={() => removeDocument('otherDocuments', index)}
                                  className="text-red-600 hover:text-red-800">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-500">Upload Other Documents</p>
                          </div>
                        )}
                        <input type="file" onChange={(e) => handleDocumentUpload('otherDocuments', e)}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple
                          className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Picture */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Photo</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee Profile Picture</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {profilePreview ? (
                        <div className="relative inline-block">
                          <img src={profilePreview} alt="Profile preview"
                            className="mx-auto h-48 w-48 rounded-full object-cover" />
                          <button type="button"
                            onClick={() => {
                              setDocuments(prev => ({ ...prev, profilePicture: null }));
                              setProfilePreview('');
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">Upload profile photo</p>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/jpg"
                        className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Note:</span> Employee ID will be automatically generated by the system in format EMP001, EMP002, etc.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="space-y-4">
                    {[
                      { name: 'isActive', label: 'Active Account', desc: 'Employee will have immediate access to the system' },
                      { name: 'hasSystemAccess', label: 'Grant System Access', desc: 'Employee will receive login credentials' },
                    ].map(item => (
                      <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <input type="checkbox" name={item.name} checked={formData[item.name] || false} onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                          <div className="ml-3">
                            <label className="text-sm font-medium text-gray-900">{item.label}</label>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">All fields marked with * are required</p>
                  <p className="mt-1">Employee ID will be automatically generated by the system</p>
                </div>
                
                <div className="flex space-x-4">
                  <button type="button" onClick={handleCancel} disabled={loading || uploading}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading || uploading}
                    className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center min-w-[160px] justify-center">
                    {(loading || uploading) ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {uploading ? 'Uploading...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Employee
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">📋 HRM Employee Creation Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Required Documents', items: ['Profile Picture (Required)', 'CNIC (Front & Back)', 'CV/Resume', 'Educational Certificates', 'Experience Letters'] },
              { title: 'Salary Components', items: ['Basic Salary', 'Fuel Allowance', 'Medical Allowance', 'Special Allowance', 'Other Allowances'] },
              { title: 'System Access', items: ['Login credentials auto-generated', 'Email notification sent automatically', 'Password reset required on first login', 'Role-based access control'] },
            ].map(card => (
              <div key={card.title} className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-blue-800 mb-2">{card.title}</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {card.items.map(item => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-blue-200 flex items-start">
            <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-blue-800">
              <strong>Note:</strong> All employee data is encrypted and stored securely. HR personnel are responsible for verifying all documents before submission. Employee access will be granted only after HR approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;