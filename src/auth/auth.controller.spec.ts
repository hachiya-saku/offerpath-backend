import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should forward registration data to AuthService', async () => {
    const dto = {
      email: 'test@example.com',
      displayName: 'Saku',
      password: 'password123',
    };
    const createdUser = {
      id: 'user-1',
      email: dto.email,
      displayName: dto.displayName,
    };

    authServiceMock.register.mockResolvedValue(createdUser);

    const result = await controller.register(dto);

    expect(authServiceMock.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual(createdUser);
  });

  it('should forward login data to AuthService', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const loginResult = {
      accessToken: 'access-token',
      user: { id: 'user-1', email: dto.email, displayName: 'Saku' },
    };
    authServiceMock.login.mockResolvedValue(loginResult);

    const result = await controller.login(dto);

    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(loginResult);
  });
});
