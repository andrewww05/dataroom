import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import { assertCapability, Principal } from '../auth/principal';
import { UnsupportedTypeException, ValidationFailedException } from '../http/api.exception';
import { sniffMimeType } from './mime.sniffer';
import { UPLOAD_ALLOWED_MIME_TYPES } from '@dataroom/shared';

const maxFileBytes = Number(process.env.MAX_FILE_BYTES || 104857600);

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
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
