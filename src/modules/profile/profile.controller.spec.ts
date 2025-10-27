import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockProfileService = {
    getProfile: jest.fn(),
    createOrUpdateProfile: jest.fn(),
    uploadProfilePicture: jest.fn(),
    uploadCoverPhoto: jest.fn(),
    updatePrivacySettings: jest.fn(),
    searchProfiles: jest.fn(),
    deleteProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return a profile', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        bio: 'Test bio',
      };

      mockProfileService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile('user-1', {
        id: 'user-1',
      } as any);

      expect(result).toEqual(mockProfile);
      expect(service.getProfile).toHaveBeenCalledWith('user-1', 'user-1');
    });
  });

  describe('updateProfile', () => {
    it('should update profile', async () => {
      const updateData = { bio: 'Updated bio' };
      const mockUpdatedProfile = {
        id: 'profile-1',
        userId: 'user-1',
        ...updateData,
      };

      mockProfileService.createOrUpdateProfile.mockResolvedValue(
        mockUpdatedProfile,
      );

      const result = await controller.updateProfile(
        { id: 'user-1' } as any,
        updateData,
      );

      expect(result).toEqual(mockUpdatedProfile);
      expect(service.createOrUpdateProfile).toHaveBeenCalledWith(
        'user-1',
        updateData,
      );
    });
  });

  describe('uploadProfilePicture', () => {
    it('should upload profile picture', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const mockResult = { imageUrl: 'https://cloudinary.com/image.jpg' };

      mockProfileService.uploadProfilePicture.mockResolvedValue(mockResult);

      const result = await controller.uploadProfilePicture(
        { id: 'user-1' } as any,
        mockFile,
      );

      expect(result).toEqual(mockResult);
      expect(service.uploadProfilePicture).toHaveBeenCalledWith(
        'user-1',
        mockFile,
      );
    });
  });
});
