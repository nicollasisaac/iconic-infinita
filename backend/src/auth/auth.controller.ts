// src/auth/auth.controller.ts
import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/firebase')
  async login(@Body('idToken') idToken: string) {
    if (!idToken) {
      throw new UnauthorizedException('ID token não informado');
    }
    return this.authService.validateFirebaseIdToken(idToken);
  }
}
