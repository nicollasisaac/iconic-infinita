import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import IconicMembershipABI from "@/abi/IconicMembership.abi.json";

// --- Configuração (via variáveis de ambiente ou valores padrão) ---
const CONTRACT_ADDRESS =
  import.meta.env.VITE_ICONIC_MEMBERSHIP_CONTRACT_ADDRESS ||
  "0xF8A73a9ba726BEfe1BEB4e54937857cA555bff9C";
const TARGET_NETWORK_ID = import.meta.env.VITE_BASE_CHAIN_ID || "84532"; // Base Sepolia
const TARGET_NETWORK_NAME =
  import.meta.env.VITE_BASE_CHAIN_NAME || "Base Sepolia";
// -----------------------------------------------------------------

export function useBasePaywall() {
  const { account, provider, chainId } =
    useWeb3React<ethers.providers.Web3Provider>();
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string | null>(null);
  const [contractInstance, setContractInstance] =
    useState<ethers.Contract | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    const isMatch =
      chainId !== undefined &&
      chainId !== null &&
      Number(chainId) === Number(TARGET_NETWORK_ID);
    setIsCorrectNetwork(isMatch);
  }, [chainId]);

  useEffect(() => {
    if (provider && isCorrectNetwork) {
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

  useEffect(() => {
    async function fetchPaymentAmount() {
      if (contractInstance) {
        try {
          const amountWei: ethers.BigNumber =
            await contractInstance.paymentAmount();
          setPaymentAmount(ethers.utils.formatEther(amountWei));
        } catch (error) {
          console.error("Erro ao buscar valor do pagamento:", error);
          setPaymentAmount(null);
        }
      }
    }
    fetchPaymentAmount();
  }, [contractInstance]);

  const payFee = useCallback(async (): Promise<string> => {
    if (!contractInstance || !account || !paymentAmount || !isCorrectNetwork) {
      throw new Error(
        "Carteira não conectada, contrato não inicializado, valor não carregado ou rede incorreta."
      );
    }
    setLoading(true);
    try {
      const amountWei = ethers.utils.parseEther(paymentAmount);
      const tx = await contractInstance.becomeIconic({ value: amountWei });
      await tx.wait(1);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // aguarda 3s
      return tx.hash;
    } catch (error: any) {
      const revertReason =
        error.reason || error.data?.message || error.message || "Erro desconhecido";
      throw new Error(`Falha na transação: ${revertReason}`);
    } finally {
      setLoading(false);
    }
  }, [contractInstance, account, paymentAmount, isCorrectNetwork]);

  return {
    loading,
    payFee,
    paymentAmount,
    isCorrectNetwork,
    networkName: TARGET_NETWORK_NAME,
  };
}
