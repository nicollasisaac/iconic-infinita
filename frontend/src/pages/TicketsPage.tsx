// src/pages/TicketsPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { EventCard } from "@/components/EventCard";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@suiet/wallet-kit";
import { usePaywall } from "@/lib/sui";
import Modal from "@/components/modal";
import { BecomeIconicCard } from "@/components/BecomeIconicCard";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const tabList = [
  { key: "events", label: "Recommended Events" },
  { key: "my-tickets", label: "My Tickets" },
];

export default function TicketsPage() {
  /* -------------------------------------------------- */
  /* state / hooks                                      */
  /* -------------------------------------------------- */
  const [tab, setTab] = useState<"events" | "my-tickets">("events");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user, isIconic, token } = useAuth();
  const { connected, connect } = useWallet();
  const { payFee } = usePaywall();

  /* modal ICONIC */
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [waiting, setWaiting] = useState(false);

  /* -------------------------------------------------- */
  /* load events whenever tab changes                   */
  /* -------------------------------------------------- */
  useEffect(() => {
    setLoading(true);

    (async () => {
      try {
        const endpoint =
          tab === "events"
            ? "/api/events/recommended"
            : "/api/events/participating";

        const { data } = await api.get(endpoint);

        const normalized = data.map((evt: any) => ({
          ...evt,
          is_participating:
            tab === "my-tickets" ? true : evt.is_participating ?? false,
        }));

        setEvents(normalized);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [tab]);

  /* -------------------------------------------------- */
  /* become ICONIC                                      */
  /* -------------------------------------------------- */
  const handleSubscribe = async () => {
    if (!connected) {
      await connect();
      return;
    }
    setWaiting(true);
    try {
      const txId = await payFee(0.1);
      await api.post(
        `/api/users/iconic/${user!.id}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "X-Transaction-Id": txId,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Você agora é ICONIC!");
      setSelectedEvent(null);
    } catch {
      toast.error("Erro ao processar pagamento.");
    } finally {
      setWaiting(false);
    }
  };

  /* -------------------------------------------------- */
  /* join event                                         */
  /* -------------------------------------------------- */
  const handleJoin = async (evt: any) => {
    try {
      await api.post("/api/event-participations", {
        event_id: evt.id,
        status: "confirmed",
      });
      toast.success("Registro confirmado!");
      setEvents((prev) =>
        prev.map((e) =>
          e.id === evt.id ? { ...e, is_participating: true } : e
        )
      );
    } catch {
      toast.error("Falha ao registrar. Tente novamente.");
    }
  };

  /* -------------------------------------------------- */
  /* render                                             */
  /* -------------------------------------------------- */
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 pt-16 pb-16">
      <Header />

      <main className="flex-1 px-4 py-6 md:px-8 md:py-10 max-w-5xl mx-auto w-full">
        {/* ---------- tabs ---------- */}
        <div className="flex gap-2 mb-6">
          {tabList.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as TabKey)}
              className={`flex-1 py-2 rounded-full font-semibold text-base transition focus:outline-none ${
                tab === t.key
                  ? "iconic-gradient text-white shadow-lg"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ---------- create event (novo) ---------- */}
        <button
          onClick={() => navigate("/my-events")}
          className="w-full mb-6 py-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white font-semibold shadow"
        >
          <Plus className="w-5 h-5" />
          Manage events
        </button>

        {/* ---------- list / empty / loading ---------- */}
        {loading ? (
          <p className="text-center text-gray-500 mt-10">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            {tab === "events"
              ? "No recommended events at the moment."
              : "You haven't registered for any events yet."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {events.map((evt) => {
              const canAccess =
                (isIconic || !evt.is_exclusive) && !evt.is_participating;
              return (
                <EventCard
                  key={evt.id}
                  event={evt}
                  canAccess={canAccess}
                  onIconicClick={() => setSelectedEvent(evt)}
                  onJoin={() => handleJoin(evt)}
                />
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />

      {/* ---------- modal become ICONIC ---------- */}
      {selectedEvent && (
        <Modal open onClose={() => setSelectedEvent(null)}>
          <BecomeIconicCard
            connected={connected}
            connect={connect}
            waiting={waiting}
            onSubscribe={handleSubscribe}
            feeAmount={0.1}
            networkName="Sui Testnet"
          />
        </Modal>
      )}

      <ToastContainer position="top-center" autoClose={3000} />

      <style>{`
        @keyframes gradient-pan {
          0%,100% {background-position:0% 50%;}
          50% {background-position:100% 50%;}
        }
        .iconic-gradient {
          background: linear-gradient(90deg,#A855F7,#EC4899,#A855F7);
          background-size: 300% 300%;
          animation: gradient-pan 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
