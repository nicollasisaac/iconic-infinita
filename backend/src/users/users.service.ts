// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException, // Import InternalServerErrorException
  Logger, // Import Logger
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Role } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
// Import Prisma error type for specific handling
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name); // Initialize logger
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  constructor(private prisma: PrismaService) {}

  async findOrCreate(data: {
    uid: string; // Assuming uid might be the wallet address or Supabase ID
    email: string;
    full_name: string;
    profile_picture_url?: string;
    phone_number?: string;
    date_of_birth?: Date;
    // Add wallet_address if it's separate from uid/id
    wallet_address?: string;
  }) {
    const { uid, email, full_name, profile_picture_url, phone_number, date_of_birth, wallet_address } = data;

    // Determine the primary key/unique identifier logic
    // Assuming the primary 'id' in your Prisma schema is the unique identifier (e.g., UUID or wallet address)
    let user = await this.prisma.user.findUnique({ where: { id: uid } });

    if (!user) {
      this.logger.log(`Criando novo usuário para ID: ${uid}`);
      try {
        user = await this.prisma.user.create({
          data: {
            id: uid, // Explicitly set ID if it's the wallet address/uid
            email,
            full_name,
            profile_picture_url,
            phone_number,
            role: Role.user,
            nickname: email.split('@')[0],
            date_of_birth,
            // wallet_address: wallet_address, // Uncomment and use if your schema has this field
          },
        });
        this.logger.log(`Novo usuário criado com ID: ${user.id}`);
      } catch (error) {
        this.logger.error(`Erro ao criar usuário ${uid}:`, error);
        // Check for unique constraint violation if email should also be unique
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            this.logger.warn(`Tentativa de criar usuário com ID/Email duplicado: ${uid}/${email}`);
            // Optionally, find the existing user by email if creation failed due to duplicate ID but email exists
            const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
            if (existingByEmail) return existingByEmail; // Return existing user found by email
            throw new InternalServerErrorException('Usuário com este ID ou Email já existe.');
        }
        throw new InternalServerErrorException('Não foi possível criar o usuário.');
      }
    } else {
       this.logger.log(`Usuário encontrado com ID: ${uid}`);
       // Optional: Update wallet address if user exists but address wasn't stored or changed
       // if (wallet_address && user.wallet_address !== wallet_address) {
       //   this.logger.log(`Atualizando endereço da carteira para usuário ${uid}`);
       //   await this.prisma.user.update({ where: { id: user.id }, data: { wallet_address } });
       // }
    }
    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
        this.logger.warn(`Usuário não encontrado pelo ID: ${id}`);
        throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  // Add method to find by wallet address if needed and if schema supports it
  // async findByWalletAddress(walletAddress: string) {
  //   const user = await this.prisma.user.findUnique({ where: { wallet_address: walletAddress } });
  //   if (!user) {
  //     this.logger.warn(`Usuário não encontrado pelo endereço da carteira: ${walletAddress}`);
  //     throw new NotFoundException('Usuário não encontrado com este endereço de carteira.');
  //   }
  //   return user;
  // }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async update(id: string, dto: UpdateUserDto) {
    const data: any = { ...dto };
    if (dto.date_of_birth) {
      data.date_of_birth = new Date(dto.date_of_birth);
    }
    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        this.logger.warn(`Tentativa de atualizar usuário inexistente: ${id}`);
        throw new NotFoundException(`Usuário com ID '${id}' não encontrado para atualização.`);
      }
      this.logger.error(`Erro ao atualizar usuário ${id}:`, error);
      throw new InternalServerErrorException('Erro ao atualizar usuário.');
    }
  }

  async remove(id: string) {
    try {
        return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            this.logger.warn(`Tentativa de remover usuário inexistente: ${id}`);
            throw new NotFoundException(`Usuário com ID '${id}' não encontrado para remoção.`);
        }
        this.logger.error(`Erro ao remover usuário ${id}:`, error);
        throw new InternalServerErrorException('Erro ao remover usuário.');
    }
  }

  async removeWithPhotos(id: string) {
    const photos = await this.prisma.userPhoto.findMany({
      where: { user_id: id },
    });
    const paths = photos.map((p) => `${id}/${p.url.split('/').pop()}`);
    if (paths.length) {
      this.logger.log(`Removendo ${paths.length} fotos do Supabase para usuário ${id}`);
      const { error } = await this.supabase.storage
        .from('user-photos')
        .remove(paths);
      if (error) {
          this.logger.error(`Erro ao remover fotos do Supabase para usuário ${id}:`, error);
          throw new InternalServerErrorException('Erro ao remover fotos do armazenamento.');
      }
    }
    this.logger.log(`Removendo registros de fotos e participações do DB para usuário ${id}`);
    // Use transaction for atomicity if needed
    await this.prisma.userPhoto.deleteMany({ where: { user_id: id } });
    await this.prisma.eventParticipation.deleteMany({
      where: { user_id: id },
    });
    return this.remove(id); // Reuse the remove method with its error handling
  }

  async promoteToIconic(userId: string) { // Renamed parameter for clarity
    this.logger.log(`Tentando promover usuário a ICONIC: ${userId}`);
    try {
      const user = await this.prisma.user.update({
        where: { id: userId }, // Assuming 'id' is the correct identifier (e.g., wallet address or internal UUID)
        data: {
          role: Role.iconic,
          is_iconic: true,
          // Set expiry for 30 days from now
          iconic_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      this.logger.log(`Usuário ${userId} promovido a ICONIC com sucesso.`);
      return user;
    } catch (error) {
      // Check if it's Prisma's 'Record to update not found.' error
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        this.logger.error(`Erro ao promover: Usuário com ID '${userId}' não encontrado.`);
        throw new NotFoundException(`Usuário com ID '${userId}' não encontrado para promover a Iconic.`);
      }
      // Log other errors
      this.logger.error(`Erro inesperado ao promover usuário ${userId} a ICONIC:`, error);
      throw new InternalServerErrorException('Erro interno ao tentar promover usuário a Iconic.');
    }
  }

  async promoteToScanner(id: string) {
     try {
        return await this.prisma.user.update({
            where: { id },
            data: { role: Role.scanner },
        });
     } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new NotFoundException(`Usuário com ID '${id}' não encontrado para promover a Scanner.`);
        }
        this.logger.error(`Erro ao promover usuário ${id} a Scanner:`, error);
        throw new InternalServerErrorException('Erro interno ao tentar promover usuário a Scanner.');
     }
  }

  async demoteScanner(id: string) {
    try {
        return await this.prisma.user.update({
            where: { id },
            data: { role: Role.user },
        });
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new NotFoundException(`Usuário com ID '${id}' não encontrado para rebaixar de Scanner.`);
        }
        this.logger.error(`Erro ao rebaixar usuário ${id} de Scanner:`, error);
        throw new InternalServerErrorException('Erro interno ao tentar rebaixar usuário de Scanner.');
    }
  }

  /**
   * Lista usuários ICONIC válidos em ordem aleatória.
   */
  async findIconicUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        is_iconic: true,
        iconic_expires_at: { gt: new Date() },
      },
    });
    // Simple shuffle
    return users.sort(() => Math.random() - 0.5);
  }

  /**
   * Lista usuários com perfil público em ordem aleatória.
   */
  async findPublicUsers() {
    const users = await this.prisma.user.findMany({
      where: { show_public_profile: true },
    });
    return users.sort(() => Math.random() - 0.5);
  }

  /**
   * Retorna perfil público (com fotos) respeitando visibilidade.
   */
  async getPublicProfileWithPhotos(
    userId: string,
    requesterId: string | null = null,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        photos: {
          orderBy: { position: 'asc' },
          select: { id: true, url: true, position: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // Check visibility rules
    if (!user.show_public_profile) {
      if (!requesterId) throw new ForbiddenException('Private profile');
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
      });
      // Allow access if requester is the user themselves, or if profile is shown to iconics and requester is iconic
      if (
        requesterId !== userId &&
        (!requester || (!user.show_profile_to_iconics || !requester.is_iconic))
      ) {
        throw new ForbiddenException('Private profile');
      }
    }

    // Return public profile data
    return {
      id: user.id,
      full_name: user.full_name,
      nickname: user.nickname,
      bio: user.bio,
      instagram: user.instagram,
      profile_picture_url: user.profile_picture_url,
      is_iconic: user.is_iconic,
      date_of_birth: user.date_of_birth,
      photos: user.photos,
    };
  }

  async updateProfilePicture(userId: string, url: string) {
    try {
        return await this.prisma.user.update({
            where: { id: userId },
            data: { profile_picture_url: url },
        });
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new NotFoundException(`Usuário com ID '${userId}' não encontrado para atualizar foto de perfil.`);
        }
        this.logger.error(`Erro ao atualizar foto de perfil para usuário ${userId}:`, error);
        throw new InternalServerErrorException('Erro interno ao tentar atualizar foto de perfil.');
    }
  }

  async findPublicIconicUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        is_iconic: true,
        show_public_profile: true,
        OR: [
          { iconic_expires_at: null },
          { iconic_expires_at: { gt: new Date() } },
        ],
      },
      select: {
        id: true,
        full_name: true,
        nickname: true,
        profile_picture_url: true,
        is_iconic: true,
      },
    });

    // shuffle for display
    return users.sort(() => Math.random() - 0.5);
  }
}

