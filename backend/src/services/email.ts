import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { query } from '../db/index.js';
import logger from '../utils/logger.js';

interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
    secure: boolean;
}

/**
 * Read SMTP settings from platform_settings table
 */
async function getSmtpConfig(): Promise<SmtpConfig> {
    const { rows } = await query(
        `SELECT key, value FROM platform_settings WHERE key LIKE 'smtp_%'`
    );

    const configMap: Record<string, string> = {};
    for (const row of rows) {
        configMap[row.key] = row.value;
    }

    return {
        host: configMap.smtp_host || '',
        port: parseInt(configMap.smtp_port || '587', 10),
        user: configMap.smtp_user || '',
        pass: configMap.smtp_pass || '',
        fromEmail: configMap.smtp_from_email || '',
        fromName: configMap.smtp_from_name || 'Split-Ledger',
        secure: configMap.smtp_secure === 'true',
    };
}

/**
 * Create a nodemailer transporter from platform settings
 */
async function createTransporter(): Promise<Transporter> {
    const config = await getSmtpConfig();

    if (!config.host || !config.user || !config.pass) {
        throw new Error('SMTP is not configured. Set SMTP settings in the platform admin panel.');
    }

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });
}

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export const EmailService = {
    /**
     * Send an email using the platform SMTP settings
     */
    async sendEmail(options: SendEmailOptions): Promise<void> {
        const config = await getSmtpConfig();
        const transporter = await createTransporter();

        await transporter.sendMail({
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        logger.info({
            message: 'Email sent successfully',
            to: options.to,
            subject: options.subject,
        });
    },

    /**
     * Send a password reset email
     */
    async sendPasswordResetEmail(email: string, resetToken: string, frontendUrl: string): Promise<void> {
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        await this.sendEmail({
            to: email,
            subject: 'Reset Your Password - Split-Ledger',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Reset Your Password</h2>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: 600;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">Split-Ledger Platform</p>
        </div>
      `,
            text: `Reset your password by visiting: ${resetUrl}\n\nThis link expires in 1 hour.`,
        });
    },

    /**
     * Send a webhook dead letter notification
     */
    async sendWebhookDeadLetterNotification(
        adminEmail: string,
        webhookUrl: string,
        eventType: string,
        failureCount: number
    ): Promise<void> {
        await this.sendEmail({
            to: adminEmail,
            subject: `⚠️ Webhook Delivery Failed - ${eventType}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">Webhook Delivery Failed</h2>
          <p>A webhook has exhausted all retry attempts:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e5e5; font-weight: 600;">URL</td>
              <td style="padding: 8px; border: 1px solid #e5e5e5;">${webhookUrl}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e5e5; font-weight: 600;">Event</td>
              <td style="padding: 8px; border: 1px solid #e5e5e5;">${eventType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e5e5; font-weight: 600;">Attempts</td>
              <td style="padding: 8px; border: 1px solid #e5e5e5;">${failureCount}</td>
            </tr>
          </table>
          <p>Please check the webhook configuration and endpoint availability.</p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">Split-Ledger Platform</p>
        </div>
      `,
            text: `Webhook delivery failed for ${eventType} to ${webhookUrl} after ${failureCount} attempts.`,
        });
    },

    /**
     * Send a test email to verify SMTP configuration
     */
    async sendTestEmail(recipientEmail: string): Promise<{ success: boolean; error?: string }> {
        try {
            await this.sendEmail({
                to: recipientEmail,
                subject: '✅ SMTP Test - Split-Ledger',
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16A34A;">SMTP Configuration Working!</h2>
            <p>This is a test email from your Split-Ledger platform.</p>
            <p>Your SMTP settings are correctly configured.</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">Sent at ${new Date().toISOString()}</p>
          </div>
        `,
                text: 'SMTP test successful! Your Split-Ledger platform email is working.',
            });

            return { success: true };
        } catch (error: any) {
            logger.error({
                message: 'SMTP test failed',
                error: error.message,
                recipientEmail,
            });

            return {
                success: false,
                error: error.message || 'Unknown error sending test email',
            };
        }
    },
};
