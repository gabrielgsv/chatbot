import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { SignupDto } from './dtos/signup.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890',
      };

      const hashedPassword = 'hashedPassword';
      const savedUser = {
        id: 'uuid',
        email: signupDto.email,
        password: hashedPassword,
        name: signupDto.name,
        phone: signupDto.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (mockedBcrypt.hash as any).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await service.signup(signupDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: signupDto.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: signupDto.email,
        password: hashedPassword,
        name: signupDto.name,
        phone: signupDto.phone,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(savedUser);
      expect(result).toEqual(savedUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      const signupDto: SignupDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890',
      };

      const existingUser = {
        id: 'uuid',
        email: signupDto.email,
        password: 'hashed',
        name: 'Existing User',
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.signup(signupDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: signupDto.email },
      });
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = {
        id: 'uuid',
        email,
        password: 'hashedPassword',
        name: 'Test User',
        phone: '1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (mockedBcrypt.compare as any).mockResolvedValue(true);

      const result = await service.login(email, password);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        user.password,
      );
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const email = 'notfound@example.com';
      const password = 'password123';

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const user = {
        id: 'uuid',
        email,
        password: 'hashedPassword',
        name: 'Test User',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (mockedBcrypt.compare as any).mockResolvedValue(false);

      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        user.password,
      );
    });
  });
});
