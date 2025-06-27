import React, { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react"; // ícone bonito (precisa lucide-react instalado)

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

// O gradiente Iconic: do rosa (#ff8cab) ao roxo (#6a4cff)
export default function Modal({ open, onClose, children }: ModalProps) {
  const modalRoot = document.getElementById("modal-root") || document.body;

  // ESC fecha
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="
          relative w-full max-w-md mx-4 rounded-2xl shadow-2xl
          bg-gradient-to-br from-[#FF8CAB] via-[#FF72D3] to-[#6A4CFF]
          p-1"
      >
        <div className="rounded-2xl bg-white/90 p-7">
          {/* Close Button */}
          <button
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={22} />
          </button>

          {/* ICONIC logo ou título */}
          <div className="flex flex-col items-center mb-3">
            <span className="text-[32px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF8CAB] via-[#FF72D3] to-[#6A4CFF] drop-shadow-md uppercase tracking-wide">
              ICONIC
            </span>
            <span className="text-sm text-gray-700 font-medium mt-1 tracking-wider">
              Exclusive Member Access
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>,
    modalRoot
  );
}
