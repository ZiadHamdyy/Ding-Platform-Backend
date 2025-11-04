import { Expose } from 'class-transformer';

export class UploadResponse {
  @Expose()
  imageUrl?: string;

  @Expose()
  coverPhotoUrl?: string;
}
