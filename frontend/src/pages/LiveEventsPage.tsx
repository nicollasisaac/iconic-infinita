import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import PollComponent from "@/components/LiveEvent/PollComponent";
import MatchComponent from "@/components/LiveEvent/MatchComponent";
import Countdown from "@/components/LiveEvent/Countdown";
import { Button } from "@/components/ui/button";
import placeholder from "@/assets/placeholder_event.png";

/* ───────────────────────── types ───────────────────────── */
interface EventCard {
  id: string;
  title: string;
  cover_image_url: string;
  start_at: string;
  end_at?: string;
  owner_id: string;
  has_live_events: boolean;
  is_participating: boolean;
  in_progress: boolean;
}

interface LiveEvent {
  id: string;
  title: string;
  is_active: boolean;
}

/* ───────────────────────── page ───────────────────────── */
export default function LiveEventsPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventCard[]>([]);
  const [focus, setFocus] = useState<EventCard | null>(null);
  const [dynamics, setDynamics] = useState<LiveEvent[]>([]);

  /* ─── primeira carga – pega eventos + decide foco ─── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<EventCard[]>("/api/events/recommended");
        const withLive = data.filter((e) => e.has_live_events);

        const active =
          withLive.find((e) => e.in_progress && e.is_participating) ?? null;

        if (active) {
          setFocus(active);
          await loadDynamics(active.id);
        }
        setEvents(withLive.filter((e) => !active || e.id !== active.id));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ─── utils ─── */
  const isOwner =
    focus &&
    (user?.id === focus.owner_id || user?.role?.toLowerCase() === "admin");

  async function loadDynamics(eventId: string) {
    const { data } = await api.get<LiveEvent[]>(
      `/api/events/${eventId}/live-events`
    );
    setDynamics(data);
  }

  /* ─── ações owner/admin ─── */
  async function start(le: LiveEvent) {
    /* se for match, já dispara criação de grupos */
    if (le.title.toLowerCase().includes("match")) {
      const size = Math.max(
        2,
        Number(
          prompt("Tamanho dos grupos (mínimo 2):", "2")?.replace(/\D/g, "") || 2
        )
      );
      await api.post(`/api/events/${focus!.id}/live-events/${le.id}/match`, {
        groupSize: size,
      });
    } else {
      await api.post(`/api/events/${focus!.id}/live-events/${le.id}/start`);
    }
    await loadDynamics(focus!.id);
  }

  async function end(le: LiveEvent) {
    await api.post(`/api/events/${focus!.id}/live-events/${le.id}/end`);
    await loadDynamics(focus!.id);
  }

  /* ─── estados de carregamento / vazio ─── */
  if (loading) {
    return (
      <Screen>
        <p className="text-gray-500 animate-pulse">Loading...</p>
      </Screen>
    );
  }

  /* ───────────────────────── EVENTO EM FOCO ───────────────────────── */
  if (focus) {
    const activeLE = dynamics.find((d) => d.is_active) ?? null;

    return (
      <Screen>
        <h1 className="text-lg font-bold mb-2">{focus.title}</h1>

        {/* controles para owner/admin */}
        {isOwner && (
          <div className="space-y-3 mb-4">
            {dynamics.map((le) => (
              <div
                key={le.id}
                className="bg-white p-3 rounded-xl shadow flex justify-between"
              >
                <span>{le.title}</span>
                {le.is_active ? (
                  <Button size="sm" variant="outline" onClick={() => end(le)}>
                    Encerrar
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => start(le)}>
                    Iniciar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* visão participantes */}
        {!activeLE && (
          <div className="text-center mt-10 space-y-2">
            <Countdown target={focus.start_at} />
            <p className="text-sm text-gray-500">
              O organizador pode iniciar a dinâmica a qualquer momento.
            </p>
          </div>
        )}

        {activeLE && (
          <div className="mt-4">
            {activeLE.title.toLowerCase().includes("poll") ? (
              <PollComponent liveEventId={activeLE.id} />
            ) : (
              <MatchComponent eventId={focus.id} liveEventId={activeLE.id} />
            )}
          </div>
        )}
      </Screen>
    );
  }

  /* ───────────────────────── LISTA DE EVENTOS ───────────────────────── */
  return (
    <Screen>
      <h1 className="text-lg font-bold mb-4">Próximos eventos ao vivo</h1>

      {events.map((e) => {
        const diff = new Date(e.start_at).getTime() - Date.now();
        const mins = Math.max(Math.floor(diff / 60000), 0);

        return (
          <div
            key={e.id}
            onClick={async () => {
              setFocus(e);
              await loadDynamics(e.id);
            }}
            className="bg-white mb-4 rounded-xl shadow overflow-hidden cursor-pointer"
          >
            <img
              src={e.cover_image_url}
              alt={e.title}
              onError={(ev) => (ev.currentTarget.src = placeholder)}
              className="w-full h-40 object-cover"
            />
            <div className="p-3">
              <h2 className="font-semibold">{e.title}</h2>
              <p className="text-xs text-gray-500">
                Começa em&nbsp;
                <span className="font-medium">
                  {mins >= 60 ? `${Math.floor(mins / 60)}h` : `${mins}m`}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </Screen>
  );
}

/* ───────────────────────── wrapper ───────────────────────── */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pt-20 pb-24 px-4 max-w-md mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
