import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { DatabaseService } from '../../configs/database/database.service';
import { CloudinaryService } from '../../common/services/cloudinary/cloudinary.service';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';

describe('ProfileService', () => {
  let service: ProfileService;
  let prisma: DatabaseService;
  let cloudinary: CloudinaryService;

  const mockPrisma = {
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    profilePrivacy: {
      upsert: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  const mockCloudinary = {
    uploadProfilePicture: jest.fn(),
    uploadCoverPhoto: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: DatabaseService,
          useValue: mockPrisma,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinary,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prisma = module.get<DatabaseService>(DatabaseService);
    cloudinary = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return profile when found', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        bio: 'Test bio',
        privacySettings: {},
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          image: null,
        },
      };

      mockPrisma.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile('user-1', 'user-1');

      expect(result).toEqual(mockProfile);
      expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          privacySettings: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
    });

    it('should throw error when profile not found', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('user-1')).rejects.toThrow(
        GenericHttpException,
      );
    });
  });

  describe('createOrUpdateProfile', () => {
    it('should create new profile when not exists', async () => {
      const updateData = {
        bio: 'New bio',
        location: 'Cairo',
      };

      mockPrisma.profile.findUnique.mockResolvedValue(null);
      mockPrisma.profile.create.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        ...updateData,
      });

      const result = await service.createOrUpdateProfile('user-1', updateData);

      expect(result).toHaveProperty('id');
      expect(result.bio).toBe(updateData.bio);
      expect(mockPrisma.profile.create).toHaveBeenCalled();
    });

    it('should update existing profile', async () => {
      const existingProfile = {
        id: 'profile-1',
        userId: 'user-1',
        bio: 'Old bio',
      };

      const updateData = {
        bio: 'Updated bio',
      };

      mockPrisma.profile.findUnique.mockResolvedValue(existingProfile);
      mockPrisma.profile.update.mockResolvedValue({
        ...existingProfile,
        ...updateData,
      });

      const result = await service.createOrUpdateProfile('user-1', updateData);

      expect(result.bio).toBe(updateData.bio);
      expect(mockPrisma.profile.update).toHaveBeenCalled();
    });
  });

  describe('uploadProfilePicture', () => {
    it('should upload picture and update user', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const mockUrl = 'https://cloudinary.com/image.jpg';

      mockCloudinary.uploadProfilePicture.mockResolvedValue(mockUrl);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.uploadProfilePicture('user-1', mockFile);

      expect(result.imageUrl).toBe(mockUrl);
      expect(mockCloudinary.uploadProfilePicture).toHaveBeenCalledWith(
        mockFile,
        'user-1',
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { image: mockUrl },
      });
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update privacy settings', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
      };

      const privacyData = {
        profileVisibility: 'PUBLIC' as any,
        postsVisibility: 'FRIENDS' as any,
      };

      mockPrisma.profile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.profilePrivacy.upsert.mockResolvedValue({
        id: 'privacy-1',
        profileId: 'profile-1',
        ...privacyData,
      });

      const result = await service.updatePrivacySettings('user-1', privacyData);

      expect(result).toHaveProperty('profileVisibility', 'PUBLIC');
      expect(mockPrisma.profilePrivacy.upsert).toHaveBeenCalled();
    });

    it('should throw error when profile not found', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.updatePrivacySettings('user-1', {})).rejects.toThrow(
        GenericHttpException,
      );
    });
  });

  describe('searchProfiles', () => {
    it('should return paginated search results', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          userId: 'user-1',
          bio: 'Test bio',
          user: { id: 'user-1', name: 'John' },
          privacySettings: { profileVisibility: 'PUBLIC' },
        },
      ];

      mockPrisma.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrisma.profile.count.mockResolvedValue(1);

      const result = await service.searchProfiles({
        query: 'john',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toHaveProperty('total', 1);
      expect(result.meta).toHaveProperty('page', 1);
    });
  });
});
