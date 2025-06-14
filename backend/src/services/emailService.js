import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Support for multiple free email providers
      const emailConfig = this.getEmailConfig();

      this.transporter = nodemailer.createTransport(emailConfig);

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          logger.error('Email service initialization failed:', error);
        } else {
          logger.info('Email service initialized successfully');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  getEmailConfig() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      logger.warn('Email credentials not configured, using test account');
      return {
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      };
    }

    const configs = {
      gmail: {
        service: 'gmail',
        auth: { user, pass }
      },
      outlook: {
        service: 'hotmail',
        auth: { user, pass }
      },
      yahoo: {
        service: 'yahoo',
        auth: { user, pass }
      },
      custom: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass }
      }
    };

    return configs[emailProvider] || configs.custom;
  }

  // Email Templates
  getEmailTemplate(type, data) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const templates = {
      review_reminder: {
        subject: `Reminder: ${data.reviewType} Review Due Soon`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Performance Review Reminder</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Hi ${data.userName},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Your <strong>${data.reviewType}</strong> review is due on <strong>${data.dueDate}</strong>.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Please complete it as soon as possible to avoid any delays.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/reviews" 
                   style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Complete Review
                </a>
              </div>
              <p style="font-size: 14px; color: #888;">
                If you have any questions, please contact your HR team.
              </p>
            </div>
          </div>
        `
      },

      feedback_received: {
        subject: 'New Feedback Received',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">New Feedback</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Hi ${data.userName},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                You have received new feedback from <strong>${data.fromUserName}</strong>.
              </p>
              <div style="background: white; padding: 20px; border-left: 4px solid #11998e; margin: 20px 0;">
                <p style="font-style: italic; color: #666; margin: 0;">
                  "${data.feedbackPreview}"
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/feedback" 
                   style="background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Feedback
                </a>
              </div>
            </div>
          </div>
        `
      },

      cycle_created: {
        subject: `New Review Cycle: ${data.cycleName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">New Review Cycle</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Hi ${data.userName},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                A new review cycle "<strong>${data.cycleName}</strong>" has been created.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Start Date:</strong> ${data.startDate}</p>
                <p><strong>End Date:</strong> ${data.endDate}</p>
                <p><strong>Review Types:</strong> ${data.reviewTypes}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/reviews" 
                   style="background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Details
                </a>
              </div>
            </div>
          </div>
        `
      },

      deadline_approaching: {
        subject: `Urgent: Review Deadline Approaching`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">⚠️ Deadline Approaching</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Hi ${data.userName},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                <strong>Urgent:</strong> Your review deadline is approaching in <strong>${data.hoursLeft} hours</strong>.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Please complete your pending reviews immediately to avoid missing the deadline.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/reviews" 
                   style="background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Complete Now
                </a>
              </div>
            </div>
          </div>
        `
      }
    };

    return (
      templates[type] || {
        subject: 'Notification',
        html: `<p>${data.message}</p>`
      }
    );
  }

  async sendEmail(to, type, data) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const template = this.getEmailTemplate(type, data);

      const mailOptions = {
        from: `"PRP Platform" <${process.env.SMTP_USER || 'noreply@prp.com'}>`,
        to,
        subject: template.subject,
        html: template.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`, { messageId: result.messageId });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Specific email methods
  async sendReviewReminder(userEmail, userName, reviewType, dueDate) {
    return this.sendEmail(userEmail, 'review_reminder', {
      userName,
      reviewType,
      dueDate
    });
  }

  async sendFeedbackNotification(userEmail, userName, fromUserName, feedbackPreview) {
    return this.sendEmail(userEmail, 'feedback_received', {
      userName,
      fromUserName,
      feedbackPreview: feedbackPreview.substring(0, 100) + '...'
    });
  }

  async sendCycleNotification(userEmail, userName, cycleName, startDate, endDate, reviewTypes) {
    return this.sendEmail(userEmail, 'cycle_created', {
      userName,
      cycleName,
      startDate,
      endDate,
      reviewTypes
    });
  }

  async sendDeadlineAlert(userEmail, userName, hoursLeft) {
    return this.sendEmail(userEmail, 'deadline_approaching', {
      userName,
      hoursLeft
    });
  }

  // Test email functionality
  async sendTestEmail(to) {
    return this.sendEmail(to, 'review_reminder', {
      userName: 'Test User',
      reviewType: 'Self Review',
      dueDate: new Date().toLocaleDateString()
    });
  }
}

export default new EmailService();
