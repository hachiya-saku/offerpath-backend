import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { DEMO_USER_ID } from '../common/constants/demo-user';

describe('CompaniesController', () => {
  let controller: CompaniesController;

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
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAllByUserId with the demo user ID', async () => {
    const result = await controller.findAll();

    expect(companiesServiceMock.findAllByUserId).toHaveBeenCalledWith(
      DEMO_USER_ID,
    );
    expect(result).toEqual([]);
  });

  it('should call createForUser with the demo user ID and DTO', async () => {
    const dto = {
      name: 'OfferPath Inc.',
      website: 'https://example.com',
      notes: 'Demo company',
    };

    const result = await controller.create(dto);

    expect(companiesServiceMock.createForUser).toHaveBeenCalledWith(
      DEMO_USER_ID,
      dto,
    );
    expect(result).toEqual({ id: 'company-1' });
  });

  it('should call updateForUser with the demo user ID, company ID, and DTO', async () => {
    const companyId = 'company-1';
    const dto = {
      name: 'Updated Company Name',
      website: 'https://updated-example.com',
      notes: 'Updated notes',
    };

    const result = await controller.update(companyId, dto);

    expect(companiesServiceMock.updateForUser).toHaveBeenCalledWith(
      DEMO_USER_ID,
      companyId,
      dto,
    );
    expect(result).toEqual({ id: 'company-1' });
  });

  it('should call deleteForUser with the demo user ID and company ID', async () => {
    const companyId = 'company-1';

    const result = await controller.delete(companyId);

    expect(companiesServiceMock.deleteForUser).toHaveBeenCalledWith(
      DEMO_USER_ID,
      companyId,
    );
    expect(result).toEqual({ id: 'company-1' });
  });
});
