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
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Compile templates
    this.compileTemplates();
  }

  private compileTemplates(): void {
    const templates = ['magic-link', 'invite', 'settlement-reminder'];

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

    return `<p>${JSON.stringify(context)}</p>`;
  }
}

export const emailService = new EmailService();
