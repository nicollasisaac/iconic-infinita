// src/components/ConnectWalletButton.tsx
import React, { useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";

export function ConnectWalletButton() {
  const { address, connect } = useWallet();

  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch (err: any) {
      console.error(err);
      alert("Falha ao conectar: " + err.message);
    }
  }, [connect]);

  if (address) {
    return (
      <button disabled className="px-4 py-2 bg-green-600 text-white rounded-lg">
        Conectado: {address.substring(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
    >
      Connect Wallet
    </button>
  );
}
