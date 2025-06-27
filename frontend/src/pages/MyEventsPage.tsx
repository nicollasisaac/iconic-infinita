// src/pages/MyEventsPage.tsx
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Pencil, Trash2, Plus } from "lucide-react";
import placeholder from "@/assets/placeholder_event.png";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface MyEvent {
  id: string;
  title: string;
  cover_image_url: string | null;
  start_at: string;
}

export default function MyEventsPage() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* ------------------------------------------------------------------
   * Load only the events that I own
   * ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<MyEvent[]>("/api/events/owned");
        setEvents(data);
      } catch (err) {
        toast.error("Falha ao carregar seus eventos.");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------------------------------------------------------------
   * Delete with confirm dialog
   * ------------------------------------------------------------------ */
  const handleDelete = (id: string) =>
    confirmAlert({
      title: "Excluir evento",
      message:
        "Tem certeza que deseja excluir? Esta ação é permanente e removerá também as dinâmicas.",
      buttons: [
        {
          label: "Sim, excluir",
          onClick: async () => {
            try {
              await api.delete(`/api/events/${id}`);
              setEvents((e) => e.filter((x) => x.id !== id));
              toast.success("Evento removido.");
            } catch {
              toast.error("Erro ao excluir. Tente novamente.");
            }
          },
        },
        { label: "Cancelar" },
      ],
    });

  /* ------------------------------------------------------------------
   * UI helpers
   * ------------------------------------------------------------------ */
  const EmptyState = () => (
    <p className="text-gray-500 text-center mt-10">
      You didnt create any events yet.
    </p>
  );

  if (loading)
    return (
      <Screen>
        <p className="text-gray-500 animate-pulse">Loading...</p>
      </Screen>
    );

  /* ------------------------------------------------------------------ */
  return (
    <Screen>
      <ToastContainer position="top-center" autoClose={3000} />

      {/* HEADER & ACTION */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">My events</h1>
        <button
          onClick={() => navigate("/my-events/new")}
          className="flex items-center gap-1 px-3 py-2 rounded-full iconic-gradient text-white shadow-md"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        events.map((ev) => (
          <div
            key={ev.id}
            className="bg-white rounded-xl shadow mb-4 overflow-hidden"
          >
            <img
              src={ev.cover_image_url || placeholder}
              onError={(e) => (e.currentTarget.src = placeholder)}
              alt={ev.title}
              className="w-full h-32 object-cover"
            />
            <div className="p-3 flex justify-between items-center">
              <div>
                <h2 className="font-semibold line-clamp-1">{ev.title}</h2>
                <p className="text-xs text-gray-500">
                  {new Date(ev.start_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/my-events/${ev.id}`)}
                  className="p-2 rounded-full bg-gray-100 active:scale-95 transition"
                  aria-label="Editar"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="p-2 rounded-full bg-red-50 text-red-600 active:scale-95 transition"
                  aria-label="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </Screen>
  );
}

/* -------------------------------------------------------------------- */
/* Layout wrapper with header + bottom nav                              */
/* -------------------------------------------------------------------- */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />
      <main className="flex-1 pt-20 pb-24 px-4 max-w-md mx-auto w-full">
        {children}
      </main>
      <BottomNav />

      {/* util for gradient buttons */}
      <style>{`
        @keyframes gradient-pan {
          0%,100% {background-position:0% 50%;}
          50%     {background-position:100% 50%;}
        }
        .iconic-gradient{
          background:linear-gradient(90deg,#A855F7,#EC4899,#A855F7);
          background-size:200% 200%;
          animation:gradient-pan 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
