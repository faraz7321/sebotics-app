import { Body, Controller, Post, Res, Inject, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './auth.dto';
import { Response } from 'express';
import { Request } from 'express';

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
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Username already in use' })
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(body.username, body.password);
    return this.setRefreshCookieAndStrip(res, result);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login to existing account' })
  @ApiBody({ type: LoginDto })
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
