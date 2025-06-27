// src/users/users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Options,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PromoteIconicGuard } from './promote-iconic.guard';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UpdateProfilePictureDto } from './dtos/update-profile-picture.dto';
import { Role } from '@prisma/client';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ------------------------------------------------------------------
  // CORS pre-flight (dev only)
  // ------------------------------------------------------------------
  @Options('*')
  @Header('Access-Control-Allow-Origin', 'http://localhost:5173')
  @Header('Access-Control-Allow-Credentials', 'true')
  @Header(
    'Access-Control-Allow-Methods',
    'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  )
  @Header(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, Authorization, X-Transaction-Id',
  )
  options() {}

  // ------------------------------------------------------------------
  // PUBLIC: list ICONIC members with public profile
  // ------------------------------------------------------------------
  @Get('iconic')
  @ApiOperation({ summary: 'List public ICONIC members' })
  async listPublicIconics() {
    return this.usersService.findPublicIconicUsers();
  }

  // ------------------------------------------------------------------
  // CURRENT USER PROFILE
  // ------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req) {
    return this.usersService.findById(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMe(@Req() req, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.sub, dto);
  }

  // ------------------------------------------------------------------
  // PROFILE PICTURE (static, comes before :id)
  // ------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Patch('profile-picture')
  @ApiOperation({ summary: 'Update authenticated user profile picture' })
  @ApiResponse({ status: 200, description: 'Profile picture updated' })
  async updateProfilePicture(@Req() req, @Body() dto: UpdateProfilePictureDto) {
    return this.usersService.updateProfilePicture(req.user.sub, dto.url);
  }

  // ------------------------------------------------------------------
  // LIST ALL (admin)
  // ------------------------------------------------------------------
  @Roles(Role.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  async findAll() {
    return this.usersService.findAll();
  }

  // ------------------------------------------------------------------
  // GET USER BY ID
  // ------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiParam({ name: 'id', description: 'User UUID or wallet address' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // ------------------------------------------------------------------
  // UPDATE USER BY ID (admin)
  // ------------------------------------------------------------------
  @Roles(Role.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @ApiParam({ name: 'id', description: 'User UUID or wallet address' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // ------------------------------------------------------------------
  // DELETE USER (admin)
  // ------------------------------------------------------------------
  @Roles(Role.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @HttpCode(204)
  @ApiParam({ name: 'id', description: 'User UUID or wallet address' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ------------------------------------------------------------------
  // PROMOTE TO ICONIC
  // ------------------------------------------------------------------
  @UseGuards(JwtAuthGuard, PromoteIconicGuard)
  @Post('iconic/:id')
  @ApiParam({ name: 'id', description: 'User UUID or wallet address' })
  async promoteToIconic(@Param('id') id: string) {
    return this.usersService.promoteToIconic(id);
  }

  // ------------------------------------------------------------------
  // PUBLIC PROFILE → **REMOVIDO o ParseUUIDPipe para aceitar IDs não-UUID**
  // ------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get('public/:id')
  @ApiParam({
    name: 'id',
    description: 'User UUID, wallet address ou outro identificador',
  })
  async getPublicProfile(@Param('id') id: string, @Req() req) {
    return this.usersService.getPublicProfileWithPhotos(id, req.user.sub);
  }
}
