// ===== FILE: users-bulk.controller.ts =====
// Handles: Bulk delete, bulk change role
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from '../users.service';
import { BulkDeleteDto } from '../dto/bulk-delete.dto';
import { BulkChangeRoleDto } from '../dto/bulk-change-role.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Users - Bulk Operations')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
export class UsersBulkController {
  constructor(private readonly usersService: UsersService) {}

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Bulk delete users' })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete operation completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', example: 3 },
        failed: { type: 'number', example: 1 },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              user_id: { type: 'string' },
              email: { type: 'string' },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid user IDs' })
  bulkDelete(
    @Body() dto: BulkDeleteDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.usersService.bulkDeleteUsers(dto.user_ids, currentUserId);
  }

  @Post('bulk-change-role')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Bulk change user roles' })
  @ApiResponse({ status: 200, description: 'Bulk role change completed' })
  @ApiResponse({ status: 400, description: 'Invalid user IDs or role' })
  bulkChangeRole(
    @Body() dto: BulkChangeRoleDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.usersService.bulkChangeRole(
      dto.user_ids,
      dto.role,
      currentUserId,
    );
  }
}
