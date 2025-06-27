// src/user-photos/user-photo.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserPhotoDto } from './dtos/create-user-photo.dto';
import { UpdateUserPhotoDto } from './dtos/update-user-photo.dto';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

@Injectable()
export class UserPhotosService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  constructor(private prisma: PrismaService) {}

  /**
   * Retorna todas as fotos do usuário, ordenadas por posição,
   * gerando URLs assinadas válidas por 1 hora.
   */
  async findAllByUser(userId: string) {
    const photos = await this.prisma.userPhoto.findMany({
      where: { user_id: userId },
      orderBy: { position: 'asc' },
    });

    return Promise.all(
      photos.map(async (photo) => {
        const filename = path.basename(new URL(photo.url).pathname);
        const filePath = `${userId}/${filename}`;
        const { data, error } = await this.supabase.storage
          .from('user-photos')
          .createSignedUrl(filePath, 60 * 60); // 1 hora em segundos

        if (error || !data.signedUrl) {
          throw new BadRequestException(
            'Não foi possível gerar URL assinada para a imagem.',
          );
        }

        return {
          id: photo.id,
          url: data.signedUrl,
          position: photo.position,
        };
      }),
    );
  }

  /**
   * Cria um novo registro de foto (front-end já fez o upload ao Supabase).
   * Limita a 6 fotos.
   */
  async upload(userId: string, dto: CreateUserPhotoDto) {
    const existing = await this.prisma.userPhoto.findMany({
      where: { user_id: userId },
      orderBy: { position: 'asc' },
    });

    if (existing.length >= 6) {
      throw new BadRequestException('Você já atingiu o limite de 6 fotos.');
    }

    const usedPositions = new Set(existing.map((p) => p.position));
    const nextPosition =
      [...Array(6).keys()]
        .map((i) => i + 1)
        .find((pos) => !usedPositions.has(pos)) ?? 6;

    return this.prisma.userPhoto.create({
      data: {
        user_id: userId,
        url: dto.url,
        position: nextPosition,
      },
    });
  }

  /**
   * Atualiza posição de uma foto existente.
   */
  async update(userId: string, id: string, dto: UpdateUserPhotoDto) {
    const photo = await this.prisma.userPhoto.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Foto não encontrada.');
    if (photo.user_id !== userId) throw new ForbiddenException();

    if (dto.position != null) {
      if (dto.position < 1 || dto.position > 6) {
        throw new BadRequestException('Position must be between 1 and 6');
      }
      const conflict = await this.prisma.userPhoto.findFirst({
        where: {
          user_id: userId,
          position: dto.position,
          NOT: { id },
        },
      });
      if (conflict) {
        throw new BadRequestException('Position already in use');
      }
    }

    return this.prisma.userPhoto.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Remove a foto tanto do storage quanto do banco e reordena posições.
   */
  async remove(userId: string, id: string) {
    const photo = await this.prisma.userPhoto.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Foto não encontrada.');
    if (photo.user_id !== userId) throw new ForbiddenException();

    // Deleta do Supabase Storage
    const filename = path.basename(new URL(photo.url).pathname);
    const filePath = `${userId}/${filename}`;
    const { error: removeError } = await this.supabase.storage
      .from('user-photos')
      .remove([filePath]);
    if (removeError) {
      console.error('Erro ao deletar foto do storage:', removeError);
      throw removeError;
    }

    // Remove do DB
    await this.prisma.userPhoto.delete({ where: { id } });

    // Reordena posições restantes
    const photos = await this.prisma.userPhoto.findMany({
      where: { user_id: userId },
      orderBy: { position: 'asc' },
    });
    for (let i = 0; i < photos.length; i++) {
      await this.prisma.userPhoto.update({
        where: { id: photos[i].id },
        data: { position: i + 1 },
      });
    }
  }
}
