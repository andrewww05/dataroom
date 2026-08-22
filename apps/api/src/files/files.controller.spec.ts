import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { Principal } from '../auth/principal';

describe('FilesController', () => {
  let controller: FilesController;
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue({ id: 'some-id' }),
            presignDownload: jest.fn(),
            presignPreview: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
  });

  it('accepts a valid PDF upload', async () => {
    const principal: Principal = { kind: 'owner', userId: 'owner-id' };
    const pdfBuffer = Buffer.from('%PDF-1.4\n%äüöß\n...');
    
    const file = {
      buffer: pdfBuffer,
      originalname: 'test.pdf',
    } as Express.Multer.File;

    const result = await controller.upload(principal, { parentId: 'parent' }, file);
    expect(result).toBeDefined();
    expect(service.uploadFile).toHaveBeenCalledWith(principal, 'parent', file, 'application/pdf');
  });
});
