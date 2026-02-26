import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { Transporter } from "nodemailer";
import {
    SendMailOptions,
    PasswordResetMailData,
    PasswordResetOTPMailData,
} from "./mailer.types";

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly fromName: string;
    private readonly fromAddress: string;
    private readonly transporter: Transporter | null;

    constructor(private readonly configService: ConfigService) {
        this.fromName =
            this.configService.get<string>("MAIL_FROM_NAME") || "Sebotics";
        this.fromAddress =
            this.configService.get<string>("MAIL_FROM_ADDRESS") ||
            "noreply@sebotics.com";

        const smtpHost = this.configService.get<string>("MAIL_SMTP_HOST");

        if (smtpHost) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: this.configService.get<number>("MAIL_SMTP_PORT") ?? 587,
                secure: this.configService.get<string>("MAIL_SMTP_SECURE") === "true",
                auth: {
                    user: this.configService.get<string>("MAIL_SMTP_USER"),
                    pass: this.configService.get<string>("MAIL_SMTP_PASS"),
                },
            });
            this.logger.log(`Mail service initialized with SMTP (host: ${smtpHost})`);
        } else {
            this.transporter = null;
            this.logger.warn(
                `Mail service initialized in console-log mode (MAIL_SMTP_HOST not set)`,
            );
        }
    }

    /**
     * Send an email via SMTP if configured, otherwise print to console (dev mode).
     */
    async sendMail(options: SendMailOptions): Promise<boolean> {
        try {
            const from = options.from ?? {
                name: this.fromName,
                address: this.fromAddress,
            };

            if (this.transporter) {
                await this.transporter.sendMail({
                    from: `${from.name} <${from.address}>`,
                    to: options.to,
                    cc: options.cc,
                    bcc: options.bcc,
                    subject: options.subject,
                    text: options.text,
                    html: options.html,
                    attachments: options.attachments,
                });

                this.logger.log(
                    `Email sent via SMTP → ${Array.isArray(options.to) ? options.to.join(", ") : options.to} | Subject: ${options.subject}`,
                );
                return true;
            }

            // ── Console (dev) fallback ───────────────────────────────────────
            this.logger.log("\n" + "=".repeat(80));
            this.logger.log("📧 EMAIL NOTIFICATION (console mode)");
            this.logger.log("=".repeat(80));
            this.logger.log(`From:    ${from.name} <${from.address}>`);
            this.logger.log(
                `To:      ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`,
            );
            if (options.cc) {
                this.logger.log(
                    `CC:      ${Array.isArray(options.cc) ? options.cc.join(", ") : options.cc}`,
                );
            }
            if (options.bcc) {
                this.logger.log(
                    `BCC:     ${Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc}`,
                );
            }
            this.logger.log(`Subject: ${options.subject}`);
            this.logger.log("-".repeat(80));

            if (options.html) {
                const textContent = options.html
                    .replace(/<[^>]*>/g, "")
                    .replace(/&nbsp;/g, " ")
                    .replace(/&amp;/g, "&")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/\n{3,}/g, "\n\n")
                    .trim();
                this.logger.log(textContent);
            } else if (options.text) {
                this.logger.log(options.text);
            }

            this.logger.log("=".repeat(80) + "\n");
            return true;
        } catch (error) {
            this.logger.error("Failed to send email", error);
            return false;
        }
    }


    /**
     * Send password reset email
     */
    async sendPasswordReset(data: PasswordResetMailData): Promise<boolean> {
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #EF4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .warning { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>We received a request to reset your password. Click the button below to proceed:</p>
              <p style="text-align: center;">
                <a href="${data.resetLink}" class="button">Reset Password</a>
              </p>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">${data.resetLink}</p>
              
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>This link will expire on ${data.expiresAt.toLocaleDateString()} at ${data.expiresAt.toLocaleTimeString()}.</p>
                <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Sebotics. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

        const text = `
Password Reset Request

Hi ${data.userName},

We received a request to reset your password. Visit this link to proceed:
${data.resetLink}

This link will expire on ${data.expiresAt.toLocaleDateString()} at ${data.expiresAt.toLocaleTimeString()}.

If you did not request a password reset, please ignore this email and your password will remain unchanged.
    `;

        return this.sendMail({
            to: data.userName, // This should be email, might need to adjust the interface
            subject: "Password Reset Request",
            html,
            text,
        });
    }

    /**
     * Send password reset OTP email
     */
    async sendPasswordResetOTP(data: PasswordResetOTPMailData): Promise<boolean> {
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .otp-box { background: white; border: 2px solid #EF4444; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #EF4444; font-family: 'Courier New', monospace; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .warning { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset OTP</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to complete the process:</p>
              
              <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your OTP Code</p>
                <div class="otp-code">${data.otp}</div>
              </div>
              
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>This OTP will expire on ${data.expiresAt.toLocaleDateString()} at ${data.expiresAt.toLocaleTimeString()}.</li>
                  <li>Do not share this OTP with anyone.</li>
                  <li>If you did not request a password reset, please ignore this email.</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Sebotics. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

        const text = `
Password Reset OTP

Hi ${data.userName},

We received a request to reset your password. Please use the following One-Time Password (OTP) to complete the process:

OTP: ${data.otp}

This OTP will expire on ${data.expiresAt.toLocaleDateString()} at ${data.expiresAt.toLocaleTimeString()}.

Security Notice:
- Do not share this OTP with anyone.
- If you did not request a password reset, please ignore this email.

---
© ${new Date().getFullYear()} Sebotics. All rights reserved.
    `;

        return this.sendMail({
            to: data.userEmail,
            subject: "Password Reset OTP - Sebotics",
            html,
            text,
        });
    }
}
