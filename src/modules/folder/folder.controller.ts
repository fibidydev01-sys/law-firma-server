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
import { FolderService } from './folder.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { QueryFolderDto } from './dto/query-folder.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Folder Dokumen')
@ApiBearerAuth()
@Controller('folders')
@UseGuards(RolesGuard)
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Buat folder baru' })
  @ApiResponse({ status: 201, description: 'Folder berhasil dibuat' })
  create(
    @Body() dto: CreateFolderDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.folderService.create(dto, userId, userRole);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Get semua folder' })
  @ApiResponse({ status: 200, description: 'Data folder berhasil diambil' })
  findAll(
    @Query() query: QueryFolderDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.folderService.findAll(query, userId, userRole);
  }

  @Get('tree/:perkaraId')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Get folder tree structure' })
  @ApiResponse({ status: 200, description: 'Folder tree berhasil diambil' })
  getTree(
    @Param('perkaraId') perkaraId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.folderService.getTree(perkaraId, userId, userRole);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Get detail folder by ID' })
  @ApiResponse({ status: 200, description: 'Detail folder berhasil diambil' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.folderService.findOne(id, userId, userRole);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Update folder by ID' })
  @ApiResponse({ status: 200, description: 'Folder berhasil diupdate' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.folderService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Hapus folder by ID' })
  @ApiResponse({ status: 200, description: 'Folder berhasil dihapus' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.folderService.remove(id, userId, userRole);
  }
}
