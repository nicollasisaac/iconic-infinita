import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventCheckinService } from '../event-checkins/event-checkin.service';
import { CreateLiveEventDto } from './dtos/create-live-event.dto';
import { Role } from '@prisma/client';

/**
 * Regras-chave
 * • Apenas **owner** (ou `admin`) cria / inicia / encerra dinâmicas
 * • Quando `require_qr` = true → só quem fez check-in participa/visualiza
 * • Instant-Match forma grupos aleatórios respeitando o `groupSize`
 *   – se houver sobra (n.º ímpar) o último grupo recebe 1 ou 2 extras
 */
@Injectable()
export class LiveEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checkinService: EventCheckinService,
  ) {}

  /* ─────────────────────────────── CRUD BÁSICO ─────────────────────────────── */
  async create(eventId: string, dto: CreateLiveEventDto, ownerId: string) {
    await this.assertEventOwner(eventId, ownerId);

    return this.prisma.liveEvent.create({
      data: {
        event_id: eventId,
        title: dto.title,
        require_qr: dto.require_qr ?? false,
      },
    });
  }

  async findAll(eventId: string, userId: string, role: Role) {
    await this.assertParticipantOrOwner(eventId, userId, role);
    return this.prisma.liveEvent.findMany({
      where: { event_id: eventId },
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const le = await this.getById(id);
    await this.assertParticipantOrOwner(
      le.event_id,
      userId,
      role,
      le.require_qr,
    );
    return le;
  }

  async start(id: string, userId: string) {
    const le = await this.getById(id);
    await this.assertEventOwner(le.event_id, userId);
    if (le.is_active) throw new ConflictException('LiveEvent already started');

    return this.prisma.liveEvent.update({
      where: { id },
      data: { is_active: true, started_at: new Date() },
    });
  }

  async end(id: string, userId: string) {
    const le = await this.getById(id);
    await this.assertEventOwner(le.event_id, userId);
    if (!le.is_active) throw new ConflictException('LiveEvent not active');

    return this.prisma.liveEvent.update({
      where: { id },
      data: { is_active: false, ended_at: new Date() },
    });
  }

  /* ─────────────────────────────── MATCHMAKING ─────────────────────────────── */
  async startMatch(liveEventId: string, groupSize: number, ownerId: string) {
    if (groupSize < 2) throw new ConflictException('Tamanho mínimo: 2');

    const le = await this.getById(liveEventId);
    await this.assertEventOwner(le.event_id, ownerId);

    /* ------------------- participantes elegíveis ------------------- */
    let eligibleIds: string[];

    if (le.require_qr) {
      /* só quem já bipou o QR */
      const checkins = await this.prisma.eventCheckin.findMany({
        where: {
          event_id: le.event_id,
          checkin_time: { not: new Date(0) },
        },
        select: { user_id: true },
      });
      eligibleIds = checkins.map((c) => c.user_id);
    } else {
      /* qualquer RSVP confirmado */
      const parts = await this.prisma.eventParticipation.findMany({
        where: {
          event_id: le.event_id,
          status: 'confirmed',
        },
        select: { user_id: true },
      });
      eligibleIds = parts.map((p) => p.user_id);
    }

    if (eligibleIds.length < groupSize) {
      throw new ConflictException('Não há participantes suficientes');
    }

    /* ------------------- embaralha ------------------- */
    for (let i = eligibleIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligibleIds[i], eligibleIds[j]] = [eligibleIds[j], eligibleIds[i]];
    }

    /* ------------------- cria grupos ------------------ */
    const groups: string[][] = [];
    while (eligibleIds.length) groups.push(eligibleIds.splice(0, groupSize));

    /* se o último grupo ficou com só 1 pessoa, distribui-o entre os anteriores */
    if (groups.length > 1 && groups.at(-1)!.length === 1) {
      const lone = groups.pop()![0];
      groups.forEach((g, idx) => {
        if (idx < groups.length && g.length < groupSize) {
          g.push(lone);
        }
      });
    }

    /* ------------------- persiste em TX --------------- */
    await this.prisma.$transaction(async (tx) => {
      for (let idx = 0; idx < groups.length; idx++) {
        const mg = await tx.liveMatchGroup.create({
          data: {
            live_event_id: liveEventId,
            duration_sec: 0,
            state_live_event: idx,
            group_number: idx + 1,
          },
        });

        await tx.liveMatchParticipant.createMany({
          data: groups[idx].map((uid) => ({
            match_group_id: mg.id,
            user_id: uid,
          })),
        });
      }

      await tx.liveEvent.update({
        where: { id: liveEventId },
        data: { is_active: true, started_at: new Date() },
      });
    });

    return { message: 'Pareamento concluído!' };
  }

  async getMyMatch(liveEventId: string, userId: string) {
    const le = await this.getById(liveEventId);
    if (!le.is_active) throw new ConflictException('LiveEvent não está ativo');

    const part = await this.prisma.liveMatchParticipant.findFirst({
      where: { user_id: userId },
      select: { match_group_id: true },
    });
    if (!part) throw new NotFoundException('Você não está em nenhum grupo');

    const members = await this.prisma.liveMatchParticipant.findMany({
      where: { match_group_id: part.match_group_id },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            nickname: true,
            profile_picture_url: true,
            bio: true,
            is_iconic: true,
          },
        },
      },
    });

    /* devolve parceiros, excluindo o próprio user */
    return members.map((m) => m.user).filter((u) => u.id !== userId);
  }

  /* ─────────────────────────────── HELPERS ─────────────────────────────── */
  private async getById(id: string) {
    const le = await this.prisma.liveEvent.findUnique({ where: { id } });
    if (!le) throw new NotFoundException('LiveEvent not found');
    return le;
  }

  private async assertEventOwner(eventId: string, userId: string) {
    const ev = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { owner_id: true },
    });
    if (!ev) throw new NotFoundException('Event not found');
    if (ev.owner_id !== userId) {
      throw new ForbiddenException(
        'Apenas o criador do evento pode realizar esta ação',
      );
    }
  }

  private async assertParticipantOrOwner(
    eventId: string,
    userId: string,
    userRole: Role,
    requireQr = false,
  ) {
    const ev = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { owner_id: true },
    });
    if (!ev) throw new NotFoundException('Event not found');
    if (ev.owner_id === userId || userRole === Role.admin) return;

    const part = await this.prisma.eventParticipation.findFirst({
      where: { event_id: eventId, user_id: userId, status: 'confirmed' },
    });
    if (!part) {
      throw new ForbiddenException('Necessário estar inscrito no evento');
    }

    if (requireQr) {
      const { checkedIn } = await this.checkinService.isUserCheckedIn(
        userId,
        eventId,
      );
      if (!checkedIn) {
        throw new ForbiddenException('Faça check-in para acessar a dinâmica');
      }
    }
  }
}
