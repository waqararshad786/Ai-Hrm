const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  console.log('📧 Sending email to:', options.to);
  console.log('📧 Subject:', options.subject);
  
  try {
    // Get email credentials from environment (support both formats)
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const emailHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const emailPort = process.env.SMTP_PORT || 587;
    
    // Check if email is configured
    if (!emailUser || !emailPass) {
      console.warn('⚠️ Email credentials not configured in .env file');
      console.log('💡 Email would be sent to:', options.to);
      console.log('💡 Email subject:', options.subject);
      console.log('📧 Credentials needed: SMTP_USER/EMAIL_USER and SMTP_PASS/EMAIL_PASS');
      
      // Log email content for debugging
      console.log('📧 Email content preview:', options.html?.substring(0, 300));
      
      return { 
        success: false, 
        error: 'Email service not configured',
        mock: true,
        details: {
          to: options.to,
          subject: options.subject
        }
      };
    }

    console.log('📧 Email credentials found, attempting to send...');
    
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: false, // true for 465, false for 587
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'HRM System'}" <${emailUser}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments || [] // Add attachments support
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully! Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Email error:', error.message);
    console.log('💡 Email content (for manual sending):');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Body preview:', options.html?.substring(0, 200));
    
    return { success: false, error: error.message };
  }
};

// New function specifically for salary slip emails
const sendSalarySlipEmail = async (employee, payroll, payslipBuffer) => {
  const monthYear = `${payroll.month} ${payroll.year}`;
  const formattedSalary = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0
  }).format(payroll.netSalary || 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f7fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 12px 12px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 10px 0 0;
          opacity: 0.9;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 0 0 12px 12px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .salary-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
          border: 1px solid #bbf7d0;
        }
        .salary-amount {
          font-size: 32px;
          font-weight: bold;
          color: #059669;
          margin: 10px 0;
        }
        .salary-label {
          font-size: 14px;
          color: #047857;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .details-table {
          width: 100%;
          margin: 20px 0;
          border-collapse: collapse;
        }
        .details-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        .details-table td:first-child {
          font-weight: 600;
          color: #4b5563;
          width: 40%;
        }
        .details-table td:last-child {
          color: #1f2937;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #dcfce7;
          color: #059669;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #059669;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
        }
        .note {
          background: #fef3c7;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 13px;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏦 Salary Slip</h1>
          <p>Payment Processed Successfully</p>
        </div>
        <div class="content">
          <div class="greeting">
            Dear <strong>${employee.name || employee.fullName || 'Employee'}</strong>,
          </div>
          
          <p>Your salary for the month of <strong>${monthYear}</strong> has been processed and credited to your bank account.</p>
          
          <div class="salary-card">
            <div class="salary-label">Net Salary Credited</div>
            <div class="salary-amount">${formattedSalary}</div>
            <div class="status-badge">✓ Payment Completed</div>
          </div>
          
          <table class="details-table">
            <tr>
              <td>Employee ID</td>
              <td><strong>${employee.employeeId || 'N/A'}</strong></td>
            </tr>
            <tr>
              <td>Department</td>
              <td>${employee.department || 'N/A'}</td>
            </tr>
            <tr>
              <td>Position</td>
              <td>${employee.position || 'N/A'}</td>
            </tr>
            <tr>
              <td>Payment Period</td>
              <td>${monthYear}</td>
            </tr>
            <tr>
              <td>Payment Date</td>
              <td>${new Date().toLocaleDateString('en-PK')}</td>
            </tr>
            <tr>
              <td>Transaction ID</td>
              <td><strong>${payroll.transactionId || 'N/A'}</strong></td>
            </tr>
            <tr>
              <td>Payment Method</td>
              <td>${payroll.paymentMethod || 'Bank Transfer'}</td>
            </tr>
          </table>
          
          <div class="note">
            📎 <strong>Attached:</strong> Please find your detailed salary slip (PDF) attached to this email.
            This document contains complete breakdown of earnings and deductions.
          </div>
          
          <div class="note" style="background: #e0e7ff; color: #3730a3;">
            💡 <strong>Need Help?</strong><br>
            If you have any questions about your salary or deductions, please contact the HR department at 
            <a href="mailto:hr@company.com" style="color: #3730a3;">hr@company.com</a>
          </div>
          
          <div class="footer">
            <p>This is an automatically generated email. Please do not reply directly to this message.</p>
            <p>&copy; ${new Date().getFullYear()} HR Payroll System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: employee.email,
    subject: `💰 Salary Slip - ${monthYear} (Payment Processed)`,
    html: htmlContent,
    attachments: [
      {
        filename: `Salary_Slip_${employee.employeeId || employee._id}_${payroll.month}_${payroll.year}.pdf`,
        content: payslipBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
};

module.exports = { sendEmail, sendSalarySlipEmail };