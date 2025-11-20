import nodemailer, { Transporter } from 'nodemailer';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export class EmailService {
  private transporter: Transporter;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const host = process.env.SMTP_HOST || 'smtpout.secureserver.net';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465 (SSL), false for 587 (STARTTLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // network/timeouts
      connectionTimeout: 10_000, // 10s
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
      tls: {
        // only set to false temporarily for debugging TLS cert issues
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
      },
    });

    // Verify connection immediately and log clearly
    this.transporter.verify()
      .then(() => {
        logger.info(`✅ SMTP: connected to ${host}:${port} (secure=${port === 465})`);
      })
      .catch((err) => {
        // helpful, actionable log
        logger.error(`❌ SMTP verify failed: host=${host} port=${port} user=${process.env.SMTP_USER}`);
        logger.error(err);
        logger.warn('⚠️  Email functionality will not work. Check your SMTP configuration.');
        // don't throw here: you might want the app to start even if email is down.
        // If you do want to crash, uncomment:
        // throw err;
      });

    // Compile templates
    this.compileTemplates();
  }

  private compileTemplates(): void {
    const templates = ['magic-link', 'invite', 'settlement-reminder', 'welcome'];

    templates.forEach((templateName) => {
      try {
        const templatePath = join(__dirname, `../templates/${templateName}.hbs`);
        const templateSource = readFileSync(templatePath, 'utf-8');
        this.templates.set(templateName, handlebars.compile(templateSource));
      } catch (error) {
        logger.warn(`Template ${templateName} not found, using fallback`);
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const template = this.templates.get(options.template);
      const html = template
        ? template(options.context)
        : this.getFallbackTemplate(options.template, options.context);

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'TableSplit <noreply@tablesplit.app>',
        to: options.to,
        subject: options.subject,
        html,
      });

      logger.info(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendMagicLink(email: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const magicLink = `${frontendUrl}/auth/verify/${token}`;

    await this.sendEmail({
      to: email,
      subject: 'Your TableSplit Magic Link',
      template: 'magic-link',
      context: {
        magicLink,
        expiryMinutes: 15,
      },
    });
  }

  async sendGroupInvite(
    email: string,
    inviterName: string,
    groupName: string,
    inviteToken: string
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const joinLink = `${frontendUrl}/groups/join/${inviteToken}`;

    await this.sendEmail({
      to: email,
      subject: `You're invited to join "${groupName}" on TableSplit`,
      template: 'invite',
      context: {
        inviterName,
        groupName,
        joinLink,
      },
    });
  }

  async sendSettlementReminder(
    email: string,
    userName: string,
    amount: number,
    currency: string,
    payeeName: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Reminder: Settle your TableSplit balance',
      template: 'settlement-reminder',
      context: {
        userName,
        amount,
        currency,
        payeeName,
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await this.sendEmail({
      to: email,
      subject: 'Welcome to TableSplit! 🎉',
      template: 'welcome',
      context: {
        name,
        frontendUrl,
        dashboardUrl: `${frontendUrl}/groups`,
      },
    });
  }

  async sendPlatformInvite(email: string, inviterName: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const signupUrl = `${frontendUrl}/auth/signup`;

    await this.sendEmail({
      to: email,
      subject: `${inviterName} invited you to join TableSplit!`,
      template: 'platform-invite',
      context: {
        inviterName,
        signupUrl,
        frontendUrl,
      },
    });
  }

  private getFallbackTemplate(templateName: string, context: Record<string, any>): string {
    // Fallback HTML templates
    if (templateName === 'magic-link') {
      return `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #ffd700, #daa520); border-radius: 50%; margin-bottom: 20px;"></div>
            <h1 style="color: #1a4d2e; margin: 0;">TableSplit</h1>
          </div>
          <h2 style="color: #333;">Your Magic Link is Ready! 🎰</h2>
          <p>Click the button below to log in to TableSplit. This link expires in ${context.expiryMinutes} minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.magicLink}" style="display: inline-block; padding: 12px 24px; background: #ffd700; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold;">Log In to TableSplit</a>
          </div>
          <p style="color: #666; font-size: 12px;">If you didn't request this link, you can safely ignore this email.</p>
        </body>
        </html>
      `;
    }

    if (templateName === 'invite') {
      return `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #ffd700, #daa520); border-radius: 50%; margin-bottom: 20px;"></div>
            <h1 style="color: #1a4d2e; margin: 0;">TableSplit</h1>
          </div>
          <h2 style="color: #333;">${context.inviterName} invited you! 🎲</h2>
          <p>You've been invited to join <strong>"${context.groupName}"</strong> on TableSplit.</p>
          <p>Pull up a seat at the table and start tracking shared expenses together.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.joinLink}" style="display: inline-block; padding: 12px 24px; background: #ffd700; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold;">Join the Table</a>
          </div>
        </body>
        </html>
      `;
    }

    if (templateName === 'welcome') {
      return `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #1a4d2e); border-radius: 50%; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px;">🎰</span>
              </div>
              <h1 style="color: #1a4d2e; margin: 0; font-size: 28px;">Welcome to TableSplit!</h1>
            </div>

            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hi ${context.name}! 👋</p>

            <p style="color: #666; line-height: 1.6;">
              Thanks for joining TableSplit! We're excited to help you track and split expenses with friends, roommates, or colleagues.
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
              <h3 style="color: #1a4d2e; margin-top: 0;">Getting Started:</h3>
              <ul style="color: #666; line-height: 1.8; margin: 0;">
                <li>Create or join a group</li>
                <li>Add expenses and split them fairly</li>
                <li>Track who owes what in real-time</li>
                <li>Settle up easily with UPI, cash, or bank transfer</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${context.dashboardUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981, #1a4d2e); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Go to Dashboard</a>
            </div>

            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              Need help? Just reply to this email and we'll get back to you.<br>
              Happy splitting! 🎉
            </p>
          </div>
        </body>
        </html>
      `;
    }

    if (templateName === 'platform-invite') {
      return `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #ffd700, #daa520); border-radius: 50%; margin-bottom: 20px;">
                <span style="font-size: 36px; line-height: 80px;">🎲</span>
              </div>
              <h1 style="color: #1a4d2e; margin: 0; font-size: 28px;">You're Invited to TableSplit!</h1>
            </div>

            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
              <strong>${context.inviterName}</strong> wants to add you as a friend on TableSplit! 🎉
            </p>

            <p style="color: #666; line-height: 1.6;">
              TableSplit makes it easy to track and split expenses with friends, roommates, or colleagues.
              Join ${context.inviterName} and start managing shared expenses together!
            </p>

            <div style="background-color: #fffbeb; border-left: 4px solid #ffd700; padding: 20px; margin: 30px 0; border-radius: 4px;">
              <h3 style="color: #1a4d2e; margin-top: 0;">With TableSplit you can:</h3>
              <ul style="color: #666; line-height: 1.8; margin: 0;">
                <li>Track shared expenses in real-time</li>
                <li>Split bills fairly with friends</li>
                <li>See who owes what at a glance</li>
                <li>Settle up easily with UPI, cash, or bank transfer</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${context.signupUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ffd700, #daa520); color: #000; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Join TableSplit Now</a>
            </div>

            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              Once you sign up, you can connect with ${context.inviterName} and start splitting expenses!<br>
              See you at the table! 🎰
            </p>
          </div>
        </body>
        </html>
      `;
    }

    return `<p>${JSON.stringify(context)}</p>`;
  }
}

export const emailService = new EmailService();
