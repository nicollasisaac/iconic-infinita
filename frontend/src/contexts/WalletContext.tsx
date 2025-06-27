// src/contexts/WalletContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { ethers } from "ethers"; // Keep this import for ethers v5

// Define the type for Web3Provider explicitly if needed, or rely on ethers namespace
type EthersProvider = ethers.providers.Web3Provider;

interface WalletContextData {
  provider: EthersProvider | null; // Changed type
  signer: ethers.Signer | null;
  address: string | null;
  connect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextData>({
  provider: null,
  signer: null,
  address: null,
  connect: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<EthersProvider | null>(null); // Changed type
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  async function connect() {
    if (!window.ethereum) {
      alert("Instale uma carteira Ethereum (MetaMask).");
      return;
    }
    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Use Web3Provider for ethers v5
      const prov = new ethers.providers.Web3Provider(window.ethereum as any, "any"); // Changed constructor, added "any" network
      const sign = await prov.getSigner();
      const addr = await sign.getAddress();

      setProvider(prov);
      setSigner(sign);
      setAddress(addr);
    } catch (error) {
      console.error("Erro ao conectar a carteira:", error);
      alert("Falha ao conectar a carteira.");
    }
  }

  useEffect(() => {
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length > 0) {
        // Re-initialize provider and signer on account change
        try {
            const prov = new ethers.providers.Web3Provider(window.ethereum as any, "any"); // Changed constructor
            const sign = await prov.getSigner();
            // Use the first account provided by the event
            setProvider(prov);
            setSigner(sign);
            setAddress(accounts[0]);
        } catch (error) {
            console.error("Erro ao atualizar a conta:", error);
            setProvider(null);
            setSigner(null);
            setAddress(null);
        }
      } else {
        // Handle disconnection
        console.log("Carteira desconectada.");
        setProvider(null);
        setSigner(null);
        setAddress(null);
      }
    };

    if (window.ethereum) {
      // Listen for account changes
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      // Attempt to connect eagerly if already connected
      connect();

      // Cleanup listener on component unmount
      return () => {
        if (window.ethereum.removeListener) {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <WalletContext.Provider value={{ provider, signer, address, connect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

