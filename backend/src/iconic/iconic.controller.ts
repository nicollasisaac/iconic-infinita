// src/iconic/iconic.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IconicService } from './iconic.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('ICONIC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iconic')
export class IconicController {
  constructor(private readonly iconicService: IconicService) {}

  @Get('members')
  @Roles(Role.iconic)
  @ApiOperation({ summary: 'Lista de membros ICONIC (random)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de membros ICONIC randomizada',
  })
  async getIconicMembers() {
    return this.iconicService.getRandomIconicMembers();
  }

  @Get('chat')
  @Roles(Role.iconic)
  @ApiOperation({ summary: 'Mensagens recentes do ICONIC Chat' })
  @ApiResponse({
    status: 200,
    description: 'Lista das últimas mensagens do chat',
  })
  async getIconicChatMessages() {
    return this.iconicService.getIconicChatMessages();
  }

  @Post('chat')
  @Roles(Role.iconic)
  @ApiOperation({ summary: 'Posta mensagem no ICONIC Chat' })
  @ApiBody({
    schema: { example: { message: 'Fala galera, alguém vai no drop?' } },
  })
  @ApiResponse({ status: 201, description: 'Mensagem publicada' })
  @HttpCode(HttpStatus.CREATED)
  async postIconicChatMessage(@Req() req, @Body() body: { message: string }) {
    return this.iconicService.createIconicChatMessage(
      req.user.sub,
      body.message,
    );
  }
}
