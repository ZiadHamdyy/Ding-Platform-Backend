import { Controller, Get, Patch, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { UpdatePrivacyDto } from './dtos/update-privacy.dto';
import { PrivacyResponseDto } from './dtos/response/privacy.response';
import { Serialize } from '../../common/interceptors/serialize.interceptor';

@UseGuards(JwtAuthenticationGuard)
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Serialize(PrivacyResponseDto)
  async getPrivacySettings(@currentUser() user: any) {
    return this.privacyService.getPrivacySettings(user.id);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @Serialize(PrivacyResponseDto)
  async updatePrivacySettings(
    @currentUser() user: any,
    @Body() dto: UpdatePrivacyDto,
  ) {
    return this.privacyService.updatePrivacySettings(user.id, dto);
  }
}
