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

  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
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
}
