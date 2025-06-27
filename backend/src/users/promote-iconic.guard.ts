import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class PromoteIconicGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // Se o usuário for admin, sempre permite
    if (user?.role === Role.admin) return true;

    // Verifica o Transaction ID (isso pode ser parte do processo de verificação do pagamento, sem depender da Sui)
    const txId = req.headers['x-transaction-id'] as string;
    if (!txId) throw new ForbiddenException('Transaction ID header required.');

    // A lógica de validação da transação (pode ser do BNB ou outro processo de pagamento)
    const confirmed = await this.verifyTransaction(txId); // Substitua pela lógica de validação
    if (!confirmed) throw new ForbiddenException('Transaction not confirmed.');

    return true;
  }

  // Função fictícia de verificação de transação (substitua com a lógica de BNB ou outro método)
  async verifyTransaction(txId: string): Promise<boolean> {
    // Lógica de verificação de transação, por exemplo, chamando um serviço de pagamento (BNB, Stripe, etc.)
    return true; // Aqui, você pode substituir com a lógica que validar a transação no BNB
  }
}
