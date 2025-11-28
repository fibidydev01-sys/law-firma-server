// ============================================================================
// FILE: server/src/modules/sidang/sidang.controller.ts - WITH RBAC
// ============================================================================
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
import { SidangService } from './sidang.service';
import { CreateSidangDto } from './dto/create-sidang.dto';
import { UpdateSidangDto } from './dto/update-sidang.dto';
import { QuerySidangDto } from './dto/query-sidang.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Jadwal Sidang')
@ApiBearerAuth()
@Controller('sidang')
@UseGuards(RolesGuard)
export class SidangController {
  constructor(private readonly sidangService: SidangService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal)
  @ApiOperation({ summary: 'Buat jadwal sidang baru' })
  @ApiResponse({ status: 201, description: 'Jadwal sidang berhasil dibuat' })
  create(@Body() dto: CreateSidangDto, @CurrentUser('id') userId: string) {
    return this.sidangService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get semua jadwal sidang dengan pagination' })
  @ApiResponse({
    status: 200,
    description: 'Data jadwal sidang berhasil diambil',
  })
  findAll(
    @Query() query: QuerySidangDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole, // ✅ AMBIL ROLE
  ) {
    return this.sidangService.findAll(query, userId, userRole);
  }

  @Get('upcoming')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get jadwal sidang mendatang' })
  @ApiResponse({
    status: 200,
    description: 'Jadwal sidang mendatang berhasil diambil',
  })
  getUpcoming(
    @Query() query: QuerySidangDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole, // ✅ AMBIL ROLE
  ) {
    return this.sidangService.getUpcoming(query, userId, userRole);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get detail jadwal sidang by ID' })
  @ApiResponse({
    status: 200,
    description: 'Detail jadwal sidang berhasil diambil',
  })
  findOne(@Param('id') id: string) {
    return this.sidangService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal)
  @ApiOperation({ summary: 'Update jadwal sidang by ID' })
  @ApiResponse({ status: 200, description: 'Jadwal sidang berhasil diupdate' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSidangDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sidangService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat)
  @ApiOperation({ summary: 'Hapus jadwal sidang by ID' })
  @ApiResponse({ status: 200, description: 'Jadwal sidang berhasil dihapus' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sidangService.remove(id, userId);
  }
}
