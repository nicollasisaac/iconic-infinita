import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { BnbModule } from '../bnb-chain/bnb.module';
import { UsersModule } from '../users/users.module'; // <<<=== ADICIONE ESTA LINHA

@Module({
  imports: [
    BnbModule,
    UsersModule, // <<<=== ADICIONE UsersModule AQUI NA LISTA
  ],
  controllers: [PaymentController],
})
export class PaymentModule {}
