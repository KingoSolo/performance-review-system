import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(
    @Body() body: { email: string; password: string; name: string; companyName: string },
  ) {
    return this.authService.signUp(
      body.email,
      body.password,
      body.name,
      body.companyName,
    );
  }

  @Post('signin')
  async signIn(@Body() body: { email: string; password: string }) {
    return this.authService.signIn(body.email, body.password);
  }

  @Post('signout')
  async signOut() {
    return this.authService.signOut();
  }

  @Get('me')
  async getCurrentUser(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authorization.replace('Bearer ', '');
    return this.authService.verifyToken(token);
  }
}
