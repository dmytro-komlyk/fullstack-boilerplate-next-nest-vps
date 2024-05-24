import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtGuard } from '@server/domain/auth/guards/jwt.guard';
import { UserService } from '@server/domain/user/user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @UseGuards(JwtGuard)
  @Get(':id')
  async getUserProfile(@Param('id') id: string) {
    return await this.userService.findById(id);
  }
}
