// ===== FILE: src/modules/konflik/dto/update-konflik.dto.ts =====
import { PartialType } from '@nestjs/swagger';
import { CreateKonflikDto } from './create-konflik.dto';

export class UpdateKonflikDto extends PartialType(CreateKonflikDto) {}
