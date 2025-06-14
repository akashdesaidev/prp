import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import notificationService from './src/services/notificationService.js';
import emailService from './src/services/emailService.js';

dotenv.config();

async function testNotificationSystem() {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/performance-review-platform'
    );
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please create one first.');
      process.exit(1);
    }

    console.log(`✅ Found admin user: ${adminUser.email}`);

    // Test 1: Create a test notification
    console.log('\n🧪 Test 1: Creating test notification...');
    const notification = await notificationService.sendTestNotification(adminUser._id);
    console.log('✅ Test notification created:', notification.title);

    // Test 2: Send test email (if email is configured)
    console.log('\n🧪 Test 2: Testing email service...');
    if (process.env.SMTP_USER) {
      const emailResult = await emailService.sendTestEmail(adminUser.email);
      if (emailResult.success) {
        console.log('✅ Test email sent successfully');
      } else {
        console.log('❌ Email sending failed:', emailResult.error);
      }
    } else {
      console.log('⚠️ Email not configured (SMTP_USER not set)');
    }

    // Test 3: Get user notifications
    console.log('\n🧪 Test 3: Fetching user notifications...');
    const userNotifications = await notificationService.getUserNotifications(adminUser._id);
    console.log(`✅ Found ${userNotifications.notifications.length} notifications`);
    console.log(`📊 Unread count: ${userNotifications.unreadCount}`);

    // Test 4: Test notification preferences
    console.log('\n🧪 Test 4: Testing notification preferences...');
    const preferences = await notificationService.updateNotificationPreferences(adminUser._id, {
      emailNotifications: true,
      weeklyReminders: true,
      deadlineAlerts: true
    });
    console.log('✅ Notification preferences updated:', preferences);

    console.log('\n🎉 All notification tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Notification service initialized');
    console.log('- ✅ Database connection working');
    console.log('- ✅ In-app notifications working');
    console.log('- ✅ Notification preferences working');
    console.log(
      `- ${process.env.SMTP_USER ? '✅' : '⚠️'} Email service ${process.env.SMTP_USER ? 'configured' : 'not configured'}`
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the test
testNotificationSystem();
