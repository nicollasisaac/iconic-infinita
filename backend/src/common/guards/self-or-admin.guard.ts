import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { PrismaService } from '../../prisma/prisma.service';
  import { Role } from '@prisma/client';
  
  @Injectable()
  export class SelfOrAdminGuard implements CanActivate {
    constructor(
      private reflector: Reflector,
      private prisma: PrismaService,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const paramId = request.params.id;
  
      // Log para debug
      console.log('🧑 Token user.sub:', user.sub);
      console.log('🔐 Token user.role:', user.role);
      console.log('🎯 Param ID:', paramId);
  
      if (user.role === Role.admin) {
        const targetUser = await this.prisma.user.findUnique({
          where: { id: paramId },
        });
  
        if (targetUser?.role === Role.admin && user.sub !== paramId) {
          throw new ForbiddenException('Admins não podem editar outros admins.');
        }
  
        return true;
      }
  
      if (user.sub === paramId) return true;
  
      throw new ForbiddenException('Você não tem permissão para alterar este usuário.');
    }
  }
  