import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { api } from "@/lib/api";
import { UserGrid } from "@/components/UserGrid";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Partner {
  id: string;
  full_name: string;
  nickname: string;
  profile_picture_url: string | null;
  bio: string | null;
  is_iconic: boolean;
}

interface Props {
  eventId: string;
  liveEventId: string;
  pollMs?: number;
}

export default function MatchComponent({
  eventId,
  liveEventId,
  pollMs = 4000,
}: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(true);
  const [confettiShown, setConfettiShown] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchPartners = async () => {
      try {
        const { data } = await api.get<Partner[]>(
          `/api/events/${eventId}/live-events/${liveEventId}/match/me`
        );

        if (data?.length) {
          setPartners(data);

          if (!confettiShown) {
            const instance = confetti.create(undefined, { resize: true });
            instance({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });

            setConfettiShown(true);
            setTimeout(() => instance.reset(), 3000);
          }
        } else {
          timer = setTimeout(fetchPartners, pollMs);
        }
      } catch {
        timer = setTimeout(fetchPartners, pollMs);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();

    return () => {
      if (timer) clearTimeout(timer);
      confetti.reset();
    };
  }, [eventId, liveEventId, pollMs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowCelebration(false);
      }
    };

    if (showCelebration) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCelebration]);

  if (loading)
    return <p className="text-sm text-gray-500">Loading matchmaking…</p>;

  if (!partners.length) {
    return (
      <p className="text-sm text-gray-600">
        Waiting Pair 🙌
      </p>
    );
  }

  const partner = partners[matchIndex];
  const imageUrl =
    partner.profile_picture_url ||
    "https://via.placeholder.com/300x400?text=Sem+Foto";

  return showCelebration ? (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm overflow-auto">
      <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6">
        <div
          ref={wrapperRef}
          className="bg-gradient-to-br from-[#FF8CAB] via-[#FF72D3] to-[#6A4CFF] p-1 rounded-3xl shadow-2xl w-full max-w-[90vw] sm:max-w-md lg:max-w-lg animate-gradient-pan"
        >
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4">
            <h2 className="text-2xl font-extrabold text-center text-gray-800">
              You matched with:
            </h2>

            <div className="relative w-full">
              <img
                src={imageUrl}
                alt={partner.nickname}
                onClick={() => {
                  setShowCelebration(false);
                  setTimeout(() => navigate(`/profile/${partner.id}`), 50);
                }}
                className="cursor-pointer w-full h-auto max-h-[70vh] aspect-[3/4] object-cover rounded-xl shadow-lg hover:brightness-105 transition"
              />

              {partners.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setMatchIndex((prev) =>
                        prev === 0 ? partners.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8CAB] via-[#FF72D3] to-[#6A4CFF] flex items-center justify-center animate-spin-slow hover:scale-110 transition z-10"
                  >
                    <ChevronLeft size={20} className="text-white" />
                  </button>

                  <button
                    onClick={() =>
                      setMatchIndex((prev) =>
                        prev === partners.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8CAB] via-[#FF72D3] to-[#6A4CFF] flex items-center justify-center animate-spin-slow hover:scale-110 transition z-10"
                  >
                    <ChevronRight size={20} className="text-white" />
                  </button>
                </>
              )}
            </div>

            <p className="text-xl font-bold text-gray-800 text-center break-words">
              {partner.full_name || partner.nickname}
            </p>

            {partners.length > 1 && (
              <p className="text-sm text-gray-500">
                {matchIndex + 1} of {partners.length}
              </p>
            )}

            <button
              onClick={() => {
                setShowCelebration(false);
                setShowGrid(true);
              }}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF8CAB] via-[#FF72D3] to-[#6A4CFF] animate-bounce-slow flex items-center justify-center hover:scale-105 transition"
            >
              <span className="text-white font-bold text-sm">See +</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <>
      <h2 className="text-lg font-semibold mb-2 text-center">
        Your ICONIC Match is:
      </h2>

      <UserGrid
        endpoint={`/events/${eventId}/live-events/${liveEventId}/match/me`}
        _preloaded={partners}
      />
    </>
  );
}
