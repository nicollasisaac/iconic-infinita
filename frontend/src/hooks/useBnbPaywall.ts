import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import IconicMembershipABI from "@/abi/IconicMembership.abi.json";

// --- Configuração (via variáveis de ambiente ou valores padrão) ---
const CONTRACT_ADDRESS =
  import.meta.env.VITE_ICONIC_MEMBERSHIP_CONTRACT_ADDRESS ||
  "0x667b4b89D5B67359360FcC374E3d2bAf25F87481";
const TARGET_NETWORK_ID = import.meta.env.VITE_BNB_CHAIN_ID || "97"; // 97 = BSC Testnet
const TARGET_NETWORK_NAME =
  import.meta.env.VITE_BNB_CHAIN_NAME || "BNB Smart Chain Testnet";
// -----------------------------------------------------------------

// Ajuste o tipo do provider para ethers v5
export function useBnbPaywall() {
  const { account, provider, chainId } =
    useWeb3React<ethers.providers.Web3Provider>(); // <- Mudança aqui para v5
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string | null>(null);
  const [contractInstance, setContractInstance] =
    useState<ethers.Contract | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Verifica se o usuário está conectado à rede correta
  useEffect(() => {
    console.log("Verificando rede...");
    console.log("Chain ID da carteira:", chainId, typeof chainId);
    console.log("TARGET_NETWORK_ID:", TARGET_NETWORK_ID, typeof TARGET_NETWORK_ID);
    const isMatch = chainId !== undefined && chainId !== null && Number(chainId) === Number(TARGET_NETWORK_ID);
    console.log("Rede correta?", isMatch);
    setIsCorrectNetwork(isMatch);
  }, [chainId]);

  // Cria instância do contrato sempre que o provider estiver disponível e a rede estiver correta
  useEffect(() => {
    if (provider && isCorrectNetwork) {
      // Em ethers v5, getSigner() é chamado diretamente no provider
      const signer = provider.getSigner(); 
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        IconicMembershipABI,
        signer
      );
      setContractInstance(contract);
    } else {
      setContractInstance(null);
    }
  }, [provider, isCorrectNetwork]);

  // Busca o valor do pagamento (paymentAmount) no contrato
  useEffect(() => {
    async function fetchPaymentAmount() {
      if (contractInstance) {
        try {
          const amountWei: ethers.BigNumber =
            await contractInstance.paymentAmount();
          // Use ethers.utils.formatEther em v5
          setPaymentAmount(ethers.utils.formatEther(amountWei)); 
        } catch (error) {
          console.error("Erro ao buscar valor do pagamento:", error);
          setPaymentAmount(null);
        }
      }
    }
    fetchPaymentAmount();
  }, [contractInstance]);

  /**
   * Inicia a transação de pagamento para se tornar Iconic.
   * Retorna o hash da transação.
   */
  const payFee = useCallback(async (): Promise<string> => {
    if (!contractInstance || !account || !paymentAmount || !isCorrectNetwork) {
      throw new Error(
        "Carteira não conectada, contrato não inicializado, valor não carregado ou rede incorreta."
      );
    }
    setLoading(true);
    try {
      // Use ethers.utils.parseEther em v5
      const amountWei = ethers.utils.parseEther(paymentAmount); 
      const tx = await contractInstance.becomeIconic({ value: amountWei });
      console.log("Transação enviada:", tx.hash);

      // Aguarda 1 confirmação (tx.wait() funciona igual em v5)
      await tx.wait(1);
      console.log("Transação confirmada:", tx.hash);

      return tx.hash;
    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      const revertReason =
        error.reason ||
        error.data?.message ||
        error.message ||
        "Erro desconhecido";
      throw new Error(`Falha na transação: ${revertReason}`);
    } finally {
      setLoading(false);
    }
  }, [contractInstance, account, paymentAmount, isCorrectNetwork]);

  return {
    loading,
    payFee,
    paymentAmount, // ex: "0.1"
    isCorrectNetwork, // boolean
    networkName: TARGET_NETWORK_NAME,
  };
}

