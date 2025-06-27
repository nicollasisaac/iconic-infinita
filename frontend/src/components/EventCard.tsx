// src/components/EventCard.tsx
import React, { useState } from "react";
import { Calendar, Clock, MapPin, Ticket, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import DefaultCover from "@/assets/placeholder_event.png";
import { Event } from "@/contexts/EventsContext";

interface EventCardProps {
  event: Event; // agora precisa ter start_at e end_at
  onIconicClick: (evt: Event) => void;
  onJoin: (evt: Event) => Promise<void>;
  canAccess: boolean;
}

export function EventCard({
  event,
  onIconicClick,
  onJoin,
  canAccess,
}: EventCardProps) {
  /* ---------- helpers ---------- */
  const [loading, setLoading] = useState(false);

  const remaining = event.max_attendees - event.current_attendees;
  const isSoldOut = remaining <= 0;
  const isMember = event.is_participating;

  const start = new Date(event.start_at);
  const startDate = start.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const startTime = start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  /* ---------- actions ---------- */
  const handleClick = async () => {
    if (!canAccess) {
      onIconicClick(event);
      return;
    }
    setLoading(true);
    try {
      await onJoin(event);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- styling ---------- */
  const bgClass = event.is_exclusive
    ? event.is_public
      ? "bg-gradient-to-br from-purple-500 via-pink-500 to-purple-500 animate-gradient-pan shadow-lg"
      : "bg-gradient-to-br from-yellow-700 via-yellow-500 to-yellow-300 animate-gradient-pan shadow-lg"
    : "bg-white shadow-lg";

  const textClass = event.is_exclusive ? "text-white" : "text-gray-800";
  const descClass = event.is_exclusive ? "text-white/90" : "text-gray-600";
  const infoTextClass = event.is_exclusive ? "text-white/70" : "text-gray-500";

  /* ---------- render ---------- */
  return (
    <div
      className={`w-full h-full flex flex-col ${bgClass} rounded-xl overflow-hidden transition-transform duration-200 hover:scale-105`}
    >
      {/* COVER */}
      <div className="relative">
        <img
          className="w-full h-44 object-cover"
          src={event.cover_image_url || DefaultCover}
          alt={event.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = DefaultCover;
          }}
        />
        {isMember && (
          <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">
            Registered
          </span>
        )}
        {!isMember && isSoldOut && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
            Sold Out
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col p-4 space-y-2">
        <h3 className={`text-lg font-semibold ${textClass}`}>{event.title}</h3>
        <p className={`${descClass} text-sm line-clamp-2`}>
          {event.description}
        </p>

        {/* META */}
        <div className={`flex flex-wrap gap-2 ${infoTextClass} text-xs`}>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {startDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {startTime}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {event.location}
          </span>
        </div>

        {!isMember && !isSoldOut && (
          <div
            className={`mt-1 text-xs flex items-center gap-1 ${infoTextClass}`}
          >
            <Ticket className="w-4 h-4" /> {remaining} spots left
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="p-4">
        {/* JOIN/SOLD OUT/REGISTERED */}
        {!isMember && !isSoldOut ? (
          <button
            onClick={handleClick}
            disabled={loading}
            className={`w-full flex items-center justify-center py-2 text-sm font-semibold rounded-full transition ${
              loading
                ? "bg-gray-400 cursor-wait text-white"
                : "bg-primary text-white hover:bg-hover"
            }`}
          >
            {loading ? (
              "Joining..."
            ) : !canAccess ? (
              <>
                <Lock className="w-4 h-4 mr-1" />
                ICONIC Only
              </>
            ) : (
              "Join"
            )}
          </button>
        ) : isMember ? (
          <button
            disabled
            className="w-full py-2 text-sm font-semibold rounded-full bg-gray-300 text-gray-500 cursor-not-allowed"
          >
            Registered
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2 text-sm font-semibold rounded-full bg-gray-200 text-gray-400 cursor-not-allowed"
          >
            Sold Out
          </button>
        )}

        {/* DETAILS */}
        <Link
          to={`/events/${event.id}`}
          className="block w-full mt-2 py-2 text-sm font-medium text-center rounded-full border border-gray-300 hover:bg-gray-100 transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
