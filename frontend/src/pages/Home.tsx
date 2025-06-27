// src/pages/Home.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useEvents, EventsProvider, Event } from "@/contexts/EventsContext";
import { EventCard } from "@/components/EventCard";
import { BecomeIconicCard } from "@/components/BecomeIconicCard";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@suiet/wallet-kit";
import { usePaywall } from "@/lib/sui";
import Modal from "@/components/modal";
import { api } from "@/lib/api";
import { UserGrid } from "@/components/UserGrid";
import type { User } from "@/components/UserGrid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* viewport caps & flags */
const useCaps = () => {
  const calc = () => {
    const w = window.innerWidth;
    return {
      ev: w < 640 ? 2 : w < 1024 ? 3 : 2,
      ic: w < 640 ? 2 : 4,
      mobile: w < 640,
    };
  };
  const [caps, setCaps] = useState(calc());
  useEffect(() => {
    const onResize = () => setCaps(calc());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return caps;
};

export default function Home() {
  return (
    <EventsProvider>
      <HomeContent />
    </EventsProvider>
  );
}

function HomeContent() {
  const { ev, ic, mobile } = useCaps();
  const navigate = useNavigate();

  /* EVENTS */
  const { events, loading, error } = useEvents();
  // eventos recomendados, limitados pela viewport
  const visibleEvents = useMemo(() => events.slice(0, ev), [events, ev]);

  /* AUTH / WALLET */
  const { isIconic, user, token, refresh } = useAuth();
  const { connected, connect } = useWallet();
  const { payFee } = usePaywall();

  // Modal state e “join” logic
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [showIconicModal, setShowIconicModal] = useState(false);

  // Força re-render quando marcamos um evento como "participating"
  const [rerenderCounter, setRerenderCounter] = useState(0);

  /* ICONICS */
  const [iconics, setIconics] = useState<User[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await api.get<User[]>("/api/users/iconic");
      setIconics(data.filter((u) => u.profile_picture_url).slice(0, ic));
    })();
  }, [ic]);

  /* SUBSCRIBE FLOW */
  const subscribeIconic = async () => {
    if (!connected) {
      await connect();
      return;
    }
    setWaiting(true);
    try {
      const txId = await payFee(0.1);
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/iconic/${user!.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Transaction-Id": txId,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      await refresh();
      setShowIconicModal(false);
    } finally {
      setWaiting(false);
    }
  };

  // Se o usuário clicar num evento exclusivo sem ser Iconic → abre modal
  const handleIconicClick = (evt: Event) => {
    setSelectedEvent(evt);
  };

  // Função de “join”: registra no evento, dá toast e atualiza state sem reload
  const handleJoin = async (evt: Event) => {
    try {
      await api.post("/api/event-participations", {
        event_id: evt.id,
        status: "confirmed",
      });
      // Marca localmente que o usuário agora participa deste evento:
      evt.is_participating = true;
      // Força re-render para que o EventCard perceba a mudança
      setRerenderCounter((c) => c + 1);
      toast.success("Você foi registrado no evento!");
    } catch (err) {
      console.error("Erro ao dar join no evento:", err);
      toast.error("Falha ao registrar no evento. Tente novamente.");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 pb-20 px-4 md:px-10 lg:px-14 space-y-6 max-w-7xl mx-auto">
        {/* EVENTS */}
        <section className="mt-2 md:mt-6">
          <h2 className="text-lg md:text-2xl font-semibold text-gray-700 mb-1 md:mb-2">
            Live Memorable Experiences
          </h2>

          {loading && (
            <p className="text-center text-gray-500 mt-2">Loading…</p>
          )}
          {error && <p className="text-center text-red-500 mt-2">{error}</p>}

          <div className="compact-event-grid grid gap-2 grid-cols-1 md:grid-cols-2 mt-3">
            {visibleEvents.map((evt) => {
              // Usuário pode participar se for Iconic ou se o evento não for exclusivo
              const canAccess = isIconic || !evt.is_exclusive;

              // Se já está participando (ou acabou de participar), não exibe botão Join
              const alreadyJoined = evt.is_participating;

              return mobile ? (
                <div
                  key={evt.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/events/${evt.id}`)}
                >
                  <EventCard
                    event={evt}
                    canAccess={true}
                    onIconicClick={() => {}}
                    onJoin={() => Promise.resolve()}
                  />
                </div>
              ) : (
                <EventCard
                  key={evt.id}
                  event={evt}
                  canAccess={canAccess && !alreadyJoined} // se já entrou, desabilita
                  onIconicClick={() => handleIconicClick(evt)}
                  onJoin={() => handleJoin(evt)}
                />
              );
            })}
          </div>

          <div className="mt-2 flex justify-center">
            <Link
              to="/tickets"
              className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition"
            >
              Explore full calendar →
            </Link>
          </div>
        </section>

        {/* ICONIC MEMBERS */}
        <section className="mt-2 md:mt-4 relative">
          <h3 className="text-lg md:text-2xl font-semibold text-gray-700 mb-1">
            Meet Our ICONIC Members
          </h3>

          {iconics.length === 0 ? (
            <p className="text-center text-gray-500">No public profiles yet.</p>
          ) : (
            <div className="home-iconic-grid">
              <UserGrid endpoint="/users/iconic" />
            </div>
          )}

          {/* Botão de “Become ICONIC” */}
          <div
            className={`${
              mobile
                ? "mt-2 static"
                : "fixed bottom-24 left-1/2 transform -translate-x-1/2"
            } flex justify-center w-full max-w-7xl`}
          >
            {!isIconic ? (
              <button
                onClick={() => setShowIconicModal(true)}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition"
              >
                Become ICONIC →
              </button>
            ) : (
              <Link
                to="/iconic-network"
                className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition"
              >
                Go to ICONIC Network →
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Modal de “BecomeIconic” que aparece tanto para evento quanto para botão */}
      {(showIconicModal || !!selectedEvent) && (
        <Modal
          open
          onClose={() => {
            setShowIconicModal(false);
            setSelectedEvent(null);
          }}
        >
          <BecomeIconicCard
            connected={connected}
            connect={connect}
            waiting={waiting}
            onSubscribe={subscribeIconic}
            feeAmount={0.1}
            networkName="Sui Testnet"
          />
        </Modal>
      )}

      <BottomNav />

      {/* ToastContainer para exibir notificações */}
      <ToastContainer position="top-center" autoClose={3000} />

      {/* page-specific overrides */}
      <style>{`
        /* mobile: hide detalhes, reduzir padding dos cards */
        .compact-event-grid .relative>img { display: none; }
        .compact-event-grid .flex-1 { padding: 0.35rem!important; }
        @media(max-width:639px) {
          .compact-event-grid .flex-1>p,
          .compact-event-grid .flex-1>div:nth-child(3),
          .compact-event-grid .flex-1>div.mt-1,
          .compact-event-grid .p-4>a,
          .compact-event-grid .p-4>button:first-child {
            display: none;
          }
        }

        /* desktop: manter cover, reduzir gap do grid */
        @media(min-width:1024px) {
          .home-iconic-grid .relative img { object-fit: cover !important; }
          .home-iconic-grid .grid { gap: 0.4rem!important; }
          .home-iconic-grid .cursor-pointer { transform: scale(.55); }
        }
      `}</style>
    </div>
  );
}
