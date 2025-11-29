import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Files')
@ApiBearerAuth('JWT-auth')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        ticketId: { type: 'string' },
        messageId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded' })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(image\/(jpeg|png|gif|webp)|application\/pdf|video\/(mp4|webm))/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('ticketId') ticketId?: string,
    @Body('messageId') messageId?: string,
  ) {
    return this.filesService.uploadFile(file, ticketId, messageId);
  }

  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files (max 10)' })
  @ApiResponse({ status: 201, description: 'Files uploaded' })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('ticketId') ticketId?: string,
    @Body('messageId') messageId?: string,
  ) {
    return this.filesService.uploadMultipleFiles(files, ticketId, messageId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attachment by ID' })
  @ApiResponse({ status: 200, description: 'Attachment details' })
  async getAttachment(@Param('id') id: string) {
    return this.filesService.getAttachment(id);
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Get all attachments for a ticket' })
  @ApiResponse({ status: 200, description: 'List of attachments' })
  async getTicketAttachments(@Param('ticketId') ticketId: string) {
    return this.filesService.getTicketAttachments(ticketId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete attachment' })
  @ApiResponse({ status: 200, description: 'Attachment deleted' })
  async deleteAttachment(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') userRoles: string[],
  ) {
    return this.filesService.deleteAttachment(id, userId, userRoles);
  }
}

