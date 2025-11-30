export interface IStorageService {
  uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder?: string,
  ): Promise<{ key: string; url: string }>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getFileUrl(key: string): Promise<string>;
}



