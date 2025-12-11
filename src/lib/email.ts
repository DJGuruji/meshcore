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
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error };
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.BASE_URL}/auth/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); border: 1px solid #334155;">
        <!-- Header -->
        <div style="padding: 30px; text-align: center; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #ea580c 100%); position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #ea580c 100%); opacity: 0.8;"></div>
          <h1 style="position: relative; color: white; margin: 0; font-size: 28px; font-weight: 700;">AnyTimeRequest</h1>
          <p style="position: relative; color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 16px;">Password Reset Request</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            Hello,
          </p>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            We received a request to reset your password for your AnyTimeRequest account. If you didn't make this request, you can safely ignore this email.
          </p>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
            Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #ea580c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);">
              Reset Password
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 30px 0 0;">
            Or copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #60a5fa; font-size: 14px; text-align: center; margin: 10px 0 0;">
            ${resetUrl}
          </p>
          
          <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 20px 0 0;">
            This link will expire in 1 hour.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px 30px; background-color: #1e293b; border-top: 1px solid #334155; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            © ${new Date().getFullYear()} AnyTimeRequest. All rights reserved.
          </p>
          <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">
            This email was sent to ${email}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - AnyTimeRequest',
    html,
  });
};

export const sendProjectCreationConfirmation = async (
  email: string,
  projectName: string,
  accountType: string
) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Project Created Successfully</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); border: 1px solid #334155;">
        <!-- Header -->
        <div style="padding: 30px; text-align: center; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #ea580c 100%); position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #ea580c 100%); opacity: 0.8;"></div>
          <h1 style="position: relative; color: white; margin: 0; font-size: 28px; font-weight: 700;">AnyTimeRequest</h1>
          <p style="position: relative; color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 16px;">Project Created Successfully</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            Congratulations! Your mock server project <strong style="color: white;">"${projectName}"</strong> has been created successfully.
          </p>
          
          <div style="background: rgba(30, 41, 59, 0.7); padding: 20px; border-radius: 12px; margin: 30px 0; border: 1px solid #334155; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
            <p style="color: #e2e8f0; margin: 0 0 12px; font-weight: 600; font-size: 16px;">Project Details:</p>
            <p style="color: #cbd5e1; margin: 8px 0; font-size: 15px;">
              <span style="color: #94a3b8;">Name:</span> 
              <span style="color: white; font-weight: 500;">${projectName}</span>
            </p>
            <p style="color: #cbd5e1; margin: 8px 0; font-size: 15px;">
              <span style="color: #94a3b8;">Account Type:</span> 
              <span style="color: white; font-weight: 500;">${accountType.charAt(0).toUpperCase() + accountType.slice(1)}</span>
            </p>
          </div>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            You can now start configuring your endpoints and testing your APIs.
          </p>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
            If you have any questions or need assistance, please contact our support team.
          </p>
          
          <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 0; font-weight: 500;">
            Thank you for using AnyTimeRequest!
          </p>
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px 30px; background-color: #1e293b; border-top: 1px solid #334155; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            © ${new Date().getFullYear()} AnyTimeRequest. All rights reserved.
          </p>
          <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">
            This email was sent to ${email}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Project "${projectName}" Created Successfully - AnyTimeRequest`,
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
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Storage Limit Reached</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); border: 1px solid #334155;">
        <!-- Header -->
        <div style="padding: 30px; text-align: center; background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%); position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%); opacity: 0.8;"></div>
          <h1 style="position: relative; color: white; margin: 0; font-size: 28px; font-weight: 700;">AnyTimeRequest</h1>
          <p style="position: relative; color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 16px;">Storage Limit Reached</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            Your storage usage has reached the limit for your <strong style="color: white;">${accountType}</strong> account.
          </p>
          
          <div style="background: rgba(30, 41, 59, 0.7); padding: 20px; border-radius: 12px; margin: 30px 0; border: 1px solid #334155; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
            <p style="color: #e2e8f0; margin: 0 0 12px; font-weight: 600; font-size: 16px;">Current Usage:</p>
            <p style="color: #cbd5e1; margin: 8px 0; font-size: 15px;">
              <span style="color: #94a3b8;">Storage:</span> 
              <span style="color: white; font-weight: 500;">${usedMB} MB / ${limitMB} MB (${Math.round((storageUsed / storageLimit) * 100)}%)</span>
            </p>
          </div>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
            As a result, your account is now in read-only mode. You can still access your existing data, but cannot store new data until you free up space or upgrade your account.
          </p>
          
          <div style="background: rgba(255, 251, 235, 0.1); padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">
            <p style="color: #fde68a; margin: 0 0 12px; font-weight: 600; font-size: 16px;">Upgrade Options:</p>
            <p style="color: #fef3c7; margin: 8px 0; font-size: 15px; line-height: 1.6;">
              Upgrade to a higher plan to increase your storage limit:
            </p>
            <ul style="color: #fef3c7; margin: 15px 0 0 20px; padding: 0; font-size: 15px;">
              <li style="margin-bottom: 8px;">plus: 200 MB</li>
              <li style="margin-bottom: 8px;">Pro: 1 GB</li>
              <li style="margin-bottom: 0;">Ultra-Pro: 5 GB</li>
            </ul>
          </div>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
            To free up space, you can delete unused projects or data. To increase your storage limit, consider upgrading your account.
          </p>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 0;">
            If you have any questions or need assistance, please contact our support team.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px 30px; background-color: #1e293b; border-top: 1px solid #334155; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            © ${new Date().getFullYear()} AnyTimeRequest. All rights reserved.
          </p>
          <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">
            This email was sent to ${email}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Storage Limit Reached - ${accountType} Account - AnyTimeRequest`,
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
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Request Limit Exceeded</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); border: 1px solid #334155;">
        <!-- Header -->
        <div style="padding: 30px; text-align: center; background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%); position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%); opacity: 0.8;"></div>
          <h1 style="position: relative; color: white; margin: 0; font-size: 28px; font-weight: 700;">AnyTimeRequest</h1>
          <p style="position: relative; color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 16px;">Daily Request Limit Exceeded</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            Your daily request limit has been reached for your <strong style="color: white;">${accountType}</strong> account.
          </p>
          
          <div style="background: rgba(30, 41, 59, 0.7); padding: 20px; border-radius: 12px; margin: 30px 0; border: 1px solid #334155; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
            <p style="color: #e2e8f0; margin: 0 0 12px; font-weight: 600; font-size: 16px;">Current Usage:</p>
            <p style="color: #cbd5e1; margin: 8px 0; font-size: 15px;">
              <span style="color: #94a3b8;">Requests:</span> 
              <span style="color: white; font-weight: 500;">${requestsUsed} / ${requestsLimit} requests</span>
            </p>
          </div>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            Your request limit will automatically renew on:
          </p>
          
          <div style="background: rgba(219, 234, 254, 0.1); padding: 20px; border-radius: 12px; margin: 20px 0 30px; text-align: center; border: 1px solid rgba(96, 165, 250, 0.3);">
            <p style="color: #bfdbfe; margin: 0; font-weight: 600; font-size: 18px;">
              ${renewalDate}
            </p>
          </div>
          
          <div style="background: rgba(255, 251, 235, 0.1); padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">
            <p style="color: #fde68a; margin: 0 0 12px; font-weight: 600; font-size: 16px;">Upgrade Options:</p>
            <p style="color: #fef3c7; margin: 8px 0; font-size: 15px; line-height: 1.6;">
              Upgrade to a higher plan to increase your request limit:
            </p>
            <ul style="color: #fef3c7; margin: 15px 0 0 20px; padding: 0; font-size: 15px;">
              <li style="margin-bottom: 8px;">plus: 3,000 requests/day</li>
              <li style="margin-bottom: 8px;">Pro: 20,000 requests/day</li>
              <li style="margin-bottom: 0;">Ultra-Pro: 200,000 requests/day</li>
            </ul>
          </div>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
            Until your limit renews, you won't be able to make additional API requests. Consider upgrading your account for higher request limits.
          </p>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 0;">
            If you have any questions or need assistance, please contact our support team.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px 30px; background-color: #1e293b; border-top: 1px solid #334155; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            © ${new Date().getFullYear()} AnyTimeRequest. All rights reserved.
          </p>
          <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">
            This email was sent to ${email}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Daily Request Limit Exceeded - ${accountType} Account - AnyTimeRequest`,
    html,
  });
};

export const sendPaymentConfirmation = async (
  email: string,
  name: string,
  planName: string,
  amount: number,
  paymentId: string,
  orderId: string
) => {
  // Format amount in INR
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount / 100); // Convert paise to rupees
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); border: 1px solid #334155;">
        <!-- Header -->
        <div style="padding: 30px; text-align: center; background: linear-gradient(90deg, #10b981 0%, #059669 100%); position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, #10b981 0%, #059669 100%); opacity: 0.8;"></div>
          <h1 style="position: relative; color: white; margin: 0; font-size: 28px; font-weight: 700;">AnyTimeRequest</h1>
          <p style="position: relative; color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 16px;">Payment Successful!</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            Dear <strong style="color: white;">${name}</strong>,
          </p>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
            Thank you for upgrading to the <strong style="color: white;">${planName}</strong> plan. Your payment has been successfully processed.
          </p>
          
          <div style="background: rgba(30, 41, 59, 0.7); padding: 20px; border-radius: 12px; margin: 30px 0; border: 1px solid #334155; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
            <p style="color: #e2e8f0; margin: 0 0 12px; font-weight: 600; font-size: 16px;">Payment Details:</p>
            <p style="color: #cbd5e1; margin: 8px 0; font-size: 15px;">
              <span style="color: #94a3b8;">Amount:</span> 
              <span style="color: white; font-weight: 500;">${formattedAmount}</span>
            </p>
            <p style="color: #cbd5e1; margin: 8px 0; font-size: 15px;">
              <span style="color: #94a3b8;">Payment ID:</span> 
              <span style="color: white; font-weight: 500;">${paymentId}</span>
            </p>
            <p style="color: #cbd5e1; margin: 8px 0; font-size: 15px;">
              <span style="color: #94a3b8;">Order ID:</span> 
              <span style="color: white; font-weight: 500;">${orderId}</span>
            </p>
            <p style="color: #cbd5e1; margin: 8px 0 0; font-size: 15px;">
              <span style="color: #94a3b8;">Plan:</span> 
              <span style="color: white; font-weight: 500;">${planName}</span>
            </p>
          </div>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
            Your account has been upgraded and you can now enjoy all the benefits of the ${planName} plan.
          </p>
          
          <div style="background: rgba(219, 234, 254, 0.1); padding: 20px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(96, 165, 250, 0.3);">
            <p style="color: #bfdbfe; margin: 0 0 12px; font-weight: 600; font-size: 16px;">Next Steps:</p>
            <p style="color: #dbeafe; margin: 8px 0; font-size: 15px; line-height: 1.6;">
              • Explore your new features in the dashboard<br>
              • Create more projects and endpoints<br>
              • Enjoy increased storage and request limits
            </p>
          </div>
          
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 0;">
            If you have any questions or need assistance, please contact our support team.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px 30px; background-color: #1e293b; border-top: 1px solid #334155; text-align: center;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            © ${new Date().getFullYear()} AnyTimeRequest. All rights reserved.
          </p>
          <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">
            This email was sent to ${email}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Payment Confirmation - ${planName} Plan - AnyTimeRequest`,
    html,
  });
};