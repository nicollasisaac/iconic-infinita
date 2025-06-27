// src/pages/EventDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Calendar, Clock, MapPin, QrCode, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@suiet/wallet-kit";
import { usePaywall } from "@/lib/sui";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { UserGrid } from "@/components/UserGrid";
import Modal from "@/components/modal";
import { BecomeIconicCard } from "@/components/BecomeIconicCard";
import placeholderEvent from "@/assets/placeholder_event.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ---------- types ---------- */
interface EventDetail {
  id: string;
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at?: string;
  lat?: number;
  lon?: number;
  is_exclusive: boolean;
  cover_image_url: string;
  partner_name?: string;
  partner_logo_url?: string;
  max_attendees: number;
  current_attendees: number;
  is_participating: boolean;
  participation_id?: string;
  has_live_events: boolean;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isIconic, token } = useAuth();
  const { connected, connect } = useWallet();
  const { payFee } = usePaywall();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [becomeOpen, setBecomeOpen] = useState(false);
  const [becomeWaiting, setBecomeWaiting] = useState(false);

  /* ---------- carregar ---------- */
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await api.get<EventDetail>(`/api/events/${id}`);
        setEvent(data);
      } catch {
        toast.error("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* ---------- check-in ---------- */
  useEffect(() => {
    if (!event || !user) return;
    (async () => {
      try {
        const { data } = await api.get<{ checkedIn: boolean }>(
          `/api/event-checkins/event/${id}/user/${user.id}/checked`
        );
        setCheckedIn(data.checkedIn);
      } catch {}
    })();
  }, [event, id, user]);

  /* ---------- RSVP ---------- */
  const handleJoin = async () => {
    if (!event || processing) return;
    if (event.is_exclusive && !isIconic) {
      setBecomeOpen(true);
      return;
    }
    setProcessing(true);
    try {
      const { data } = await api.post<{ id: string }>(
        "/api/event-participations",
        { event_id: event.id, status: "confirmed" }
      );
      setEvent((e) =>
        e
          ? {
              ...e,
              is_participating: true,
              participation_id: data.id,
              current_attendees: e.current_attendees + 1,
            }
          : e
      );
      toast.success("Registration confirmed!");
    } catch (err: any) {
      err.response?.status === 409
        ? toast.info("You're already registered.")
        : toast.error("Failed to register. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!event?.participation_id || processing) return;
    setProcessing(true);
    try {
      await api.patch(`/api/event-participations/${event.participation_id}`, {
        status: "cancelled",
      });
      setEvent((e) =>
        e
          ? {
              ...e,
              is_participating: false,
              participation_id: undefined,
              current_attendees: e.current_attendees - 1,
            }
          : e
      );
      setCheckedIn(false);
      toast.success("RSVP cancelled.");
    } catch {
      toast.error("Failed to cancel RSVP. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  /* ---------- tornar-se ICONIC ---------- */
  const handleBecome = async () => {
    if (!connected) {
      await connect();
      return;
    }
    setBecomeWaiting(true);
    try {
      const txId = await payFee(0.1);
      const res = await api.post(
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
      res.status === 200
        ? (toast.success("You are now ICONIC!"), setBecomeOpen(false))
        : toast.error("Subscription failed.");
    } catch {
      toast.error("Subscription error. Please try again.");
    } finally {
      setBecomeWaiting(false);
    }
  };

  /* ---------- open maps ---------- */
  const handleOpenMaps = () => {
    if (!event) return;
    if (event.lat !== undefined && event.lon !== undefined) {
      const gmaps = `https://www.google.com/maps/?q=${event.lat},${event.lon}`;
      const waze = `https://waze.com/ul?ll=${event.lat},${event.lon}&navigate=yes`;
      const useWaze = window.confirm(
        "Abrir no Waze? Cancelar para Google Maps."
      );
      window.open(useWaze ? waze : gmaps, "_blank");
      return;
    }
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        event.location
      )}`,
      "_blank"
    );
  };

  /* ---------- carregando ---------- */
  if (loading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading event...</p>
        <ToastContainer position="top-center" autoClose={4000} />
      </div>
    );
  }

  /* ---------- helpers ---------- */
  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : null;

  const fmtDay = (d: Date) =>
    d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const startDay = fmtDay(start);
  const startTime = fmtTime(start);
  const endDay = end ? fmtDay(end) : null;
  const endTime = end ? fmtTime(end) : null;

  const seatsLeft = event.max_attendees - event.current_attendees;
  const soldOut = seatsLeft <= 0;
  const role = user?.role.toLowerCase() ?? "";
  const canAccessScanner = ["admin", "scanner", "bipper"].includes(role);

  const gradientBox =
    "flex-none flex items-center justify-center w-10 h-10 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 text-white animate-gradient-pan";

  /* ---------- UI ---------- */
  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="flex-1 overflow-auto pt-20 md:pt-28 pb-24">
          <div className="mx-auto w-full max-w-3xl px-4 md:px-6 lg:px-8 space-y-6">
            {/* HERO */}
            <div className="relative w-full h-40 md:h-52 lg:h-60 rounded-3xl overflow-hidden">
              <img
                src={event.cover_image_url}
                onError={(e) => (e.currentTarget.src = placeholderEvent)}
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {soldOut ? (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 text-sm font-semibold rounded animate-pulse">
                  Sold Out
                </div>
              ) : (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1 text-sm font-semibold rounded animate-gradient-pan">
                  {seatsLeft} seats left
                </div>
              )}
              {checkedIn && (
                <div className="absolute top-4 right-4 bg-white/90 text-gray-900 px-3 py-1 text-sm font-medium uppercase rounded">
                  Access Granted
                </div>
              )}
            </div>

            {/* CARD */}
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 space-y-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-left">
                {event.title}
              </h1>

              {event.partner_logo_url && (
                <div className="flex items-center space-x-3">
                  <img
                    src={event.partner_logo_url}
                    onError={(e) => (e.currentTarget.src = placeholderEvent)}
                    alt={event.partner_name}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="text-sm text-gray-600">
                    Partner: {event.partner_name}
                  </span>
                </div>
              )}

              <p className="text-lg text-gray-700 text-left">
                {event.description}
              </p>

              {/* ------------ META ------------ */}
              <div className="space-y-4">
                {/* Data & hora */}
                <div className="flex items-start gap-4">
                  <div className={gradientBox}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left space-y-0.5">
                    <span className="font-medium">
                      Begins at:&nbsp;{startDay}&nbsp;•&nbsp;{startTime}
                    </span>
                    {end && (
                      <span className="text-sm text-gray-600">
                        Término:&nbsp;{endDay}&nbsp;•&nbsp;{endTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Local */}
                <div className="flex items-start gap-4">
                  <div className={gradientBox}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <button
                    onClick={handleOpenMaps}
                    className="text-left font-medium break-words cursor-pointer hover:text-primary focus:outline-none"
                  >
                    {event.location}
                  </button>
                </div>

                {/* Dinâmicas ao vivo */}
                <p className="text-sm text-gray-600">
                  {event.has_live_events
                    ? "This event features live on-site dynamics."
                    : "There will be no live on-site dynamics."}
                </p>
              </div>

              {/* ---------- AÇÕES ---------- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!event.is_participating && !soldOut && (
                  <button
                    onClick={handleJoin}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white font-bold py-3 rounded-full shadow-lg transition hover:brightness-110 disabled:opacity-50 md:col-span-2"
                  >
                    {processing ? "Joining..." : "RSVP Now"}
                  </button>
                )}

                {event.is_participating && (
                  <>
                    {!checkedIn && (
                      <button
                        onClick={() => navigate(`/events/${event.id}/checkin`)}
                        className="w-full flex items-center justify-center bg-gradient-to-r from-yellow-500 to-red-500 text-white font-semibold py-3 rounded-full transition hover:brightness-110"
                      >
                        <QrCode className="w-5 h-5 mr-2" /> Get Access QR
                      </button>
                    )}

                    {canAccessScanner && (
                      <button
                        onClick={() => navigate(`/events/${event.id}/scan`)}
                        className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-3 rounded-full transition hover:brightness-110"
                      >
                        <Camera className="w-5 h-5 mr-2" /> Access Scanner
                      </button>
                    )}

                    {!checkedIn && (
                      <button
                        onClick={handleCancel}
                        disabled={processing}
                        className="w-full text-left text-sm text-gray-500 underline disabled:opacity-50 md:col-span-2"
                      >
                        {processing ? "Cancelling..." : "Cancel RSVP"}
                      </button>
                    )}
                  </>
                )}

                {soldOut && !event.is_participating && (
                  <div className="md:col-span-2 text-left py-3">
                    <span className="text-red-600 font-semibold">Sold Out</span>
                  </div>
                )}
              </div>
            </div>

            {/* CONFIRMADOS */}
            {event.is_participating && (
              <section className="pt-8 pb-12">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-left">
                  Confirmed Attendees
                </h2>
                <UserGrid
                  endpoint={`/event-participations/event/${event.id}/confirmed-users`}
                />
              </section>
            )}
          </div>
        </main>

        <BottomNav />
      </div>

      {/* MODAL Become ICONIC */}
      <Modal open={becomeOpen} onClose={() => setBecomeOpen(false)}>
        <BecomeIconicCard
          connected={connected}
          connect={connect}
          waiting={becomeWaiting}
          onSubscribe={handleBecome}
          feeAmount={0.1}
          networkName="Sui Testnet"
        />
      </Modal>

      <ToastContainer position="top-center" autoClose={4000} />

      {/* animação gradient */}
      <style>{`
        @keyframes gradient-pan {
          0%,100% { background-position:0% 50%; }
          50%     { background-position:100% 50%; }
        }
        .animate-gradient-pan {
          background-size:200% 200%;
          animation:gradient-pan 4s linear infinite;
        }
      `}</style>
    </>
  );
}
