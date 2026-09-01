import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

describe('CompaniesController', () => {
  let controller: CompaniesController;
  const user: JwtPayload = {
    sub: 'authenticated-user',
    email: 'user@example.com',
  };

  const companiesServiceMock = {
    findAllByUserId: jest.fn().mockResolvedValue([]),
    createForUser: jest.fn().mockResolvedValue({ id: 'company-1' }),
    updateForUser: jest.fn().mockResolvedValue({ id: 'company-1' }),
    deleteForUser: jest.fn().mockResolvedValue({ id: 'company-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
          useValue: companiesServiceMock,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CompaniesController>(CompaniesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAllByUserId with the current user ID', async () => {
    const result = await controller.findAll(user);

    expect(companiesServiceMock.findAllByUserId).toHaveBeenCalledWith(user.sub);
    expect(result).toEqual([]);
  });

  it('should call createForUser with the current user ID and DTO', async () => {
    const dto = {
      name: 'OfferPath Inc.',
      website: 'https://example.com',
      notes: 'Demo company',
    };

    const result = await controller.create(dto, user);

    expect(companiesServiceMock.createForUser).toHaveBeenCalledWith(
      user.sub,
      dto,
    );
    expect(result).toEqual({ id: 'company-1' });
  });

  it('should call updateForUser with the current user ID, company ID, and DTO', async () => {
    const companyId = 'company-1';
    const dto = {
      name: 'Updated Company Name',
      website: 'https://updated-example.com',
      notes: 'Updated notes',
    };

    const result = await controller.update(companyId, dto, user);

    expect(companiesServiceMock.updateForUser).toHaveBeenCalledWith(
      user.sub,
      companyId,
      dto,
    );
    expect(result).toEqual({ id: 'company-1' });
  });

  it('should call deleteForUser with the current user ID and company ID', async () => {
    const companyId = 'company-1';

    const result = await controller.delete(companyId, user);

    expect(companiesServiceMock.deleteForUser).toHaveBeenCalledWith(
      user.sub,
      companyId,
    );
    expect(result).toEqual({ id: 'company-1' });
  });
});
