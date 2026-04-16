import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { SignupDto } from './dtos/signup.dto';
import { ConflictException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    signup: jest.fn(),
  };

  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should call usersService.signup and return the result', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890',
      };

      const expectedResult = {
        id: 'uuid',
        email: signupDto.email,
        name: signupDto.name,
        phone: signupDto.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.signup.mockResolvedValue(expectedResult);

      const result = await controller.signup(signupDto);

      expect(mockUsersService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException when service throws ConflictException', async () => {
      const signupDto: SignupDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890',
      };

      mockUsersService.signup.mockRejectedValue(
        new ConflictException('E-mail já registrado'),
      );

      await expect(controller.signup(signupDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const user = {
        id: 'uuid',
        email: 'test@example.com',
        name: 'Test User',
        phone: '1234567890',
      };

      const expectedResult = {
        access_token: 'jwt-token',
        user,
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const req = { user };
      const result = await controller.login(req);

      expect(mockAuthService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(expectedResult);
    });
  });
});
