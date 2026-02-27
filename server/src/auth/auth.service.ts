import { BadRequestException, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { MailService } from '../mailer/mailer.service';

interface PasswordResetEntry {
  userId: string;
  email: string;
  otp: string;
  expiresAt: Date;
}

const passwordResetStorage = new Map<string, PasswordResetEntry>();

// Clean up expired tokens every 5 minutes
setInterval(
  () => {
    const now = new Date();
    for (const [token, data] of passwordResetStorage.entries()) {
      if (data.expiresAt < now) {
        passwordResetStorage.delete(token);
      }
    }
  },
  5 * 60 * 1000,
);

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject('REFRESH_TOKEN_OPTIONS') private readonly refreshOptions: any,
    @Inject(MailService) private readonly mailService: MailService,
  ) {}

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
  }) {
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const username = data.username.trim();
    const email = data.email.trim().toLowerCase();

    if (!firstName || !lastName) {
      throw new BadRequestException('First name and last name are required');
    }

    const existing = await this.usersService.findByUsername(username);
    if (existing) {
      throw new BadRequestException('Username already in use');
    }

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.usersService.createClient({
      firstName,
      lastName,
      email,
      username,
      passwordHash,
    });

    return this.issueToken(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, this.refreshOptions.secret) as any;

      const user = await this.usersService.findById?.(payload.sub) ?? null;
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = this.jwtService.sign({ sub: user.id, username: user.username, role: user.role });

      return { accessToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async login(usernameOrEmail: string, password: string) {
    const loginId = usernameOrEmail.trim();
    const isEmail = loginId.includes('@');
    const user = isEmail
      ? await this.usersService.findByEmail(loginId.toLowerCase())
      : await this.usersService.findByUsername(loginId);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken(user);
  }

  private issueToken(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    role: Role;
  }) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = jwt.sign(payload, this.refreshOptions.secret, this.refreshOptions.signOptions);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(userId, passwordHash);

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string): Promise<{ resetToken: string; message: string }> {
    const user = await this.usersService.findByEmail(email.trim().toLowerCase());

    const resetToken = crypto.randomBytes(32).toString('hex');

    // Always return success to avoid user enumeration (with a random reset token)
    if (!user) {
      return { resetToken: resetToken, message: 'If this email exists, an OTP has been sent to it' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store in memory (in production, use Redis or database)
    passwordResetStorage.set(resetToken, {
      userId: user.id,
      email: user.email,
      otp,
      expiresAt,
    });

    await this.mailService.sendPasswordResetOTP({
      userEmail: user.email,
      userName: user.firstName,
      otp,
      expiresAt,
    });

    return { resetToken, message: 'If this email exists, an OTP has been sent to it' };
  }

  async resetPassword(
    email: string,
    otp: string,
    resetToken: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const entry = passwordResetStorage.get(resetToken);

    if (!entry) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (entry.email.toLowerCase() !== email.trim().toLowerCase()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (entry.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > entry.expiresAt) {
      passwordResetStorage.delete(resetToken);
      throw new BadRequestException('OTP has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(entry.userId, passwordHash);

    passwordResetStorage.delete(resetToken);

    return { message: 'Password has been reset successfully' };
  }
}
