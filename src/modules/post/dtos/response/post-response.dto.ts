import { PostPrivacy } from '../create_post.dto';

export class PostResponseDto {
  id: string;
  content: string;
  mediaUrls: string[];
  privacy: PostPrivacy;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };

  mediaCount?: {
    images: number;
    videos: number;
  };
}
