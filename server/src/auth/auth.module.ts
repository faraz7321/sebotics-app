import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { MailerModule } from '../mailer/mailer.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    MailerModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1d') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'REFRESH_TOKEN_OPTIONS',
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('REFRESH_TOKEN_SECRET') ||
          'refresh-secret-change-in-production',
        signOptions: {
          expiresIn: (configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') || '7d') as any,
        },
      }),
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, 'REFRESH_TOKEN_OPTIONS'],
})
export class AuthModule {}
