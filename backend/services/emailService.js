const nodemailer = require('nodemailer');

// Create transporter with better Gmail configuration
const createTransporter = () => {
  // Check if email credentials are properly configured
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  console.log('📧 Email Configuration Check:');
  console.log('EMAIL_USER:', emailUser ? '✅ Set' : '❌ Not set');
  console.log('EMAIL_PASS:', emailPass ? '✅ Set' : '❌ Not set');
  
  // For development, use a test account or log the email instead
  if (!emailUser || !emailPass || 
      emailUser === 'your-email@gmail.com' || 
      emailPass === 'your-gmail-app-password' || 
      emailPass === 'REPLACE_WITH_YOUR_16_CHAR_APP_PASSWORD') {
    console.log('⚠️  Using development mode - emails will be logged instead of sent');
    console.log('📧 To enable real email sending, configure EMAIL_USER and EMAIL_PASS in your .env file');
    console.log('📧 Example: EMAIL_USER=your-email@gmail.com');
    console.log('📧 Example: EMAIL_PASS=your-16-char-app-password');
    return {
      sendMail: async (mailOptions) => {
        console.log('📧 DEVELOPMENT EMAIL LOG:');
        console.log('From:', mailOptions.from);
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('OTP Code:', mailOptions.html.match(/OTP Code: <strong>([^<]+)<\/strong>/)?.[1] || 'OTP not found');
        console.log('📧 END EMAIL LOG');
        console.log('💡 To receive real emails, set up Gmail App Password:');
        console.log('1. Go to your Google Account settings');
        console.log('2. Enable 2-factor authentication');
        console.log('3. Generate an App Password for "Mail"');
        console.log('4. Update your .env file with the App Password');
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }
  
  console.log('✅ Using production email mode with Gmail');
  return nodemailer.createTransporter({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Generate OTP
const generateOTP = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Send OTP email
const sendOTPEmail = async (email, otp, username) => {
  try {
    console.log('📧 Attempting to send OTP email to:', email);
    console.log('🔢 OTP Code:', otp);
    
    const transporter = createTransporter();
    
    // Use a safe fallback for the from address
    const fromEmail = process.env.EMAIL_USER || 'noreply@socialapp.com';
    
    const mailOptions = {
      from: `"SocialApp" <${fromEmail}>`,
      to: email,
      subject: 'Password Reset OTP - SocialApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Password Reset OTP</h2>
          <p>Hello ${username},</p>
          <p>You have requested to reset your password for your SocialApp account.</p>
          <p>Use the following OTP code to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 20px; 
                        border-radius: 10px; 
                        display: inline-block;
                        font-size: 24px;
                        font-weight: bold;
                        letter-spacing: 5px;">
              ${otp}
            </div>
          </div>
          
          <p><strong>OTP Code: <span style="color: #667eea; font-size: 18px;">${otp}</span></strong></p>
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email from SocialApp. Please do not reply to this email.
          </p>
        </div>
      `
    };

    console.log('📧 Email configuration:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  generateOTP
}; 