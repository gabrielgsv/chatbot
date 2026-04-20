import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 'test-uuid',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    phone: '1234567890',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const expectedToken = 'jwt-token';
      const payload = { email: mockUser.email, sub: mockUser.id, role: mockUser.role };
      
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(payload);
      expect(result).toEqual({
        access_token: expectedToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          phone: mockUser.phone,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should include correct payload in JWT', async () => {
      const expectedToken = 'jwt-token';
      
      mockJwtService.sign.mockReturnValue(expectedToken);

      await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
    });

    it('should handle user with admin role', async () => {
      const adminUser: User = {
        ...mockUser,
        role: 'admin',
      };
      
      const expectedToken = 'admin-jwt-token';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(adminUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: adminUser.email,
        sub: adminUser.id,
        role: 'admin',
      });
      expect(result.user.role).toBe('admin');
    });

    it('should handle user without phone', async () => {
      const userWithoutPhone: User = {
        ...mockUser,
        phone: undefined,
      };
      
      const expectedToken = 'jwt-token';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(userWithoutPhone);

      expect(result.user.phone).toBeUndefined();
    });

    it('should handle user without name', async () => {
      const userWithoutName: User = {
        ...mockUser,
        name: undefined,
      };
      
      const expectedToken = 'jwt-token';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(userWithoutName);

      expect(result.user.name).toBeUndefined();
    });
  });
});
