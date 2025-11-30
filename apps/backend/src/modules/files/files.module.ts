import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { S3Service } from './s3.service';
import { SupabaseStorageService } from './supabase-storage.service';

@Module({
  controllers: [FilesController],
  providers: [
    FilesService,
    {
      provide: 'STORAGE_SERVICE',
      useFactory: (configService: ConfigService) => {
        const storageType = configService.get('STORAGE_TYPE', 's3');
        if (storageType === 'supabase') {
          return new SupabaseStorageService(configService);
        }
        return new S3Service(configService);
      },
      inject: [ConfigService],
    },
    S3Service,
    // SupabaseStorageService is only instantiated in the factory above when needed
    // Don't add it to providers to avoid instantiation when using S3
  ],
  exports: [FilesService],
})
export class FilesModule {}

