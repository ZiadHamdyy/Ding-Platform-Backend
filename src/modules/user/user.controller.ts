import {
  Body,
  Controller,
  Delete,
  Get,
  Query,
  Patch,
  Param,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import {
  UserIdResponse,
  UserResponse,
} from './dtos/response/user.response';
import { CheckEmailResponse } from './dtos/response/check-email.response';
import {
  UserEmailInput,
  UserListFilterInput,
} from './dtos/request/user-filter.input';
import { CheckEmailRequest } from './dtos/request/check-email.request';
import { CreateUserRequest } from './dtos/request/create-user.request';
import { ToggleUserActivityRequest } from './dtos/request/toggle-user-activity.request';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(@Query() filters: UserListFilterInput) {
    return await this.userService.getAllUsers(filters);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Serialize(UserResponse)
  async createUser(@Body() data: CreateUserRequest) {
    return await this.userService.createUser(data);
  }

  @Get(':email')
  @Serialize(UserIdResponse)
  async getUserIdByEmail(@Param('email') email: string) {
    return await this.userService.getVerifiedUserIdByEmail(email);
  }


  @Patch('toggle-activity')
  @HttpCode(HttpStatus.OK)
  @Serialize(UserResponse)
  async toggleUserActivity(
    @Param('id') userId: string,
    @Body() data: ToggleUserActivityRequest,
  ) {
    return await this.userService.toggleUserActivity(data, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id') userId: string,
  ) {
    return await this.userService.deleteUser(userId);
  }

  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  @Serialize(CheckEmailResponse)
  async checkEmail(@Body() data: CheckEmailRequest) {
    return await this.userService.checkEmail(data.email);
  }
}
