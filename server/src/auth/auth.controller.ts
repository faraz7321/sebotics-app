import { Body, Controller, Post, Res, Inject, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponseDto, ForgotPasswordDto, ForgotPasswordResponseDto, ResetPasswordDto, ChangePasswordDto } from './auth.dto';
import { Response } from 'express';
import { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { JwtUser } from './auth.types';

const REGISTER_THROTTLE = {
  short: { limit: 2, ttl: 1000 },
  medium: { limit: 6, ttl: 10000 },
  long: { limit: 15, ttl: 60000 },
};

const LOGIN_THROTTLE = {
  short: { limit: 4, ttl: 1000 },
  medium: { limit: 12, ttl: 10000 },
  long: { limit: 30, ttl: 60000 },
};

const REFRESH_THROTTLE = {
  short: { limit: 8, ttl: 1000 },
  medium: { limit: 30, ttl: 10000 },
  long: { limit: 90, ttl: 60000 },
};

const PASSWORD_CHANGE_THROTTLE = {
  short: { limit: 2, ttl: 1000 },
  medium: { limit: 6, ttl: 10000 },
  long: { limit: 20, ttl: 60000 },
};

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject('REFRESH_TOKEN_OPTIONS') private readonly refreshOptions: any,
  ) { }

  private setRefreshCookieAndStrip(res: Response, result: any) {
    if (result && result.refreshToken) {
      const expiresIn = this.refreshOptions?.signOptions?.expiresIn || process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
      const maxAge = parseExpiryToMs(String(expiresIn));

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
      });

      const { refreshToken, ...bodyOnly } = result;
      return bodyOnly as AuthResponseDto;
    }

    return result as AuthResponseDto;
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @Throttle(REGISTER_THROTTLE)
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Username or email already in use' })
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      username: body.username,
      password: body.password,
    });
    return this.setRefreshCookieAndStrip(res, result);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login to existing account' })
  @ApiBody({ type: LoginDto })
  @Throttle(LOGIN_THROTTLE)
  @ApiOkResponse({
    description: 'Successfully logged in',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body.username, body.password);
    return this.setRefreshCookieAndStrip(res, result);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  @Throttle(REFRESH_THROTTLE)
  @ApiOkResponse({ description: 'New access token' })
  async refresh(@Req() req: Request) {
    const cookieHeader = String(req.headers.cookie || '');
    const refreshToken = parseCookie(cookieHeader, 'refreshToken');
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const token = await this.authService.refresh(refreshToken);
    return token;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password for the authenticated user' })
  @ApiBody({ type: ChangePasswordDto })
  @Throttle(PASSWORD_CHANGE_THROTTLE)
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiBadRequestResponse({ description: 'Current password is incorrect' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Body() body: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, body.currentPassword, body.newPassword);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset OTP via email' })
  @ApiBody({ type: ForgotPasswordDto })
  @Throttle(PASSWORD_CHANGE_THROTTLE)
  @ApiOkResponse({ description: 'OTP sent if email exists', type: ForgotPasswordResponseDto })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using OTP and reset token' })
  @ApiBody({ type: ResetPasswordDto })
  @Throttle(PASSWORD_CHANGE_THROTTLE)
  @ApiOkResponse({ description: 'Password reset successfully' })
  @ApiBadRequestResponse({ description: 'Invalid OTP, reset token, or expired request' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.email,
      body.otp,
      body.resetToken,
      body.newPassword,
    );
  }
}

function parseCookie(header: string, name: string) {
  if (!header) return null;
  const pairs = header.split(';').map(p => p.trim());
  for (const p of pairs) {
    if (!p) continue;
    const [k, ...rest] = p.split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function parseExpiryToMs(value: string) {
  const v = String(value).trim();
  const last = v.slice(-1).toLowerCase();
  const num = Number(v.slice(0, -1));

  if (!Number.isNaN(Number(v))) {
    return Number(v) * 1000;
  }

  if (last === 'd' && !Number.isNaN(num)) return num * 24 * 60 * 60 * 1000;
  if (last === 'h' && !Number.isNaN(num)) return num * 60 * 60 * 1000;
  if (last === 'm' && !Number.isNaN(num)) return num * 60 * 1000;
  if (last === 's' && !Number.isNaN(num)) return num * 1000;

  // fallback to 7 days
  return 7 * 24 * 60 * 60 * 1000;
}
