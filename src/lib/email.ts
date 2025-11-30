import nodemailer from 'nodemailer';

// Create transporter (you can configure this for your email provider)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.BASE_URL}/auth/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #1f2937;">Password Reset Request</h2>
      <p>You requested a password reset for your Todo App account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - Todo App',
    html,
  });
};

export const sendProjectExpirationReminder = async (
  email: string, 
  projectName: string, 
  daysUntilDeletion: number
) => {
  const subject = daysUntilDeletion <= 0 
    ? `Your Project "${projectName}" Has Been Deleted` 
    : `Your Project "${projectName}" Will Be Deleted in ${daysUntilDeletion} Day${daysUntilDeletion !== 1 ? 's' : ''}`;
  
  const actionText = daysUntilDeletion <= 0 
    ? 'has been permanently deleted from our system' 
    : `will be automatically deleted in ${daysUntilDeletion} day${daysUntilDeletion !== 1 ? 's' : ''}`;
  
  const suggestionText = daysUntilDeletion <= 0 
    ? 'If you need to recreate this project, you can do so at any time.' 
    : 'If you wish to keep this project, please upgrade your account to prevent automatic deletion.';
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #1f2937;">Project Expiration Notice</h2>
      <p>Your mock server project <strong>"${projectName}"</strong> ${actionText}.</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>What you can do:</strong></p>
        <p style="margin: 8px 0 0 0;">${suggestionText}</p>
      </div>
      <p>If you have any questions or need assistance, please contact our support team.</p>
      <p>Thank you for using our service!</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
};

export const sendProjectDeletionConfirmation = async (
  email: string, 
  projectName: string
) => {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #1f2937;">Project Deletion Confirmation</h2>
      <p>Your mock server project <strong>"${projectName}"</strong> has been successfully deleted from our system.</p>
      <p>This deletion was either automatic based on your account type expiration policy or manually initiated by you.</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Need to recreate this project?</strong></p>
        <p style="margin: 8px 0 0 0;">You can create a new project with the same configuration at any time through our platform.</p>
      </div>
      <p>If you believe this deletion was made in error, please contact our support team immediately.</p>
      <p>Thank you for using our service!</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Project "${projectName}" Deletion Confirmation`,
    html,
  });
};

export const sendProjectCreationConfirmation = async (
  email: string,
  projectName: string,
  accountType: string,
  expiresAt: Date | null
) => {
  // Format expiration information based on account type
  let expirationInfo = '';
  if (expiresAt) {
    const formattedDate = expiresAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    switch (accountType) {
      case 'free':
        expirationInfo = `This project will be automatically deleted on ${formattedDate} (2 weeks from creation).`;
        break;
      case 'freemium':
        expirationInfo = `This project will be automatically deleted on ${formattedDate} (2 months from creation).`;
        break;
      case 'pro':
        expirationInfo = `This project will be automatically deleted on ${formattedDate} (1 year from creation).`;
        break;
      default:
        expirationInfo = `This project will be automatically deleted on ${formattedDate}.`;
    }
  } else {
    expirationInfo = 'This project will not be automatically deleted as part of your Ultra-Pro account benefits.';
  }
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #1f2937;">Project Created Successfully</h2>
      <p>Congratulations! Your mock server project <strong>"${projectName}"</strong> has been created successfully.</p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Project Details:</strong></p>
        <p style="margin: 8px 0 0 0;">Name: ${projectName}</p>
        <p style="margin: 4px 0 0 0;">Account Type: ${accountType.charAt(0).toUpperCase() + accountType.slice(1)}</p>
        <p style="margin: 4px 0 0 0;">${expirationInfo}</p>
      </div>
      
      <p>You can now start configuring your endpoints and testing your APIs.</p>
      
      ${expiresAt ? `
      <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;"><strong>Important Reminder:</strong></p>
        <p style="margin: 8px 0 0 0;">To prevent automatic deletion, consider upgrading your account. You'll receive email notifications before your project is scheduled for deletion.</p>
      </div>
      ` : ''}
      
      <p>If you have any questions or need assistance, please contact our support team.</p>
      <p>Thank you for using our service!</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Project "${projectName}" Created Successfully`,
    html,
  });
};

// New email functions for limit notifications
export const sendStorageLimitNotification = async (
  email: string,
  accountType: string,
  storageUsed: number,
  storageLimit: number
) => {
  // Convert bytes to MB for display
  const usedMB = Math.round(storageUsed / (1024 * 1024));
  const limitMB = Math.round(storageLimit / (1024 * 1024));
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #1f2937;">Storage Limit Reached</h2>
      <p>Your storage usage has reached the limit for your ${accountType} account.</p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Current Usage:</strong></p>
        <p style="margin: 8px 0 0 0;">${usedMB} MB / ${limitMB} MB (${Math.round((storageUsed / storageLimit) * 100)}%)</p>
      </div>
      
      <p>As a result, your account is now in read-only mode. You can still access your existing data, but cannot store new data until you free up space or upgrade your account.</p>
      
      <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;"><strong>Upgrade Options:</strong></p>
        <p style="margin: 8px 0 0 0;">
          Upgrade to a higher plan to increase your storage limit:
          <ul>
            <li>Freemium: 200 MB</li>
            <li>Pro: 1 GB</li>
            <li>Ultra-Pro: 5 GB</li>
          </ul>
        </p>
      </div>
      
      <p>To free up space, you can delete unused projects or data. To increase your storage limit, consider upgrading your account.</p>
      
      <p>If you have any questions or need assistance, please contact our support team.</p>
      <p>Thank you for using our service!</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Storage Limit Reached - ${accountType} Account`,
    html,
  });
};

export const sendRequestLimitNotification = async (
  email: string,
  accountType: string,
  requestsUsed: number,
  requestsLimit: number,
  renewalTime: Date
) => {
  // Format renewal time
  const renewalDate = renewalTime.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #1f2937;">Daily Request Limit Exceeded</h2>
      <p>Your daily request limit has been reached for your ${accountType} account.</p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Current Usage:</strong></p>
        <p style="margin: 8px 0 0 0;">${requestsUsed} / ${requestsLimit} requests</p>
      </div>
      
      <p>Your request limit will automatically renew on:</p>
      <div style="background-color: #dbeafe; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; text-align: center; font-weight: bold; color: #1e40af;">${renewalDate}</p>
      </div>
      
      <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;"><strong>Upgrade Options:</strong></p>
        <p style="margin: 8px 0 0 0;">
          Upgrade to a higher plan to increase your request limit:
          <ul>
            <li>Freemium: 3,000 requests/day</li>
            <li>Pro: 20,000 requests/day</li>
            <li>Ultra-Pro: 200,000 requests/day</li>
          </ul>
        </p>
      </div>
      
      <p>Until your limit renews, you won't be able to make additional API requests. Consider upgrading your account for higher request limits.</p>
      
      <p>If you have any questions or need assistance, please contact our support team.</p>
      <p>Thank you for using our service!</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Daily Request Limit Exceeded - ${accountType} Account`,
    html,
  });
};