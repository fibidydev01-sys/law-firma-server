// ===== FILE: src/modules/catatan/dto/update-catatan.dto.ts =====
import { PartialType } from '@nestjs/swagger';
import { CreateCatatanDto } from './create-catatan.dto';

export class UpdateCatatanDto extends PartialType(CreateCatatanDto) {}
