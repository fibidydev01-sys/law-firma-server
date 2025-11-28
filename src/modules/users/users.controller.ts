// ===== FILE: users.controller.ts (REFACTORED - BASIC CRUD ONLY) =====
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { LogAktivitasService } from '../log-aktivitas/log-aktivitas.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logAktivitasService: LogAktivitasService,
  ) {}

  // ============================================================================
  // BASIC CRUD OPERATIONS
  // ============================================================================

  @Post()
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Buat user baru' })
  @ApiResponse({ status: 201, description: 'User berhasil dibuat' })
  create(@Body() dto: CreateUserDto, @CurrentUser('id') userId: string) {
    return this.usersService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Get semua users dengan pagination (for assignment purposes)' })
  @ApiResponse({ status: 200, description: 'Data users berhasil diambil' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get('statistics')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Get team statistics' })
  @ApiResponse({ status: 200, description: 'Team statistics retrieved' })
  getStatistics() {
    return this.usersService.getTeamStatistics();
  }

  @Get('workload-distribution')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Get workload distribution across team' })
  @ApiResponse({
    status: 200,
    description: 'Workload distribution retrieved',
  })
  getWorkloadDistribution() {
    return this.usersService.getWorkloadDistribution();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detail user by ID' })
  @ApiResponse({ status: 200, description: 'Detail user berhasil diambil' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity logs' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved' })
  getUserActivity(
    @Param('id') userId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.logAktivitasService.findByUser(userId, query);
  }

  @Patch(':id')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User berhasil diupdate' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Hapus user by ID' })
  @ApiResponse({ status: 200, description: 'User berhasil dihapus' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.usersService.remove(id, userId);
  }
}
