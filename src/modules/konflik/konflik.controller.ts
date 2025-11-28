// ===== FILE: src/modules/konflik/konflik.controller.ts =====
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
import { KonflikService } from './konflik.service';
import { CreateKonflikDto } from './dto/create-konflik.dto';
import { UpdateKonflikDto } from './dto/update-konflik.dto';
import { QueryKonflikDto } from './dto/query-konflik.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Pemeriksaan Konflik')
@ApiBearerAuth()
@Controller('konflik')
@UseGuards(RolesGuard)
export class KonflikController {
  constructor(private readonly konflikService: KonflikService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal)
  @ApiOperation({ summary: 'Buat pemeriksaan konflik baru' })
  @ApiResponse({
    status: 201,
    description: 'Pemeriksaan konflik berhasil dibuat',
  })
  create(@Body() dto: CreateKonflikDto, @CurrentUser('id') userId: string) {
    return this.konflikService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get semua pemeriksaan konflik dengan pagination' })
  @ApiResponse({
    status: 200,
    description: 'Data pemeriksaan konflik berhasil diambil',
  })
  findAll(@Query() query: QueryKonflikDto) {
    return this.konflikService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get detail pemeriksaan konflik by ID' })
  @ApiResponse({
    status: 200,
    description: 'Detail pemeriksaan konflik berhasil diambil',
  })
  findOne(@Param('id') id: string) {
    return this.konflikService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal)
  @ApiOperation({ summary: 'Update pemeriksaan konflik by ID' })
  @ApiResponse({
    status: 200,
    description: 'Pemeriksaan konflik berhasil diupdate',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateKonflikDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.konflikService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat)
  @ApiOperation({ summary: 'Hapus pemeriksaan konflik by ID' })
  @ApiResponse({
    status: 200,
    description: 'Pemeriksaan konflik berhasil dihapus',
  })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.konflikService.remove(id, userId);
  }
}
