export class CommentResponseDto {
  id: string;
  content: string;
  postId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };

  replyCount?: number;
  replies?: CommentResponseDto[];
}
