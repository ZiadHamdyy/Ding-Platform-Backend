import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { HelperService } from '../../common/utils/helper/helper.service';
import { DatabaseService } from '../../configs/database/database.service';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../session/session.service';
import { EmailService } from '../../common/services/email.service';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let prisma: DatabaseService;
  let helperService: HelperService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    emailVerified: true,
    active: true,
    image: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            errorIfUserExists: jest.fn(),
          },
        },
        {
          provide: DatabaseService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
            otp: {
              create: jest.fn(),
              findFirst: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            session: {
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: HelperService,
          useValue: {
            hashPassword: jest.fn().mockResolvedValue('hashed-password'),
            comparePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('jwt-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'session-id' }),
            findByRefreshToken: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmailVerificationOtp: jest.fn(),
            sendOtpEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    prisma = module.get<DatabaseService>(DatabaseService);
    helperService = module.get<HelperService>(HelperService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        image: '',
      };

      jest.spyOn(userService, 'errorIfUserExists').mockResolvedValue(undefined);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);
      jest.spyOn(prisma.otp, 'create').mockResolvedValue({} as any);

      const result = await service.signup(signupData);

      expect(result).toEqual(mockUser);
      expect(userService.errorIfUserExists).toHaveBeenCalledWith(
        signupData.email,
      );
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const signupData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        image: '',
      };

      jest
        .spyOn(userService, 'errorIfUserExists')
        .mockRejectedValue(
          new GenericHttpException('User already exists', 409),
        );

      await expect(service.signup(signupData)).rejects.toThrow(
        GenericHttpException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(helperService, 'comparePassword').mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(GenericHttpException);
    });

    it('should throw error if password is incorrect', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(helperService, 'comparePassword').mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(GenericHttpException);
    });

    it('should throw error if user is inactive', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        active: false,
      });

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow(GenericHttpException);
    });
  });

  describe('login', () => {
    it('should throw error if email is not verified', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false };

      await expect(
        service.login(unverifiedUser, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(GenericHttpException);
    });
  });

  describe('forgotPassword', () => {
    it('should send OTP email if user exists', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.otp, 'deleteMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prisma.otp, 'create').mockResolvedValue({} as any);

      const result = await service.forgotPassword({
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(prisma.otp.create).toHaveBeenCalled();
    });

    it('should return success even if user not found (security)', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'nonexistent@example.com',
      });

      expect(result.success).toBe(true);
    });
  });
});
