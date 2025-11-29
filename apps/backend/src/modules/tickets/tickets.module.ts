import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketRoutingService } from './ticket-routing.service';
import { AiModule } from '../ai/ai.module';
import { FilesModule } from '../files/files.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AiModule, FilesModule, AuditModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketRoutingService],
  exports: [TicketsService, TicketRoutingService],
})
export class TicketsModule {}

