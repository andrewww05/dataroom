import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  UseFilters,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import { assertCapability, Principal } from '../auth/principal';
import {
  UnsupportedTypeException,
  ValidationFailedException,
  TooManyFilesException,
} from '../http/api.exception';
import { sniffMimeType } from './mime.sniffer';
import { UPLOAD_ALLOWED_MIME_TYPES } from '@dataroom/shared';

const maxFileBytes = Number(process.env.MAX_FILE_BYTES || 104857600);

@Catch(BadRequestException)
export class MulterLimitFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    if (exception.message === 'Too many files' || exception.message === 'Unexpected field') {
      const apiEx = new TooManyFilesException();
      host.switchToHttp().getResponse().status(apiEx.getStatus()).json(apiEx.body);
      return;
    }
    // Fall back to standard validation error for other Multer errors
    const apiEx = new ValidationFailedException({ file: [exception.message] });
    host.switchToHttp().getResponse().status(apiEx.getStatus()).json(apiEx.body);
  }
}

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseFilters(MulterLimitFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: maxFileBytes, files: 1 },
    }),
  )
  async upload(
    @CurrentPrincipal() principal: Principal,
    @Body() body: UploadFileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    assertCapability(principal, 'write');

    if (!file) {
      throw new ValidationFailedException({ file: ['A file is required'] });
    }

    const sniffedType = sniffMimeType(file.buffer, file.originalname);
    if (!sniffedType || !(UPLOAD_ALLOWED_MIME_TYPES as readonly string[]).includes(sniffedType)) {
      throw new UnsupportedTypeException();
    }

    return this.filesService.uploadFile(principal, body.parentId, file, sniffedType);
  }

  @Get(':id/download')
  async download(
    @CurrentPrincipal() principal: Principal,
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new ValidationFailedException({ id: ['Must be a valid UUID'] }),
      }),
    )
    id: string,
  ) {
    return this.filesService.presignDownload(principal, id);
  }

  @Get(':id/preview')
  async preview(
    @CurrentPrincipal() principal: Principal,
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new ValidationFailedException({ id: ['Must be a valid UUID'] }),
      }),
    )
    id: string,
  ) {
    return this.filesService.presignPreview(principal, id);
  }
}
