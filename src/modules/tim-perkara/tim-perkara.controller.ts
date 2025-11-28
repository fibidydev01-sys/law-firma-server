// ===== FILE: src/modules/tim-perkara/tim-perkara.controller.ts (FIXED) =====
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { TimPerkaraService } from './tim-perkara.service';
import { CreateTimPerkaraDto } from './dto/create-tim-perkara.dto';
import { UpdateTimPerkaraDto } from './dto/update-tim-perkara.dto';
import { QueryTimPerkaraDto } from './dto/query-tim-perkara.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Tim Perkara')
@ApiBearerAuth()
@Controller('tim-perkara')
@UseGuards(RolesGuard)
export class TimPerkaraController {
  constructor(private readonly timPerkaraService: TimPerkaraService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat)
  @ApiOperation({ summary: 'Tambah anggota tim perkara' })
  @ApiResponse({ status: 201, description: 'Anggota tim berhasil ditambahkan' })
  create(@Body() dto: CreateTimPerkaraDto, @CurrentUser('id') userId: string) {
    return this.timPerkaraService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get semua tim perkara dengan pagination' })
  @ApiResponse({
    status: 200,
    description: 'Data tim perkara berhasil diambil',
  })
  findAll(@Query() query: QueryTimPerkaraDto) {
    return this.timPerkaraService.findAll(query);
  }

  @Get('perkara/:perkaraId')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get tim berdasarkan perkara ID' })
  @ApiResponse({
    status: 200,
    description: 'Data tim perkara berhasil diambil',
  })
  findByPerkara(@Param('perkaraId') perkaraId: string) {
    return this.timPerkaraService.findByPerkara(perkaraId);
  }

  @Get('user/:userId')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get perkara berdasarkan user ID' })
  @ApiResponse({
    status: 200,
    description: 'Data perkara user berhasil diambil',
  })
  findByUser(@Param('userId') userId: string) {
    return this.timPerkaraService.findByUser(userId);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get detail tim perkara by ID' })
  @ApiResponse({
    status: 200,
    description: 'Detail tim perkara berhasil diambil',
  })
  findOne(@Param('id') id: string) {
    return this.timPerkaraService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat)
  @ApiOperation({ summary: 'Update anggota tim perkara (edit peran)' })
  @ApiResponse({ status: 200, description: 'Anggota tim berhasil diupdate' })
  @ApiResponse({ status: 404, description: 'Tim perkara tidak ditemukan' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTimPerkaraDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.timPerkaraService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat)
  @ApiOperation({ summary: 'Hapus anggota tim perkara' })
  @ApiResponse({ status: 200, description: 'Anggota tim berhasil dihapus' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.timPerkaraService.remove(id, userId);
  }
}
