import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class AppCodeGuard implements CanActivate {
  private readonly appCode: string;

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.get<string>('ELEVATOR_APP_CODE')
      ?? this.configService.get<string>('AUTOXING_APP_CODE')
      ?? '';
    // Strip "APPCODE " prefix if the env value includes it
    this.appCode = raw.replace(/^APPCODE\s+/i, '');
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.appCode) {
      throw new UnauthorizedException('ELEVATOR_APP_CODE is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization ?? '';
    const match = authHeader.match(/^APPCODE\s+(.+)$/i);

    if (!match || match[1] !== this.appCode) {
      throw new UnauthorizedException('Invalid or missing APPCODE');
    }

    return true;
  }
}
