// src/events/events.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dtos/create-event.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { Role } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ───────────────────────────────────────────────
   *  CREATE
   * ─────────────────────────────────────────────── */
  async create(dto: CreateEventDto, ownerId: string) {
    const start = this.toDate(dto.start_at, 'start_at');
    const end = dto.end_at ? this.toDate(dto.end_at, 'end_at') : null;
    if (end && end <= start) {
      throw new BadRequestException('end_at must be after start_at');
    }

    return this.prisma.event.create({
      data: {
        owner_id: ownerId,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        lat: dto.lat ?? null, // ← NOVO
        lon: dto.lon ?? null, // ← NOVO
        start_at: start,
        end_at: end,
        category: dto.category,
        is_exclusive: dto.is_exclusive,
        is_public: dto.is_public,
        max_attendees: dto.max_attendees,
        current_attendees: 0,
        partner_name: dto.partner_name,
        partner_logo_url: dto.partner_logo_url,
        cover_image_url: dto.cover_image_url,
      },
    });
  }

  /* ───────────────────────────────────────────────
   *  OWNER-ONLY LIST
   * ─────────────────────────────────────────────── */
  findOwned(ownerId: string) {
    return this.prisma.event.findMany({
      where: { owner_id: ownerId },
      orderBy: { start_at: 'desc' },
    });
  }

  /* ───────────────────────────────────────────────
   *  BASIC LISTS
   * ─────────────────────────────────────────────── */
  findAllPublic() {
    return this.prisma.event.findMany({ where: { is_public: true } });
  }
  findAllExclusive() {
    return this.prisma.event.findMany({ where: { is_exclusive: true } });
  }

  /* ───────────────────────────────────────────────
   *  SINGLE EVENT
   * ─────────────────────────────────────────────── */
  async findById(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  /* ───────────────────────────────────────────────
   *  UPDATE / DELETE
   * ─────────────────────────────────────────────── */
  async update(id: string, dto: UpdateEventDto, userId: string, role: Role) {
    const ev = await this.prisma.event.findUnique({
      where: { id },
      select: { owner_id: true, start_at: true },
    });
    if (!ev) throw new NotFoundException('Event not found');
    if (ev.owner_id !== userId && role !== Role.admin) {
      throw new ForbiddenException('Only owner or admin can update');
    }

    const data: any = { ...dto };
    if (dto.start_at) data.start_at = this.toDate(dto.start_at, 'start_at');
    if (dto.end_at) data.end_at = this.toDate(dto.end_at, 'end_at');
    if (data.start_at && data.end_at && data.end_at <= data.start_at) {
      throw new BadRequestException('end_at must be after start_at');
    }

    // garantir nulls explícitos caso sejam removidos
    if (dto.lat === undefined) data.lat = undefined;
    if (dto.lon === undefined) data.lon = undefined;

    return this.prisma.event.update({ where: { id }, data });
  }

  async remove(id: string, userId: string, role: Role) {
    const ev = await this.prisma.event.findUnique({
      where: { id },
      select: { owner_id: true },
    });
    if (!ev) throw new NotFoundException('Event not found');
    if (ev.owner_id !== userId && role !== Role.admin) {
      throw new ForbiddenException('Only owner or admin can delete');
    }
    return this.prisma.event.delete({ where: { id } });
  }

  /* ───────────────────────────────────────────────
   *  SINGLE EVENT  (+ participation + live flag)
   * ─────────────────────────────────────────────── */
  async findByIdWithParticipation(eventId: string, userId: string) {
    // 1) Evento + participação
    const event = await this.findById(eventId);
    const part = await this.prisma.eventParticipation.findFirst({
      where: { event_id: eventId, user_id: userId, status: 'confirmed' },
      select: { id: true },
    });

    // 2) Existe live event?
    const liveCount = await this.prisma.liveEvent.count({
      where: { event_id: eventId },
    });
    const has_live_events = liveCount > 0;

    // 3) Payload
    return {
      ...event,
      is_participating: !!part,
      participation_id: part?.id,
      has_live_events,
    };
  }

  async findParticipating(userId: string) {
    const parts = await this.prisma.eventParticipation.findMany({
      where: { user_id: userId, status: 'confirmed' },
      select: { event_id: true, id: true },
    });
    const map = new Map(parts.map((p) => [p.event_id, p.id]));

    const events = await this.prisma.event.findMany({
      where: { id: { in: [...map.keys()] } },
    });

    return events.map((e) => ({
      ...e,
      is_participating: true,
      participation_id: map.get(e.id),
    }));
  }

  /* ───────────────────────────────────────────────
   *  RECOMMENDED (+live +progress)
   * ─────────────────────────────────────────────── */
  async findRecommendedWithParticipation(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const base = user.is_iconic ? {} : { is_public: true };
    const events = await this.prisma.event.findMany({ where: base });

    const parts = await this.prisma.eventParticipation.findMany({
      where: {
        user_id: userId,
        status: 'confirmed',
        event_id: { in: events.map((e) => e.id) },
      },
      select: { event_id: true, id: true },
    });
    const partMap = new Map(parts.map((p) => [p.event_id, p.id]));

    const liveCounts = await this.prisma.liveEvent.groupBy({
      by: ['event_id'],
      _count: { event_id: true },
      where: { event_id: { in: events.map((e) => e.id) } },
    });
    const liveMap = new Map(
      liveCounts.map((c) => [c.event_id, c._count.event_id]),
    );

    const now = new Date();

    return events.map((e) => ({
      ...e,
      is_participating: partMap.has(e.id),
      participation_id: partMap.get(e.id),
      has_live_events: (liveMap.get(e.id) ?? 0) > 0,
      in_progress: e.start_at <= now && (!e.end_at || now <= e.end_at),
    }));
  }

  /* ───────────────────────────────────────────────
   *  UTIL
   * ─────────────────────────────────────────────── */
  private toDate(value: string, field: string): Date {
    const d = new Date(value);
    if (isNaN(d.getTime())) throw new BadRequestException(`Invalid ${field}`);
    return d;
  }
}
