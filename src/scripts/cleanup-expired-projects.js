// Script to clean up expired projects based on account types
// This script should be run periodically (e.g., daily) via a cron job or scheduled task

const mongoose = require('mongoose');
const { ApiProject, User } = require('../lib/models');
const { sendProjectExpirationReminder, sendProjectDeletionConfirmation } = require('../lib/email');

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

// Send expiration reminders for projects expiring soon
const sendExpirationReminders = async () => {
  try {
    const now = new Date();
    
    // Find projects expiring in 1 week (7 days)
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const projectsExpiringInOneWeek = await ApiProject.find({
      expiresAt: { $gt: now, $lte: oneWeekFromNow },
      lastWeekReminderSent: { $ne: true }
    }).populate('user');
    
    // Find projects expiring in 1 day
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const projectsExpiringInOneDay = await ApiProject.find({
      expiresAt: { $gt: now, $lte: oneDayFromNow },
      lastDayReminderSent: { $ne: true }
    }).populate('user');
    
    // Send 1 week reminders
    for (const project of projectsExpiringInOneWeek) {
      if (project.user && project.user.email) {
        const daysUntilDeletion = Math.ceil((project.expiresAt - now) / (24 * 60 * 60 * 1000));
        await sendProjectExpirationReminder(project.user.email, project.name, daysUntilDeletion);
        // Mark reminder as sent
        await ApiProject.findByIdAndUpdate(project._id, { lastWeekReminderSent: true });
        console.log(`Sent 1-week reminder for project: ${project.name}`);
      }
    }
    
    // Send 1 day reminders
    for (const project of projectsExpiringInOneDay) {
      if (project.user && project.user.email) {
        const daysUntilDeletion = Math.ceil((project.expiresAt - now) / (24 * 60 * 60 * 1000));
        await sendProjectExpirationReminder(project.user.email, project.name, daysUntilDeletion);
        // Mark reminder as sent
        await ApiProject.findByIdAndUpdate(project._id, { lastDayReminderSent: true });
        console.log(`Sent 1-day reminder for project: ${project.name}`);
      }
    }
  } catch (error) {
    console.error('Error sending expiration reminders:', error);
  }
};

// Clean up expired projects
const cleanupExpiredProjects = async () => {
  try {
    await connectDB();
    
    // Send reminders for projects expiring soon
    await sendExpirationReminders();
    
    // Find and delete expired projects
    const now = new Date();
    const expiredProjects = await ApiProject.find({
      expiresAt: { $lt: now, $ne: null }
    }).populate('user');
    
    // Send deletion confirmation emails before deleting
    for (const project of expiredProjects) {
      if (project.user && project.user.email) {
        await sendProjectDeletionConfirmation(project.user.email, project.name);
        console.log(`Sent deletion confirmation for project: ${project.name}`);
      }
    }
    
    // Delete expired projects
    const result = await ApiProject.deleteMany({
      expiresAt: { $lt: now, $ne: null }
    });
    
    console.log(`Deleted ${result.deletedCount} expired projects`);
    
    // Close the connection
    await mongoose.connection.close();
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up expired projects:', error);
    process.exit(1);
  }
};

// Run the cleanup
cleanupExpiredProjects();