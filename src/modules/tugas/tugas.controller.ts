// ============================================================================
// 🔧 FIX #2: TUGAS MODULE - Block Client Access Completely
// ============================================================================

// ===== FILE: server/src/modules/tugas/tugas.controller.ts (UPDATED) =====
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
import { TugasService } from './tugas.service';
import { CreateTugasDto } from './dto/create-tugas.dto';
import { UpdateTugasDto } from './dto/update-tugas.dto';
import { QueryTugasDto } from './dto/query-tugas.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Tugas')
@ApiBearerAuth()
@Controller('tugas')
@UseGuards(RolesGuard)
export class TugasController {
  constructor(private readonly tugasService: TugasService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal)
  @ApiOperation({ summary: 'Buat tugas baru' })
  @ApiResponse({ status: 201, description: 'Tugas berhasil dibuat' })
  create(
    @Body() dto: CreateTugasDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.tugasService.create(dto, userId, userRole);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get semua tugas dengan pagination' })
  @ApiResponse({ status: 200, description: 'Data tugas berhasil diambil' })
  findAll(
    @Query() query: QueryTugasDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.tugasService.findAll(query, userId, userRole);
  }

  @Get('my-tasks')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get tugas saya' })
  @ApiResponse({ status: 200, description: 'Tugas saya berhasil diambil' })
  getMyTasks(@CurrentUser('id') userId: string, @Query() query: QueryTugasDto) {
    return this.tugasService.getMyTasks(userId, query);
  }

  @Get('assignable-users')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal)
  @ApiOperation({ summary: 'Get daftar user yang bisa ditugaskan (role hierarchy)' })
  @ApiResponse({
    status: 200,
    description: 'Daftar user berhasil diambil berdasarkan role hierarchy'
  })
  getAssignableUsers(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.tugasService.getAssignableUsers(userId, userRole);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get detail tugas by ID' })
  @ApiResponse({ status: 200, description: 'Detail tugas berhasil diambil' })
  findOne(@Param('id') id: string) {
    return this.tugasService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Update tugas by ID' })
  @ApiResponse({ status: 200, description: 'Tugas berhasil diupdate' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTugasDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tugasService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat)
  @ApiOperation({ summary: 'Hapus tugas by ID' })
  @ApiResponse({ status: 200, description: 'Tugas berhasil dihapus' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tugasService.remove(id, userId);
  }
}
