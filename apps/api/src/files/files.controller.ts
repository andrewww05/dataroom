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
import { Principal } from '../auth/principal';
import { UnsupportedTypeException, ValidationFailedException } from '../http/api.exception';
import { sniffMimeType } from './mime.sniffer';
import { UPLOAD_ALLOWED_MIME_TYPES } from '@dataroom/shared';
import { readEnv } from '../config/env';

// We evaluate this once at module load since the config won't change
const maxFileBytes = readEnv().maxFileBytes;

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
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.filesService.presignDownload(principal, id);
  }
}
