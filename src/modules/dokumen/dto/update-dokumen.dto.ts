// ===== FILE: src/modules/dokumen/dto/update-dokumen.dto.ts =====
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDokumenDto } from './create-dokumen.dto';

export class UpdateDokumenDto extends PartialType(
  OmitType(CreateDokumenDto, ['perkara_id'] as const),
) {}
