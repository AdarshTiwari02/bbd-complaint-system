import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { VerificationService } from './verification.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, VerificationService],
  exports: [UsersService, VerificationService],
})
export class UsersModule {}

