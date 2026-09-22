import * as bcrypt from 'bcrypt';

import { CreateUserDto, LoginUserDto } from '../dto/index.js';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service.js';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Test } from '@nestjs/testing';
import { User } from '../../user/entities/index.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { stubUser } from '../../user/entities/index.js';

const userStub = stubUser();
const signedToken = 'signed-jwt-token';

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockConfigService: Partial<ConfigService> = {
  get: jest.fn(),
};

describe('UserService', () => {
  let service: AuthService;
  let repository: Repository<User>;
  let configService: ConfigService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({}), ConfigModule.forRoot()],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    service = moduleRef.get<AuthService>(AuthService);
    configService = moduleRef.get<ConfigService>(ConfigService);
    jwtService = moduleRef.get<JwtService>(JwtService);
    repository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    let dto: CreateUserDto;
    const stubDto = stubUser();
    dto = Object.assign(new CreateUserDto(), stubDto);

    it('should throw ForbiddenException if email is already taken', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(userStub);

      await expect(service.signUp(dto)).rejects.toThrow(ForbiddenException);
    });

    it('should create a new user and return a JWT token', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      jest.spyOn(repository, 'create').mockReturnValue(userStub);
      jest.spyOn(repository, 'save').mockResolvedValue(userStub);

      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue(userStub.hash as unknown as never);

      jest.spyOn(service, 'signToken').mockResolvedValue({
        access_token: signedToken,
      });

      const result = await service.signUp(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual({ access_token: signedToken });
    });
  });

  describe('signIn', () => {
    let dto: LoginUserDto;
    const stubDto = stubUser();
    dto = Object.assign(new CreateUserDto(), stubDto);

    it('should throw ForbiddenException if user is not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.signIn(dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if password is incorrect', async () => {
      dto = Object.assign(new CreateUserDto(), dto, {
        password: 'wrongPassword',
      });
      jest.spyOn(repository, 'findOne').mockResolvedValue(userStub);
      jest
        .spyOn(bcrypt, 'compare')
        .mockResolvedValue(false as unknown as never);

      await expect(service.signIn(dto)).rejects.toThrow(ForbiddenException);
    });

    it('should return a JWT token when credentials are correct', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(userStub);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as unknown as never);

      jest.spyOn(service, 'signToken').mockResolvedValue({
        access_token: signedToken,
      });

      const result = await service.signIn(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, userStub.hash);
      expect(result).toEqual({ access_token: signedToken });
    });
  });

  describe('signToken', () => {
    //TODO solve this test
    // const jwtSecret = 'jwt-secret';
    // const expiry = '1h';
    // it('should return a signed JWT token', async () => {
    //   jest
    //     .spyOn(configService, 'get')
    //     .mockReturnValueOnce(jwtSecret)
    //     .mockReturnValueOnce(expiry);
    //   jest.spyOn(jwtService, 'signAsync').mockResolvedValue(signedToken);
    //   console.log(service);
    //   const result = await service.signToken(userStub.id, userStub.email);
    //   console.log(result);
    //   expect(result).toEqual({ access_token: signedToken });
    // });
  });
});
