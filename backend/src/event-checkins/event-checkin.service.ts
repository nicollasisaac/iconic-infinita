// src/event-checkins/event-checkin.service.ts

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { differenceInSeconds } from 'date-fns';
import { Role } from '@prisma/client';

@Injectable()
export class EventCheckinService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const participation = await this.prisma.eventParticipation.findFirst({
      where: { user_id: userId, event_id: eventId, status: 'confirmed' },
    });
    if (!participation)
      throw new ForbiddenException('You are not confirmed for this event');

    const alreadyCheckedIn = await this.prisma.eventCheckin.findFirst({
      where: {
        user_id: userId,
        event_id: eventId,
        NOT: { checkin_time: new Date(0) },
      },
    });
    if (alreadyCheckedIn)
      throw new ConflictException('You have already checked in');

    const lastPending = await this.prisma.eventCheckin.findFirst({
      where: {
        user_id: userId,
        event_id: eventId,
        checkin_time: new Date(0),
      },
      orderBy: { created_at: 'desc' },
    });
    if (lastPending) {
      const seconds = differenceInSeconds(new Date(), lastPending.created_at);
      if (seconds < 15) {
        throw new ConflictException(
          'Please wait 15 seconds before generating a new QR code',
        );
      }
    }

    const checkin = await this.prisma.eventCheckin.create({
      data: {
        user_id: userId,
        event_id: eventId,
        qr_token: uuidv4(),
        scanned_by_admin_id: null,
        checkin_time: new Date(0),
      },
    });

    return {
      ...checkin,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?data=${checkin.qr_token}&size=200x200`,
    };
  }

  async scan(qr_token: string, scannerId: string) {
    const checkin = await this.prisma.eventCheckin.findUnique({
      where: { qr_token },
    });
    if (!checkin) throw new NotFoundException('QR code not found');

    if (checkin.checkin_time.getTime() !== new Date(0).getTime()) {
      throw new ConflictException('This QR code has already been used');
    }

    const secondsSinceCreated = differenceInSeconds(
      new Date(),
      checkin.created_at,
    );
    if (secondsSinceCreated > 60) {
      throw new ForbiddenException('QR code expired');
    }

    return this.prisma.eventCheckin.update({
      where: { id: checkin.id },
      data: {
        checkin_time: new Date(),
        scanned_by_admin_id: scannerId,
      },
      include: {
        user: {
          select: {
            full_name: true,
            nickname: true,
            email: true,
            date_of_birth: true,
            is_iconic: true,
          },
        },
      },
    });
  }

  async findByEvent(eventId: string) {
    return this.prisma.eventCheckin.findMany({
      where: { event_id: eventId },
      include: { user: true, scanned_by: true },
    });
  }

  async findWithScannerInfo(eventId: string) {
    return this.prisma.eventCheckin.findMany({
      where: {
        event_id: eventId,
        checkin_time: { not: new Date(0) },
      },
      include: { user: true, scanned_by: true },
    });
  }

  async getCheckedInUsers(
    eventId: string,
    requesterId: string,
    requesterRole: Role,
  ) {
    return this.findCheckedInUsersWithProfiles(
      eventId,
      requesterId,
      requesterRole,
    );
  }

  async isUserCheckedIn(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');

    const checkin = await this.prisma.eventCheckin.findFirst({
      where: {
        user_id: userId,
        event_id: eventId,
        checkin_time: { not: new Date(0) },
      },
    });

    return { checkedIn: Boolean(checkin) };
  }

  async delete(checkinId: string) {
    const checkin = await this.prisma.eventCheckin.findUnique({
      where: { id: checkinId },
    });
    if (!checkin) throw new NotFoundException('Check-in not found');
    return this.prisma.eventCheckin.delete({ where: { id: checkinId } });
  }

  async manualCheckinByEmail(
    eventId: string,
    email: string,
    scannerId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const participation = await this.prisma.eventParticipation.findFirst({
      where: { event_id: eventId, user_id: user.id, status: 'confirmed' },
    });
    if (!participation)
      throw new ForbiddenException('User not confirmed for this event');

    return this.prisma.eventCheckin.create({
      data: {
        user_id: user.id,
        event_id: eventId,
        checkin_time: new Date(),
        qr_token: uuidv4(),
        scanned_by_admin_id: scannerId,
      },
    });
  }

  async findCheckedInUsersWithProfiles(
    eventId: string,
    requesterId: string,
    requesterRole: Role,
  ) {
    const checkins = await this.prisma.eventCheckin.findMany({
      where: {
        event_id: eventId,
        checkin_time: { not: new Date(0) },
      },
      include: { user: true },
    });

    const isAdmin = requesterRole === 'admin';
    const requesterIsCheckedIn = checkins.some(
      (c) => c.user_id === requesterId,
    );
    if (!requesterIsCheckedIn && !isAdmin) {
      throw new ForbiddenException(
        'Você precisa ter feito check-in para ver os participantes',
      );
    }

    return checkins.map(({ user }) => {
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
        nickname: 'Perfil fechado',
        is_iconic: user.is_iconic,
        profile_picture_url: null,
      };
    });
  }
}
