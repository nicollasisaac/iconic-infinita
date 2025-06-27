import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as ethers from 'ethers';
import IconicABI from './IconicMembership.abi.json';

@Injectable()
export class BnbService {
  private provider: ethers.JsonRpcProvider;
  private contractAddress: string;
  private contract: ethers.Contract;

  constructor() {
    // URL do RPC da Base (Goerli ou Sepolia — verifique sua .env)
    const rpcUrl =
      process.env.BASE_RPC_URL || 'https://sepolia.base.org'; // fallback para Base Sepolia
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Endereço do contrato já deployado na Base
    this.contractAddress =
      process.env.ICONIC_MEMBERSHIP_CONTRACT_ADDRESS ||
      '0xF8A73a9ba726BEfe1BEB4e54937857cA555bff9C'; // substitua se necessário

    // Conecta ao contrato
    this.contract = new ethers.Contract(
      this.contractAddress,
      IconicABI,
      this.provider,
    );
  }

  async getTransactionReceipt(
    txHash: string,
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) return null;
      return receipt;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao obter recibo de transação',
      );
    }
  }

  async didUserBecomeIconicInTx(
    receipt: ethers.TransactionReceipt,
    userAddress: string,
  ): Promise<boolean> {
    try {
      const iface = new ethers.Interface(IconicABI);
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === this.contractAddress.toLowerCase()) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed.name === 'UserBecameIconic') {
              const eventUser = parsed.args['user'];
              if (eventUser.toLowerCase() === userAddress.toLowerCase()) {
                return true;
              }
            }
          } catch {
            // Ignora se não for o evento esperado
          }
        }
      }
      return false;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao analisar logs da transação',
      );
    }
  }

  async isUserIconic(userAddress: string): Promise<boolean> {
    try {
      return await this.contract.isIconic(userAddress);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao verificar status Iconic');
    }
  }
}
