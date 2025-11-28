// ===== FILE: src/modules/catatan/catatan.controller.ts =====
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CatatanService } from './catatan.service';
import { CreateCatatanDto } from './dto/create-catatan.dto';
import { UpdateCatatanDto } from './dto/update-catatan.dto';
import { QueryCatatanDto } from './dto/query-catatan.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Catatan Perkara')
@ApiBearerAuth()
@Controller('catatan')
@UseGuards(RolesGuard)
export class CatatanController {
  constructor(private readonly catatanService: CatatanService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.advokat, UserRole.paralegal)
  @ApiOperation({ summary: 'Buat catatan perkara baru' })
  @ApiResponse({ status: 201, description: 'Catatan berhasil dibuat' })
  create(@Body() dto: CreateCatatanDto, @CurrentUser('id') userId: string) {
    return this.catatanService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get semua catatan dengan pagination' })
  @ApiResponse({ status: 200, description: 'Data catatan berhasil diambil' })
  findAll(@Query() query: QueryCatatanDto) {
    return this.catatanService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detail catatan by ID' })
  @ApiResponse({ status: 200, description: 'Detail catatan berhasil diambil' })
  findOne(@Param('id') id: string) {
    return this.catatanService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.advokat, UserRole.paralegal)
  @ApiOperation({ summary: 'Update catatan by ID' })
  @ApiResponse({ status: 200, description: 'Catatan berhasil diupdate' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCatatanDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.catatanService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.advokat)
  @ApiOperation({ summary: 'Hapus catatan by ID' })
  @ApiResponse({ status: 200, description: 'Catatan berhasil dihapus' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.catatanService.remove(id, userId);
  }
}
