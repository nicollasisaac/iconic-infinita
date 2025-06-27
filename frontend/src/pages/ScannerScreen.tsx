// src/pages/ScannerScreen.tsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode"; // Importar estado
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

interface ScannedUser {
  full_name: string;
  nickname: string;
  email: string;
  date_of_birth: string;
  is_iconic: boolean;
}

export default function ScannerScreen() {
  const { user } = useAuth();
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [message, setMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [scannerState, setScannerState] = useState<Html5QrcodeScannerState | null>(null);

  // Só admin/scanner/bipper
  useEffect(() => {
    if (!user) return;
    if (!["admin", "scanner", "bipper"].includes(user.role)) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Função segura para parar o scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        // Verifica se está rodando antes de parar
        const currentState = html5QrCodeRef.current.getState();
        if (currentState === Html5QrcodeScannerState.SCANNING || currentState === Html5QrcodeScannerState.PAUSED) {
          await html5QrCodeRef.current.stop();
          console.log("Scanner parado com segurança.");
          setScannerState(Html5QrcodeScannerState.NOT_STARTED); // Atualiza estado interno
        }
      } catch (err) {
        // Ignora erro se já estiver parado ou não puder parar
        console.warn("Aviso ao tentar parar o scanner:", err);
      }
    }
  };

  useEffect(() => {
    const elementId = "reader";
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    const cameraConfig = { facingMode: "environment" };

    const readerElement = document.getElementById(elementId);
    if (!readerElement) {
      console.error(`Elemento com ID '${elementId}' não encontrado.`);
      setMessage("Erro ao inicializar a interface do scanner.");
      setScanning(false);
      return;
    }

    const qr = new Html5Qrcode(elementId);
    html5QrCodeRef.current = qr;
    setScannerState(Html5QrcodeScannerState.NOT_STARTED);

    const onScanSuccess = async (decoded: string) => {
      setScanning(false);
      await stopScanner(); // Usa a função segura para parar
      setMessage("Validando QR Code...");
      try {
        const { data } = await api.post<{
          user: ScannedUser;
        }>("/api/event-checkins/scan", { qr_token: decoded });
        setScannedUser(data.user);
        setMessage("Check-in realizado com sucesso!");
      } catch (err: any) {
        console.error("Erro na validação do QR:", err);
        setMessage(err.response?.data?.message || "Erro ao validar QR Code.");
      }
    };

    const onScanError = (errorMessage: string) => {};

    // Inicia o scanner
    qr.start(cameraConfig, config, onScanSuccess, onScanError)
      .then(() => {
        setScannerState(Html5QrcodeScannerState.SCANNING); // Atualiza estado interno
      })
      .catch((err) => {
        console.error("Falha ao iniciar o scanner:", err);
        if (err.name === "NotAllowedError") {
          setMessage("Permissão da câmera negada. Verifique as configurações do navegador.");
        } else {
          setMessage("Erro ao acessar a câmera. Verifique as permissões ou se outra aplicação a está usando.");
        }
        setScanning(false);
        setScannerState(Html5QrcodeScannerState.NOT_STARTED);
      });

    // Função de limpeza
    return () => {
      stopScanner(); // Usa a função segura na limpeza
      // Tenta limpar recursos adicionais
      try {
        html5QrCodeRef.current?.clear();
      } catch (clearErr) {
        console.warn("Erro ao limpar o scanner:", clearErr);
      }
    };
  }, []);

  // Função para reiniciar o scanner
  const restartScan = async () => {
    if (!html5QrCodeRef.current) return;

    setMessage(null);
    setScannedUser(null);
    setScanning(true);

    await new Promise(resolve => setTimeout(resolve, 100));

    const elementId = "reader";
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    const cameraConfig = { facingMode: "environment" };

    const readerElement = document.getElementById(elementId);
    if (!readerElement) {
      console.error(`Elemento com ID '${elementId}' não encontrado ao reiniciar.`);
      setMessage("Erro ao reiniciar a interface do scanner.");
      setScanning(false);
      return;
    }

    const qr = html5QrCodeRef.current;

    const onScanSuccess = async (decoded: string) => {
      setScanning(false);
      await stopScanner(); // Usa a função segura
      setMessage("Validando QR Code...");
      try {
        const { data } = await api.post<{ user: ScannedUser }>(
          "/api/event-checkins/scan",
          { qr_token: decoded }
        );
        setScannedUser(data.user);
        setMessage("Check-in realizado com sucesso!");
      } catch (err: any) {
         console.error("Erro na validação do QR (restart):", err);
        setMessage(err.response?.data?.message || "Erro ao validar QR Code.");
      }
    };

    // Garante que parou antes de tentar iniciar novamente
    await stopScanner();

    qr.start(cameraConfig, config, onScanSuccess, () => {})
      .then(() => {
         setScannerState(Html5QrcodeScannerState.SCANNING);
      })
      .catch((err) => {
        console.error("Falha ao reiniciar o scanner:", err);
        if (err.name === "NotAllowedError") {
          setMessage("Permissão da câmera negada. Verifique as configurações do navegador.");
        } else {
          setMessage("Erro ao reiniciar a câmera.");
        }
        setScanning(false);
        setScannerState(Html5QrcodeScannerState.NOT_STARTED);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 pt-16 pb-16">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {scanning && (
          <div
            id="reader"
            className="w-full max-w-md rounded-lg overflow-hidden shadow-lg border border-gray-200 mb-4"
            style={{ minHeight: "250px" }}
          />
        )}
        {message && !scannedUser && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow text-center space-y-3 w-full max-w-md">
            <p className={`font-medium ${message.startsWith('Erro') || message.startsWith('Falha') ? 'text-red-600' : 'text-gray-700'}`}>{message}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={restartScan}
                className="px-4 py-2 bg-primary text-white rounded-full"
              >
                Escanear Novamente
              </button>
              <button
                onClick={() => navigate(`/events/${eventId}`)}
                className="px-4 py-2 border border-primary text-primary rounded-full"
              >
                Voltar ao Evento
              </button>
            </div>
          </div>
        )}
        {scannedUser && (
          <div className="mt-4 p-6 bg-white rounded-lg shadow text-left space-y-2 w-full max-w-md">
            <h3 className="text-lg font-semibold text-green-600">Check-in Confirmado!</h3>
            <p>
              <strong>Nome:</strong> {scannedUser.full_name}
            </p>
            <p>
              <strong>Nickname:</strong> {scannedUser.nickname}
            </p>
            <p>
              <strong>Email:</strong> {scannedUser.email}
            </p>
            <p>
              <strong>Data de Nascimento:</strong>{" "}
              {new Date(scannedUser.date_of_birth).toLocaleDateString()}
            </p>
            <p>
              <strong>É Iconic:</strong> {scannedUser.is_iconic ? "Sim" : "Não"}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={restartScan}
                className="px-4 py-2 bg-primary text-white rounded-full"
              >
                Escanear Outro
              </button>
              <button
                onClick={() => navigate(`/events/${eventId}`)}
                className="px-4 py-2 border border-primary text-primary rounded-full"
              >
                Voltar ao Evento
              </button>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

