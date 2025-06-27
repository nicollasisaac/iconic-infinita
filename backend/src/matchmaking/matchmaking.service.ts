import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchmakingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Gera grupos aleatórios; o último grupo pode ficar menor */
  async generateGroups(
    liveEventId: string,
    groupSize: number,
    ownerId: string,
  ) {
    if (groupSize < 2) throw new BadRequestException('groupSize deve ser ≥ 2');

    /* ----------------------------------- info do live-event + owner */
    const le = await this.prisma.liveEvent.findUnique({
      where: { id: liveEventId },
      select: {
        require_qr: true,
        event: { select: { owner_id: true } },
      },
    });
    if (!le) throw new NotFoundException('LiveEvent não encontrado');
    if (le.event.owner_id !== ownerId)
      throw new ForbiddenException('Só o owner pode iniciar o match');

    /* ----------------------------------- participantes elegíveis  */
    const whereCheck = le.require_qr
      ? { event_id: le.event.owner_id, checkin_time: { not: new Date(0) } }
      : { event_id: le.event.owner_id };

    const participants = await this.prisma.eventCheckin.findMany({
      where: whereCheck,
      select: { user_id: true },
    });
    if (participants.length < 2)
      throw new ConflictException('Participantes insuficientes');

    /* ----------------------------------- embaralha IDs aleatoriamente */
    const ids = participants.map((p) => p.user_id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    /* ----------------------------------- monta grupos
       Ex.: groupSize 2, ids = [A,B,C,D,E] → [[A,B],[C,D],[E]]          */
    const groups: string[][] = [];
    while (ids.length >= groupSize) groups.push(ids.splice(0, groupSize));
    if (ids.length) groups.push([...ids]); // resto (grupo menor)

    /* ----------------------------------- grava em transação */
    await this.prisma.$transaction(async (tx) => {
      for (let idx = 0; idx < groups.length; idx++) {
        const g = await tx.liveMatchGroup.create({
          data: {
            live_event_id: liveEventId,
            duration_sec: 0,
            state_live_event: idx,
            group_number: idx + 1,
          },
        });

        await tx.liveMatchParticipant.createMany({
          data: groups[idx].map((uid) => ({
            match_group_id: g.id,
            user_id: uid,
          })),
        });
      }

      await tx.liveEvent.update({
        where: { id: liveEventId },
        data: { is_active: true, started_at: new Date() },
      });
    });

    return { message: 'Grupos gerados com sucesso', groups: groups.length };
  }
}
