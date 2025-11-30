import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import type { currentUserType } from '../../common/types/current-user.type';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthenticationGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getNotifications(
    @currentUser() user: currentUserType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const unreadOnlyBool = unreadOnly === 'true';

    return this.notificationService.getUserNotifications(
      user.id,
      pageNum,
      limitNum,
      unreadOnlyBool,
    );
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  async getUnreadCount(@currentUser() user: currentUserType) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') notificationId: string,
    @currentUser() user: currentUserType,
  ) {
    return this.notificationService.markAsRead(notificationId, user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@currentUser() user: currentUserType) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    @Param('id') notificationId: string,
    @currentUser() user: currentUserType,
  ) {
    return this.notificationService.deleteNotification(notificationId, user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteAllNotifications(@currentUser() user: currentUserType) {
    return this.notificationService.deleteAllNotifications(user.id);
  }
}
