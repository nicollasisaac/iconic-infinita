// src/iconic/iconic.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IconicService {
  constructor(private readonly prisma: PrismaService) {}

  async getRandomIconicMembers() {
    const iconics = await this.prisma.user.findMany({
      where: { is_iconic: true },
      select: {
        id: true,
        full_name: true,
        nickname: true,
        profile_picture_url: true,
        is_iconic: true,
      },
    });
    // Fisher–Yates shuffle
    for (let i = iconics.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [iconics[i], iconics[j]] = [iconics[j], iconics[i]];
    }
    return iconics;
  }

  async getIconicChatMessages() {
    const rows = await this.prisma.iconicChatMessage.findMany({
      orderBy: { created_at: 'desc' },
      take: 30,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            full_name: true,
            profile_picture_url: true,
          },
        },
      },
    });
    return rows.map((m) => ({
      id: m.id,
      user_id: m.user.id,
      message: m.message,
      created_at: m.created_at,
      nickname: m.user.nickname,
      full_name: m.user.full_name,
      profile_picture_url: m.user.profile_picture_url,
    }));
  }

  async createIconicChatMessage(userId: string, message: string) {
    const m = await this.prisma.iconicChatMessage.create({
      data: { user_id: userId, message },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            full_name: true,
            profile_picture_url: true,
          },
        },
      },
    });
    return {
      id: m.id,
      user_id: m.user.id,
      message: m.message,
      created_at: m.created_at,
      nickname: m.user.nickname,
      full_name: m.user.full_name,
      profile_picture_url: m.user.profile_picture_url,
    };
  }
}
