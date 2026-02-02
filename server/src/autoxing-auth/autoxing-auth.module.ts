import { Module } from '@nestjs/common';
import { AutoxingAuthService } from './autoxing-auth.service';

@Module({
  providers: [AutoxingAuthService],
  exports: [AutoxingAuthService],
})
export class AutoxingAuthModule {}
