import {
  Controller,
  Post,
  Body,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BnbService } from '../bnb-chain/bnb.service';
import { UsersService } from '../users/users.service';

// Updated DTO to receive both internal user ID and wallet address
interface ConfirmPaymentDto {
  txHash: string;       // Transaction hash on the EVM chain (BNB Chain)
  userId: string;       // Internal database user ID (e.g., UUID)
  walletAddress: string; // User's wallet address used for the transaction
}

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    @Inject(BnbService) private readonly bnbService: BnbService,
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {}

  @Post('confirm')
  async confirmPayment(@Body() body: ConfirmPaymentDto) {
    // Destructure both userId (internal) and walletAddress
    const { txHash, userId, walletAddress } = body;
    this.logger.log(
      `Recebida confirmação de pagamento para txHash: ${txHash}, userId (interno): ${userId}, walletAddress: ${walletAddress}`,
    );

    if (!userId || !walletAddress) {
        this.logger.error('userId ou walletAddress faltando no corpo da requisição.');
        throw new HttpException('Dados insuficientes para confirmação.', HttpStatus.BAD_REQUEST);
    }

    // 1) Get the transaction receipt from the BNB Chain
    const receipt = await this.bnbService.getTransactionReceipt(txHash);
    if (!receipt) {
      this.logger.warn(
        `Transação ${txHash} não encontrada ou falhou (status != 1).`,
      );
      throw new HttpException(
        'Transação não encontrada ou falhou',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2) Verify if the UserBecameIconic event was emitted for the correct WALLET ADDRESS
    const becameIconic = await this.bnbService.didUserBecomeIconicInTx(
      receipt,
      walletAddress, // Use walletAddress for blockchain event check
    );

    if (!becameIconic) {
      this.logger.warn(
        `Evento UserBecameIconic não encontrado para carteira ${walletAddress} na tx ${txHash}.`,
      );
      // Consider if this should be an error or just a warning depending on flow
      throw new HttpException(
        'Pagamento confirmado na blockchain, mas o evento esperado não foi encontrado.',
        HttpStatus.EXPECTATION_FAILED, // Or INTERNAL_SERVER_ERROR / BAD_REQUEST depending on desired behavior
      );
    }

    // 3) Promote the user to ICONIC using the INTERNAL USER ID
    try {
      // Pass the internal userId to the service method
      await this.usersService.promoteToIconic(userId); 
      this.logger.log(`Usuário com ID interno ${userId} (carteira ${walletAddress}) promovido a ICONIC!`);
    } catch (error) {
      // Log the specific error from the service
      this.logger.error(
        `Erro ao promover usuário com ID interno ${userId} (carteira ${walletAddress}) a ICONIC: ${error.message}`,
        error.stack, // Log stack trace for better debugging
      );
      // Rethrow a generic error or specific based on caught error type
      if (error instanceof HttpException) {
        throw error; // Rethrow if it's already an HttpException (like NotFoundException from service)
      }
      throw new HttpException(
        'Erro interno ao atualizar o status do usuário para ICONIC.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 4) Return success
    this.logger.log(`Pagamento para usuário ${userId} (carteira ${walletAddress}) registrado e usuário agora é ICONIC!`);
    return {
      ok: true,
      message: 'Pagamento confirmado e usuário agora é Iconic!',
    };
  }

  @Post('check-status')
  async checkIconicStatus(@Body() body: { userAddress: string }) {
    const { userAddress } = body;
    this.logger.log(`Verificando status Iconic para: ${userAddress}`);
    try {
        const isIconic = await this.bnbService.isUserIconic(userAddress);
        return { userAddress, isIconic };
    } catch (error) {
        this.logger.error(`Erro ao verificar status Iconic para ${userAddress}: ${error.message}`, error.stack);
        throw new HttpException('Erro ao verificar status Iconic na blockchain.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

