// Script to handle account expirations and downgrades
// This script should be run daily via a cron job or scheduled task

const mongoose = require('mongoose');
const { User, Payment } = require('../lib/models');
const { sendEmail } = require('../lib/email');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Send expiration reminder email
const sendExpirationReminder = async (user, daysUntilExpiration) => {
  const subject = `Your Subscription Expires in ${daysUntilExpiration} Day${daysUntilExpiration !== 1 ? 's' : ''}`;
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #1f2937;">Subscription Expiration Notice</h2>
      <p>Hello ${user.name},</p>
      <p>Your subscription to the <strong>${user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1)}</strong> plan will expire in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}.</p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>What happens after expiration:</strong></p>
        <p style="margin: 8px 0 0 0;">Your account will be automatically downgraded to the Free tier, which includes:</p>
        <ul style="margin: 8px 0 0 20px;">
          <li>10 MB Storage</li>
          <li>Max 2 Projects</li>
          <li>300 Requests/Day</li>
        </ul>
      </div>
      
      <p>To continue enjoying your current plan benefits, please renew your subscription before it expires.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.BASE_URL}/upgrade" 
           style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Renew Subscription
        </a>
      </div>
      
      <p>If you have any questions or need assistance, please contact our support team.</p>
      <p>Thank you for using our service!</p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject,
      html,
    });
    console.log(`Sent expiration reminder to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send expiration reminder to ${user.email}:`, error);
  }
};

// Downgrade user account to free tier
const downgradeAccount = async (user) => {
  const previousAccountType = user.accountType;
  
  // Check if there's a queued next plan
  const recentPayment = await Payment.findOne({ 
    user: user._id, 
    status: 'captured' 
  }).sort({ createdAt: -1 });
  
  if (recentPayment && recentPayment.nextPlan) {
    // Upgrade to the queued plan instead of downgrading to free
    user.accountType = recentPayment.nextPlan;
    console.log(`Upgrading ${user.email} from ${previousAccountType} to ${recentPayment.nextPlan} (queued plan)`);
  } else {
    // Downgrade to free tier
    user.accountType = 'free';
    console.log(`Downgrading ${user.email} from ${previousAccountType} to free`);
  }
  
  user.updatedAt = new Date();
  await user.save();
  
  // Send downgrade confirmation email
  const subject = 'Account Downgraded to Free Tier';
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #1f2937;">Account Downgraded</h2>
      <p>Hello ${user.name},</p>
      <p>Your subscription to the <strong>${previousAccountType.charAt(0).toUpperCase() + previousAccountType.slice(1)}</strong> plan has expired, and your account has been downgraded to the Free tier.</p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Free Tier Benefits:</strong></p>
        <ul style="margin: 8px 0 0 20px;">
          <li>10 MB Storage</li>
          <li>Max 2 Projects</li>
          <li>300 Requests/Day</li>
        </ul>
      </div>
      
      <p>You can upgrade to a premium plan at any time to restore your previous benefits and unlock additional features.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.BASE_URL}/upgrade" 
           style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Upgrade Now
        </a>
      </div>
      
      <p>If you believe this downgrade was made in error, please contact our support team immediately.</p>
      <p>Thank you for using our service!</p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject,
      html,
    });
    console.log(`Sent downgrade confirmation to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send downgrade confirmation to ${user.email}:`, error);
  }
};

// Process account expirations
const processExpirations = async () => {
  try {
    await connectDB();
    
    const now = new Date();
    
    // Find payments that expire in 3 days (send reminder)
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const paymentsExpiringInThreeDays = await Payment.find({
      expiresAt: { $gte: now, $lte: threeDaysFromNow },
      status: 'captured'
    }).populate('user');
    
    // Send 3-day reminders
    for (const payment of paymentsExpiringInThreeDays) {
      if (payment.user) {
        const daysUntilExpiration = Math.ceil((payment.expiresAt - now) / (24 * 60 * 60 * 1000));
        await sendExpirationReminder(payment.user, daysUntilExpiration);
      }
    }
    
    // Find payments that expire in 1 day (send reminder)
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    
    const paymentsExpiringInOneDay = await Payment.find({
      expiresAt: { $gte: now, $lte: oneDayFromNow },
      status: 'captured'
    }).populate('user');
    
    // Send 1-day reminders
    for (const payment of paymentsExpiringInOneDay) {
      if (payment.user) {
        const daysUntilExpiration = Math.ceil((payment.expiresAt - now) / (24 * 60 * 60 * 1000));
        await sendExpirationReminder(payment.user, daysUntilExpiration);
      }
    }
    
    // Find expired payments and downgrade accounts
    const expiredPayments = await Payment.find({
      expiresAt: { $lt: now },
      status: 'captured'
    }).populate('user');
    
    // Downgrade accounts
    for (const payment of expiredPayments) {
      if (payment.user) {
        await downgradeAccount(payment.user);
      }
    }
    
    console.log(`Processed ${expiredPayments.length} expired accounts`);
    
    // Close the connection
    await mongoose.connection.close();
    
    process.exit(0);
  } catch (error) {
    console.error('Error processing account expirations:', error);
    process.exit(1);
  }
};

// Run the expiration processing
processExpirations();