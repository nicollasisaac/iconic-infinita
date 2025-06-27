import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserPhotosService } from './user-photo.service';
import { CreateUserPhotoDto } from './dtos/create-user-photo.dto';
import { UpdateUserPhotoDto } from './dtos/update-user-photo.dto';

@ApiTags('User Photos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user-photos')
export class UserPhotosController {
  constructor(private readonly service: UserPhotosService) {}

  @Get()
  @ApiOperation({ summary: 'List all photos of the authenticated user' })
  getAll(@Req() req) {
    return this.service.findAllByUser(req.user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Upload a new profile photo (max 6)' })
  upload(@Req() req, @Body() dto: CreateUserPhotoDto) {
    return this.service.upload(req.user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing profile photo' })
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateUserPhotoDto) {
    return this.service.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a profile photo and reorder' })
  remove(@Req() req, @Param('id') id: string) {
    return this.service.remove(req.user.sub, id);
  }
}