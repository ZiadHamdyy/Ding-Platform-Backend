import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CreatePostDto } from './dtos/create_post.dto';
import { UpdatePostDto } from './dtos/update_post.dto';
import { CreateCommentDto } from './dtos/create_comment.dto';

describe('PostController', () => {
  let controller: PostController;
  let service: PostService;

  const mockPostService = {
    getAllPosts: jest.fn(),
    getPostById: jest.fn(),
    createPost: jest.fn(),
    updatePost: jest.fn(),
    toggleLike: jest.fn(),
    createComment: jest.fn(),
    deleteComment: jest.fn(),
    getComments: jest.fn(),
    getPostLikes: jest.fn(),
    deletePost: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: mockPostService,
        },
      ],
    }).compile();

    controller = module.get<PostController>(PostController);
    service = module.get<PostService>(PostService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllPosts', () => {
    it('should return an array of posts', async () => {
      const result = [{ id: '1', content: 'Test post' }];
      mockPostService.getAllPosts.mockResolvedValue(result);

      expect(await controller.getAllPosts('user1')).toBe(result);
      expect(service.getAllPosts).toHaveBeenCalledWith('user1');
    });
  });

  describe('getPostById', () => {
    it('should return a single post', async () => {
      const result = { id: '1', content: 'Test post' };
      mockPostService.getPostById.mockResolvedValue(result);

      expect(await controller.getPostById('1', 'user1')).toBe(result);
      expect(service.getPostById).toHaveBeenCalledWith('1', 'user1');
    });
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const dto: CreatePostDto = { content: 'New post', privacy: 'PUBLIC' };
      const files = { images: [] };
      const result = { id: '1', ...dto };
      mockPostService.createPost.mockResolvedValue(result);

      expect(await controller.createPost(files as any, dto, 'user1')).toBe(result);
      expect(service.createPost).toHaveBeenCalledWith({ ...dto, authorId: 'user1' }, files);
    });
  });

  describe('updatePost', () => {
    it('should update a post', async () => {
      const dto: UpdatePostDto = { content: 'Updated content' };
      const result = { id: '1', content: 'Updated content' };
      mockPostService.updatePost.mockResolvedValue(result);

      expect(await controller.updatePost('1', dto, 'user1')).toBe(result);
      expect(service.updatePost).toHaveBeenCalledWith('1', 'user1', dto);
    });
  });

  describe('toggleLike', () => {
    it('should toggle like on a post', async () => {
      const result = { liked: true };
      mockPostService.toggleLike.mockResolvedValue(result);

      expect(await controller.toggleLike('1', 'user1')).toBe(result);
      expect(service.toggleLike).toHaveBeenCalledWith('1', 'user1');
    });
  });

  describe('createComment', () => {
    it('should create a comment', async () => {
      const dto: CreateCommentDto = { content: 'Nice post' };
      const result = { id: 'c1', ...dto };
      mockPostService.createComment.mockResolvedValue(result);

      expect(await controller.createComment('1', 'user1', dto)).toBe(result);
      expect(service.createComment).toHaveBeenCalledWith('1', 'user1', dto);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const result = { success: true };
      mockPostService.deleteComment.mockResolvedValue(result);

      expect(await controller.deleteComment('c1', 'user1')).toBe(result);
      expect(service.deleteComment).toHaveBeenCalledWith('c1', 'user1');
    });
  });

  describe('getComments', () => {
    it('should return comments for a post', async () => {
      const result = { data: [], meta: {} };
      mockPostService.getComments.mockResolvedValue(result);

      expect(await controller.getComments('1', 1, 10)).toBe(result);
      expect(service.getComments).toHaveBeenCalledWith('1', 1, 10);
    });
  });

  describe('getPostLikes', () => {
    it('should return likes for a post', async () => {
      const result = { data: [], meta: {} };
      mockPostService.getPostLikes.mockResolvedValue(result);

      expect(await controller.getPostLikes('1', 1, 10)).toBe(result);
      expect(service.getPostLikes).toHaveBeenCalledWith('1', 1, 10);
    });
  });

  describe('deletePost', () => {
    it('should delete a post', async () => {
      const result = { message: 'Post deleted successfully' };
      mockPostService.deletePost.mockResolvedValue(result);

      expect(await controller.deletePost('1', 'user1')).toBe(result);
      expect(service.deletePost).toHaveBeenCalledWith('1', 'user1');
    });
  });
});
