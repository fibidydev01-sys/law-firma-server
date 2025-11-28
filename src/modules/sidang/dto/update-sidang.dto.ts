// ===== FILE: src/modules/sidang/dto/update-sidang.dto.ts =====
import { PartialType } from '@nestjs/swagger';
import { CreateSidangDto } from './create-sidang.dto';

export class UpdateSidangDto extends PartialType(CreateSidangDto) {}
