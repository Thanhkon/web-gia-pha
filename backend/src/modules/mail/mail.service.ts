import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;

  constructor() {
    // Khởi tạo Resend nếu có API key
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  async sendPasswordResetEmail(to: string, token: string) {
    if (process.env.NODE_ENV !== 'production' || !this.resend) {
      this.logger.debug(
        `[DEV ONLY] Simulated email to ${to}. Password reset token: ${token}`,
      );
      return;
    }

    try {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
      await this.resend.emails.send({
        from: process.env.MAIL_FROM || 'onboarding@resend.dev',
        to,
        subject: 'Đặt lại mật khẩu Web Gia Phả',
        html: `<p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng bấm vào liên kết dưới đây:</p>
               <p><a href="${resetLink}">${resetLink}</a></p>
               <p>Liên kết này sẽ hết hạn trong 15 phút.</p>`,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
    }
  }
}
