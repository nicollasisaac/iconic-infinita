// src/lib/sui.ts
import { Transaction } from '@mysten/sui/transactions';
import { useWallet } from '@suiet/wallet-kit';

export function usePaywall() {
  const { signAndExecuteTransactionBlock, chain } = useWallet();

  async function payFee(amountSui: number) {
    console.log('Wallet chain id:', chain?.id);
    const amount = BigInt(Math.floor(amountSui * 1e9));
    const paywallAddress = import.meta.env.VITE_PAYWALL_ADDRESS!;
    console.log('Paywall address:', paywallAddress, '| Amount:', amount.toString());

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    tx.transferObjects([coin], tx.pure.address(paywallAddress));

    let result;
    try {
      result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        chain: chain?.id,
        gasBudget: 200_000,
        options: { showEffects: true },
      });
      console.log('Sui signAndExecuteTransactionBlock result:', result);
    } catch (err: any) {
      console.error('Erro na wallet ou envio Sui:', err);
      throw new Error('Erro na assinatura ou execução Sui: ' + (err.message || err));
    }

    // ALTERAÇÃO PRINCIPAL: se vier digest, retorna! (mesmo que não venha effects)
    if (result.digest) {
      return result.digest;
    }
    throw new Error(
      'Falha na transação Sui: digest ausente. \n' +
        (result.rawEffects ? JSON.stringify(result.rawEffects) : '')
    );
  }

  return { payFee };
}
