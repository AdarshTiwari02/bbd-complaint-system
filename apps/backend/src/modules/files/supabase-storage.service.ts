import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { IStorageService } from './storage.interface';

@Injectable()
export class SupabaseStorageService implements IStorageService {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Role Key must be configured');
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.bucket = this.configService.get('SUPABASE_STORAGE_BUCKET', 'bbd-complaints');
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'attachments',
  ): Promise<{ key: string; url: string }> {
    const ext = originalName.split('.').pop() || '';
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file to Supabase: ${error.message}`);
    }

    // Get public URL (or signed URL for private buckets)
    const { data: urlData } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(filePath);

    return {
      key: filePath,
      url: urlData.publicUrl,
    };
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(key, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async deleteFile(key: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([key]);

    if (error) {
      throw new Error(`Failed to delete file from Supabase: ${error.message}`);
    }
  }

  async getFileUrl(key: string): Promise<string> {
    const { data } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(key);

    return data.publicUrl;
  }
}

