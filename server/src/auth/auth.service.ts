import { BadRequestException, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject('REFRESH_TOKEN_OPTIONS') private readonly refreshOptions: any,
  ) {}

  async register(username: string, password: string) {
    const existing = await this.usersService.findByUsername(username);
    if (existing) {
      throw new BadRequestException('Username already in use');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.usersService.createClient(username, passwordHash);

    return this.issueToken(user.id, user.username, user.role);
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

  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken(user.id, user.username, user.role);
  }

  private issueToken(userId: string, username: string, role: Role) {
    const payload = { sub: userId, username, role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = jwt.sign(payload, this.refreshOptions.secret, this.refreshOptions.signOptions);

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        username,
        role,
      },
    };
  }
}
