// ===== FILE: src/modules/klien/dto/update-klien.dto.ts =====
import { PartialType } from '@nestjs/swagger';
import { CreateKlienDto } from './create-klien.dto';

export class UpdateKlienDto extends PartialType(CreateKlienDto) {}
