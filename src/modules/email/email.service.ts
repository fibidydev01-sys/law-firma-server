// ============================================================================
// FILE: server/src/modules/email/email.service.ts (ESLINT FIXED)
// Email Service - Send notifications, invitations, password resets
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface SendInvitationEmailData {
  to: string;
  nama_lengkap: string | null;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

export interface SendPasswordResetEmailData {
  to: string;
  nama_lengkap: string | null;
  temporaryPassword: string;
  loginUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send invitation email to new user
   */
  async sendInvitationEmail(
    data: SendInvitationEmailData,
  ): Promise<{ success: boolean }> {
    try {
      this.logger.log(`📧 Sending invitation email to: ${data.to}`);

      await this.mailerService.sendMail({
        to: data.to,
        subject: '🎉 Welcome to Law Firm Management System',
        template: './invitation', // references templates/invitation.hbs
        context: {
          nama_lengkap: data.nama_lengkap || 'User',
          email: data.email,
          temporaryPassword: data.temporaryPassword,
          loginUrl: data.loginUrl,
          currentYear: new Date().getFullYear(),
        },
      });

      this.logger.log(`✅ Invitation email sent successfully to: ${data.to}`);
      return { success: true };
    } catch (error) {
      // ✅ FIX: Properly type error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Failed to send invitation email: ${errorMessage}`);
      return { success: false };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    data: SendPasswordResetEmailData,
  ): Promise<{ success: boolean }> {
    try {
      this.logger.log(`📧 Sending password reset email to: ${data.to}`);

      await this.mailerService.sendMail({
        to: data.to,
        subject: '🔑 Your Password Has Been Reset',
        template: './password-reset', // references templates/password-reset.hbs
        context: {
          nama_lengkap: data.nama_lengkap || 'User',
          temporaryPassword: data.temporaryPassword,
          loginUrl: data.loginUrl,
          currentYear: new Date().getFullYear(),
        },
      });

      this.logger.log(
        `✅ Password reset email sent successfully to: ${data.to}`,
      );
      return { success: true };
    } catch (error) {
      // ✅ FIX: Properly type error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send password reset email: ${errorMessage}`,
      );
      return { success: false };
    }
  }

  /**
   * Send bulk operation notification
   */
  async sendBulkOperationNotification(
    to: string[],
    subject: string,
    message: string,
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of to) {
      try {
        await this.mailerService.sendMail({
          to: email,
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Law Firm Management System</h2>
              <p>${message}</p>
              <hr>
              <p style="color: #666; font-size: 12px;">
                This is an automated notification from Law Firm Management System.
              </p>
            </div>
          `,
        });
        sent++;
      } catch (error) {
        // ✅ FIX: Properly type error
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to send to ${email}: ${errorMessage}`);
        failed++;
      }
    }

    return { success: failed === 0, sent, failed };
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const testEmail = this.configService.get<string>('email.user');

      if (!testEmail) {
        return {
          success: false,
          message: 'Email configuration not found',
        };
      }

      await this.mailerService.sendMail({
        to: testEmail,
        subject: 'Test Email - Law Firm System',
        text: 'This is a test email. If you receive this, email service is working correctly.',
      });

      return {
        success: true,
        message: 'Test email sent successfully',
      };
    } catch (error) {
      // ✅ FIX: Properly type error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Email test failed: ${errorMessage}`,
      };
    }
  }
}
