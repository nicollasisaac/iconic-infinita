// src/event-participation/event-participation.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventParticipationDto } from './dtos/create-event-participation.dto';
import { UpdateEventParticipationDto } from './dtos/update-event-participation.dto';
import { Role } from '@prisma/client';

@Injectable()
export class EventParticipationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra imediatamente a participação, usando lógica atômica
   * sem fila de processamento.
   */
  async create(userId: string, dto: CreateEventParticipationDto) {
    return this.registerLogic(userId, dto.event_id);
  }

  /**
   * Lógica transacional de inscrição:
   * - Verifica existência de evento e usuário
   * - Garante vagas disponíveis
   * - Impede duplicidade e respeita cancelamentos anteriores
   * - Atualiza contador de participantes de forma atômica
   */
  private async registerLogic(userId: string, eventId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1) busca evento
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException('Evento não encontrado');

      // 2) busca usuário
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Usuário não encontrado');

      // 3) exclusividade
      if (event.is_exclusive && !user.is_iconic) {
        throw new ForbiddenException(
          'Apenas usuários ICÔNIC podem participar deste evento',
        );
      }

      // 4) verifica participações anteriores
      const existing = await tx.eventParticipation.findFirst({
        where: { user_id: userId, event_id: eventId },
      });

      if (existing?.status === 'confirmed') {
        throw new ConflictException('Você já está inscrito neste evento');
      }

      // 5) reativação de inscrição cancelada
      if (existing?.status === 'cancelled') {
        if (event.current_attendees >= event.max_attendees) {
          throw new ForbiddenException('Ingressos esgotados');
        }
        await tx.event.update({
          where: { id: eventId },
          data: { current_attendees: { increment: 1 } },
        });
        return tx.eventParticipation.update({
          where: { id: existing.id },
          data: { status: 'confirmed', cancelled_at: null },
        });
      }

      // 6) nova inscrição
      if (event.current_attendees >= event.max_attendees) {
        throw new ForbiddenException('Ingressos esgotados');
      }
      await tx.event.update({
        where: { id: eventId },
        data: { current_attendees: { increment: 1 } },
      });
      return tx.eventParticipation.create({
        data: {
          user_id: userId,
          event_id: eventId,
          status: 'confirmed',
        },
      });
    });
  }

  findAll() {
    return this.prisma.eventParticipation.findMany({
      include: { user: true, event: true },
    });
  }

  findById(id: string) {
    return this.prisma.eventParticipation.findUnique({
      where: { id },
      include: { user: true, event: true },
    });
  }

  /**
   * Cancela participação decrementando o contador de vagas.
   */
  async update(id: string, dto: UpdateEventParticipationDto) {
    if (dto.status === 'cancelled') {
      const participation = await this.prisma.eventParticipation.findUnique({
        where: { id },
      });
      if (!participation) {
        throw new NotFoundException('Participação não encontrada');
      }
      await this.prisma.$transaction([
        this.prisma.event.update({
          where: { id: participation.event_id },
          data: { current_attendees: { decrement: 1 } },
        }),
        this.prisma.eventParticipation.update({
          where: { id },
          data: { status: 'cancelled', cancelled_at: new Date() },
        }),
      ]);
      return { message: 'Participação cancelada' };
    }
    // outros updates simples
    return this.prisma.eventParticipation.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.eventParticipation.delete({ where: { id } });
  }

  /**
   * Retorna usuários confirmados, aplicando regras de visibilidade:
   * só permite acesso se o solicitante for admin ou já estiver confirmado.
   */
  async findConfirmedUsersWithProfiles(
    eventId: string,
    requesterId: string,
    requesterRole: Role,
  ) {
    const participations = await this.prisma.eventParticipation.findMany({
      where: { event_id: eventId, status: 'confirmed' },
      include: { user: true },
    });

    const isAdmin = requesterRole === 'admin';
    const isRequesterConfirmed = participations.some(
      (p) => p.user_id === requesterId,
    );
    if (!isRequesterConfirmed && !isAdmin) {
      throw new ForbiddenException(
        'Você precisa estar confirmado para ver os perfis',
      );
    }

    return participations.map(({ user }) => {
      const isPublic = user.show_public_profile;
      const isIconicVisible =
        user.show_profile_to_iconics && requesterRole === 'iconic';

      if (isAdmin || isPublic || isIconicVisible || user.id === requesterId) {
        return {
          id: user.id,
          full_name: user.full_name,
          nickname: user.nickname,
          is_iconic: user.is_iconic,
          profile_picture_url: user.profile_picture_url,
        };
      }
      return {
        id: user.id,
        nickname: 'Perfil Privado',
        is_iconic: user.is_iconic,
        profile_picture_url: null,
      };
    });
  }
}
