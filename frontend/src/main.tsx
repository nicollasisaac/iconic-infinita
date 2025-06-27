// frontend/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";

import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppRoutes } from "@/router/routes";

// --- Adições para Web3React ---
import { Web3ReactProvider } from "@web3-react/core";
import { MetaMask } from "@web3-react/metamask";
import { initializeConnector } from "@web3-react/core";

// Inicializa o conector da MetaMask
const [metaMask, hooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions })
);

// Lista de conectores e seus hooks
const connectors: [MetaMask, ReturnType<typeof initializeConnector<MetaMask>>[1]][] = [
  [metaMask, hooks],
];
// -----------------------------

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Web3ReactProvider connectors={connectors}>
      <WalletProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </WalletProvider>
    </Web3ReactProvider>
  </React.StrictMode>
);
