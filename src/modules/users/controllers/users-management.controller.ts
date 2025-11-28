// ===== FILE: users-management.controller.ts =====
// Handles: Password reset, status toggle, avatar upload/delete, invitations
import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from '../users.service';
import { ToggleStatusDto } from '../dto/toggle-status.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Users - Management')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
export class UsersManagementController {
  constructor(private readonly usersService: UsersService) {}

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.admin)
  @ApiOperation({
    summary: 'Reset user password (generate temporary password)',
  })
  @ApiResponse({
    status: 200,
    description: 'Password berhasil direset',
    schema: {
      type: 'object',
      properties: {
        temporary_password: { type: 'string', example: 'a3f8b2c9d1' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  resetPassword(@Param('id') id: string) {
    return this.usersService.resetUserPassword(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiResponse({ status: 200, description: 'Status berhasil diubah' })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  toggleStatus(@Param('id') id: string, @Body() dto: ToggleStatusDto) {
    return this.usersService.toggleUserStatus(id, dto.active);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Avatar berhasil diupload',
    schema: {
      type: 'object',
      properties: {
        avatar_url: {
          type: 'string',
          example: '/uploads/avatars/user-123_1234567890.jpg',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'File tidak valid' })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(id, file);
  }

  @Delete(':id/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user avatar' })
  @ApiResponse({ status: 204, description: 'Avatar berhasil dihapus' })
  @ApiResponse({ status: 400, description: 'User tidak memiliki avatar' })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  async deleteAvatar(@Param('id') id: string) {
    await this.usersService.deleteAvatar(id);
  }

  @Post(':id/send-invitation')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Send invitation email to user' })
  @ApiResponse({
    status: 200,
    description: 'Invitation email sent',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Invitation email sent successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  sendInvitation(@Param('id') id: string) {
    return this.usersService.sendInvitationEmail(id);
  }

  @Post(':id/resend-invitation')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Resend invitation email to user' })
  @ApiResponse({ status: 200, description: 'Invitation email resent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  resendInvitation(@Param('id') id: string) {
    return this.usersService.resendInvitationEmail(id);
  }
}
