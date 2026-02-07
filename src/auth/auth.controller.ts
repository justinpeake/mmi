import { Body, Controller, Get, Post, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username);
  }

  @Get('me')
  me(@Headers('authorization') authorization: string | undefined) {
    const token = this.parseBearerToken(authorization);
    if (!token) {
      throw new UnauthorizedException('Missing or invalid authorization');
    }
    const user = this.authService.validateToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return { user };
  }

  private parseBearerToken(auth: string | undefined): string | null {
    if (!auth || !auth.startsWith('Bearer ')) return null;
    return auth.slice(7).trim() || null;
  }
}
