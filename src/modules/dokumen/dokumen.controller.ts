// ============================================================================
// FILE: server/src/modules/dokumen/dokumen.controller.ts - WITH RBAC
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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Header,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { DokumenService } from './dokumen.service';
import { CreateDokumenDto } from './dto/create-dokumen.dto';
import { UpdateDokumenDto } from './dto/update-dokumen.dto';
import { QueryDokumenDto } from './dto/query-dokumen.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@ApiTags('Dokumen Hukum')
@ApiBearerAuth()
@Controller('dokumen')
@UseGuards(RolesGuard)
export class DokumenController {
  constructor(
    private readonly dokumenService: DokumenService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  @Post()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Upload dokumen baru' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Dokumen berhasil diupload' })
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false, // ✅ Allow file field in multipart form
    transform: true
  }))
  create(
    @Body() dto: CreateDokumenDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.dokumenService.create(dto, file, userId, userRole);
  }

  @Post('bulk')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Upload multiple dokumen sekaligus' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Dokumen berhasil diupload' })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true
  }))
  createBulk(
    @Body() dto: CreateDokumenDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.dokumenService.createBulk(dto, files, userId, userRole);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Get semua dokumen dengan pagination' })
  @ApiResponse({ status: 200, description: 'Data dokumen berhasil diambil' })
  findAll(
    @Query() query: QueryDokumenDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.dokumenService.findAll(query, userId, userRole);
  }

  @Get('stats')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Get statistik dokumen' })
  @ApiResponse({ status: 200, description: 'Statistik dokumen berhasil diambil' })
  getStats(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.dokumenService.getStats(userId, userRole);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Get detail dokumen by ID' })
  @ApiResponse({ status: 200, description: 'Detail dokumen berhasil diambil' })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.dokumenService.findOne(id, userId, userRole);
  }

  @Get(':id/download')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Download dokumen by ID' })
  @ApiResponse({ status: 200, description: 'Dokumen berhasil didownload' })
  download(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.dokumenService.download(id, userId, userRole);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal)
  @ApiOperation({ summary: 'Update dokumen by ID' })
  @ApiResponse({ status: 200, description: 'Dokumen berhasil diupdate' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDokumenDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.dokumenService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat)
  @ApiOperation({ summary: 'Hapus dokumen by ID' })
  @ApiResponse({ status: 200, description: 'Dokumen berhasil dihapus' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.dokumenService.remove(id, userId, userRole);
  }

  @Patch(':id/move')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff, UserRole.klien)
  @ApiOperation({ summary: 'Pindahkan dokumen ke folder lain' })
  @ApiResponse({ status: 200, description: 'Dokumen berhasil dipindahkan' })
  move(
    @Param('id') id: string,
    @Body() body: { folder_id: string | null },
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.dokumenService.moveToFolder(id, body.folder_id, userId, userRole);
  }

  @Post(':id/copy')
  @Roles(UserRole.admin, UserRole.partner, UserRole.advokat, UserRole.paralegal, UserRole.staff)
  @ApiOperation({ summary: 'Copy dokumen' })
  @ApiResponse({ status: 201, description: 'Dokumen berhasil dicopy' })
  copy(
    @Param('id') id: string,
    @Body() body: { folder_id?: string | null; nama_dokumen?: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.dokumenService.copyDocument(id, body.folder_id, body.nama_dokumen, userId, userRole);
  }

  @Get('test/google-drive-connection')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Test Google Drive API connection (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Google Drive connection test results',
  })
  testGoogleDriveConnection() {
    return this.googleDriveService.testConnection();
  }

  @Get('test/google-drive-folder')
  @Roles(UserRole.admin)
  @ApiOperation({
    summary: 'Test Google Drive folder access and permissions (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Folder access test results',
  })
  testGoogleDriveFolder() {
    return this.googleDriveService.testFolderAccess();
  }
}
