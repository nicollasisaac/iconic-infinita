import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BnbService } from './bnb.service';

@Module({
  imports: [HttpModule],
  providers: [BnbService],
  exports: [BnbService],
})
export class BnbModule {}
