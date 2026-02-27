export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: {
    name?: string;
    address?: string;
  };
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface PasswordResetMailData {
  userName: string;
  resetToken: string;
  resetLink: string;
  expiresAt: Date;
}

export interface PasswordResetOTPMailData {
  userEmail: string;
  userName: string;
  otp: string;
  expiresAt: Date;
}
