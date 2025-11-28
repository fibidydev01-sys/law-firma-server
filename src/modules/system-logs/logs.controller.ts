// ===== FILE: src/modules/logs/logs.controller.ts =====
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { QueryLogsDto } from './dto/query-logs.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Log Aktivitas')
@ApiBearerAuth()
@Controller('logs')
@UseGuards(RolesGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Get semua log aktivitas dengan pagination' })
  @ApiResponse({
    status: 200,
    description: 'Data log aktivitas berhasil diambil',
  })
  findAll(@Query() query: QueryLogsDto) {
    return this.logsService.findAll(query);
  }

  @Get('my-activities')
  @ApiOperation({ summary: 'Get log aktivitas saya' })
  @ApiResponse({
    status: 200,
    description: 'Log aktivitas saya berhasil diambil',
  })
  getMyActivities(
    @CurrentUser('id') userId: string,
    @Query() query: QueryLogsDto,
  ) {
    return this.logsService.getMyActivities(userId, query);
  }

  @Get(':id')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Get detail log aktivitas by ID' })
  @ApiResponse({
    status: 200,
    description: 'Detail log aktivitas berhasil diambil',
  })
  findOne(@Param('id') id: string) {
    return this.logsService.findOne(id);
  }

  @Delete('cleanup')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Hapus log lama (lebih dari 90 hari)' })
  @ApiResponse({ status: 200, description: 'Log lama berhasil dihapus' })
  cleanup() {
    return this.logsService.cleanup();
  }
}
