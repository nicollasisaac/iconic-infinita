// src/polls/polls.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePollDto } from './dtos/create-poll.dto';

@Injectable()
export class PollsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    liveEventId: string,
    dto: CreatePollDto,
    ownerId: string,
  ) {
    const le = await this.prisma.liveEvent.findUnique({
      where: { id: liveEventId },
      select: { event: { select: { owner_id: true } } },
    });
    if (!le) throw new NotFoundException('LiveEvent not found');
    if (le.event.owner_id !== ownerId) {
      throw new ForbiddenException('Only owner can create polls');
    }
    const poll = await this.prisma.livePoll.create({
      data: {
        live_event_id: liveEventId,
        question: dto.question,
        duration_sec: dto.durationSec,
        state_live_event: dto.order,
      },
    });
    await Promise.all(
      dto.options.map(text =>
        this.prisma.livePollOption.create({
          data: { poll_id: poll.id, text },
        }),
      ),
    );
    return poll;
  }

  async vote(pollId: string, optionId: string, userId: string) {
    // relies on unique constraint to prevent double votes
    try {
      return await this.prisma.livePollResponse.create({
        data: { poll_id: pollId, option_id: optionId, user_id: userId },
      });
    } catch {
      throw new ForbiddenException('You have already voted');
    }
  }
}
