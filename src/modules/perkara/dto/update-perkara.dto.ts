// ===== FILE: src/modules/perkara/dto/update-perkara.dto.ts =====
import { PartialType } from '@nestjs/swagger';
import { CreatePerkaraDto } from './create-perkara.dto';

export class UpdatePerkaraDto extends PartialType(CreatePerkaraDto) {}
