import { Test, TestingModule } from '@nestjs/testing';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedResponseDto } from './dtos/response/feed.response';

describe('FeedController', () => {
  let controller: FeedController;
  let service: FeedService;

  const mockFeedService = {
    getFeed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [
        {
          provide: FeedService,
          useValue: mockFeedService,
        },
      ],
    }).compile();

    controller = module.get<FeedController>(FeedController);
    service = module.get<FeedService>(FeedService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFeed', () => {
    it('should return a paginated feed', async () => {
      const result = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
      mockFeedService.getFeed.mockResolvedValue(result);

      const user = { id: 'user1' };
      expect(await controller.getFeed(user, '1', '20')).toBe(result);
      expect(service.getFeed).toHaveBeenCalledWith('user1', 1, 20);
    });

    it('should use default pagination values', async () => {
      const result = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
      mockFeedService.getFeed.mockResolvedValue(result);

      const user = { id: 'user1' };
      expect(await controller.getFeed(user, undefined, undefined)).toBe(result);
      expect(service.getFeed).toHaveBeenCalledWith('user1', 1, 20);
    });
  });
});
