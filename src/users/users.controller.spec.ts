import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersServiceMock = {
    findProfile: jest.fn(),
    updateProfile: jest.fn(),
  };
  const user: JwtPayload = {
    sub: 'user-1',
    email: 'user@example.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get the current user profile', async () => {
    const profile = { id: user.sub, email: user.email };
    usersServiceMock.findProfile.mockResolvedValue(profile);

    await expect(controller.getProfile(user)).resolves.toEqual(profile);
    expect(usersServiceMock.findProfile).toHaveBeenCalledWith(user.sub);
  });

  it('should update the current user profile', async () => {
    const dto = { displayName: 'Updated User', location: 'Tokyo, Japan' };
    const profile = { id: user.sub, email: user.email, ...dto };
    usersServiceMock.updateProfile.mockResolvedValue(profile);

    await expect(controller.updateProfile(user, dto)).resolves.toEqual(profile);
    expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(user.sub, dto);
  });
});
