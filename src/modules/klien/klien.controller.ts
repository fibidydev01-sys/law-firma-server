// ===== FILE: server/src/modules/klien/klien.controller.ts (UPDATED) =====
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
import { KlienService } from './klien.service';
import { CreateKlienDto } from './dto/create-klien.dto';
import { UpdateKlienDto } from './dto/update-klien.dto';
import { QueryKlienDto } from './dto/query-klien.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Klien')
@ApiBearerAuth()
@Controller('klien')
@UseGuards(RolesGuard)
export class KlienController {
  constructor(private readonly klienService: KlienService) {}

  // ✅ NEW: Endpoint khusus untuk client lihat profile sendiri
  @Get('profile')
  @Roles(UserRole.klien)
  @ApiOperation({ summary: 'Get profile klien (diri sendiri)' })
  @ApiResponse({ status: 200, description: 'Profile klien berhasil diambil' })
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.klienService.getMyProfile(userId);
  }

  // ✅ NEW: Endpoint khusus untuk client update profile sendiri
  @Patch('profile')
  @Roles(UserRole.klien)
  @ApiOperation({ summary: 'Update profile klien' })
  @ApiResponse({ status: 200, description: 'Profile klien berhasil diupdate' })
  updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateKlienDto,
  ) {
    return this.klienService.updateMyProfile(userId, dto);
  }

  // 🔒 EXISTING: Endpoint untuk admin/partner/advokat/paralegal/staff
  @Post()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Buat klien baru' })
  @ApiResponse({ status: 201, description: 'Klien berhasil dibuat' })
  create(@Body() dto: CreateKlienDto, @CurrentUser('id') userId: string) {
    return this.klienService.create(dto, userId);
  }

  // 🔒 EXISTING: List semua klien (TIDAK untuk client)
  @Get()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get semua klien dengan pagination' })
  @ApiResponse({ status: 200, description: 'Data klien berhasil diambil' })
  findAll(
    @Query() query: QueryKlienDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.klienService.findAll(query, userId, userRole);
  }

  // 🔒 EXISTING: Detail klien by ID (TIDAK untuk client)
  @Get(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get detail klien by ID' })
  @ApiResponse({ status: 200, description: 'Detail klien berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Klien tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.klienService.findOne(id);
  }

  // 🔒 EXISTING: Update klien (TIDAK untuk client)
  @Patch(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Update klien by ID' })
  @ApiResponse({ status: 200, description: 'Klien berhasil diupdate' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateKlienDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.klienService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.partner)
  @ApiOperation({ summary: 'Hapus klien by ID' })
  @ApiResponse({ status: 200, description: 'Klien berhasil dihapus' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.klienService.remove(id, userId);
  }
}
