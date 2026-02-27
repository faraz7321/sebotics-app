import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mailer.service';

@Module({
  imports: [ConfigModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailerModule {}
