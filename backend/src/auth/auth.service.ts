// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import admin from '../config/firebase.config';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async validateFirebaseIdToken(idToken: string) {
    try {
      // Verifica o ID token no Firebase
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userInfo = await admin.auth().getUser(decodedToken.uid);

      // Busca ou cria o usuário na base interna
      const user = await this.usersService.findOrCreate({
        uid: decodedToken.uid,
        email: decodedToken.email,
        full_name: userInfo.displayName || 'Usuário sem nome',
        profile_picture_url: userInfo.photoURL || null,
        phone_number: userInfo.phoneNumber || null,
      });

      // Calcula se o status ICONIC ainda está ativo
      const now = new Date();
      const hasActiveIconic =
        Boolean(user.is_iconic) &&
        Boolean(user.iconic_expires_at) &&
        new Date(user.iconic_expires_at) > now;

      // Monta o payload com role e flags de ICONIC
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role, // 'user' | 'iconic' | 'admin' | 'scanner'
        is_iconic: hasActiveIconic, // true se ícone ativo e não expirado
        iconic_expires_at: user.iconic_expires_at // string ISO ou null
          ? user.iconic_expires_at.toISOString()
          : null,
      };

      return {
        access_token: this.jwtService.sign(payload),
      };
    } catch (err) {
      console.error('❌ Erro ao validar Firebase ID token:', err);
      throw new UnauthorizedException('ID token inválido');
    }
  }
}
