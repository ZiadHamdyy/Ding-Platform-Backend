import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { FeedService } from './feed.service';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { FeedResponseDto } from './dtos/response/feed.response';
import { Serialize } from '../../common/interceptors/serialize.interceptor';

@UseGuards(JwtAuthenticationGuard)
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Serialize(FeedResponseDto)
  async getFeed(
    @currentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.feedService.getFeed(user.id, pageNum, limitNum);
    return result;
  }
}
