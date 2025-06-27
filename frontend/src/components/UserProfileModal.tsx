// src/components/UserProfileModal.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { X, Instagram } from "lucide-react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

interface Photo {
  id: string;
  url: string;
}
interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    full_name: string;
    nickname: string;
    profile_picture_url: string | null;
    is_iconic: boolean;
    bio?: string;
    instagram?: string;
    date_of_birth?: string;
    photos: Photo[];
  };
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  /* ──────────────────────────────────────────────────────────
   * Estado reiniciado a cada abertura
   * ────────────────────────────────────────────────────────── */
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setLoaded({});
    }
  }, [isOpen]);

  /* ──────────────────────────────────────────────────────────
   * Keen Slider
   * ────────────────────────────────────────────────────────── */
  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    loop: true,
    mode: "free-snap",
    renderMode: "performance",
    slides: { perView: 1 },
    created(s) {
      // força recálculo depois que o modal ficou visível
      setTimeout(() => s.update(), 0);
    },
    slideChanged(s) {
      setCurrentSlide(s.track.details.rel);
    },
  });

  /* Recalcula tamanho quando o modal é reaberto ou a janela redimensiona */
  useEffect(() => {
    if (!isOpen) return;
    const refresh = () => slider.current?.update();
    refresh(); // logo que abriu
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, [isOpen, slider]);

  /* ──────────────────────────────────────────────────────────
   * Fotos (traz a foto de perfil primeiro)
   * ────────────────────────────────────────────────────────── */
  const allPhotos = useMemo<Photo[]>(() => {
    const main = user.profile_picture_url
      ? [{ id: "main", url: user.profile_picture_url }]
      : [];
    const rest = user.photos.filter((p) => p.url !== user.profile_picture_url);
    return [...main, ...rest];
  }, [user]);

  /* idade (opcional) */
  const age = useMemo(() => {
    if (!user.date_of_birth) return null;
    const b = new Date(user.date_of_birth);
    const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
    return a;
  }, [user.date_of_birth]);

  /* ──────────────────────────────────────────────────────────
   * Render
   * ────────────────────────────────────────────────────────── */
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      <div className="relative w-full max-w-md sm:max-w-lg md:max-w-xl h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col">
        {/* botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* SLIDER */}
        <div className="flex-none h-[60%] min-h-[240px]">
          <div
            ref={sliderRef}
            className="keen-slider h-full relative select-none"
          >
            {allPhotos.length > 0 ? (
              allPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="keen-slider__slide flex items-center justify-center w-full aspect-[3/4]"
                  style={{ flex: "0 0 100%" }}
                >
                  {/* Skeleton */}
                  {!loaded[photo.id] && (
                    <div className="absolute inset-0 bg-gray-300 animate-pulse" />
                  )}

                  <img
                    src={photo.url}
                    alt={`User photo ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    onLoad={() =>
                      setLoaded((p) => ({ ...p, [photo.id]: true }))
                    }
                    onError={(e) => {
                      e.currentTarget.src = "/avatar_placeholder.png";
                      setLoaded((p) => ({ ...p, [photo.id]: true }));
                    }}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${
                      loaded[photo.id] ? "opacity-100" : "opacity-0"
                    }`}
                    draggable={false}
                  />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center bg-gray-100 w-full h-full">
                <span className="text-gray-400 text-sm">No photos</span>
              </div>
            )}

            {/* bullets */}
            {allPhotos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                {allPhotos.map((_, idx) => (
                  <span
                    key={idx}
                    className={`block w-2 h-2 rounded-full ${
                      currentSlide === idx ? "bg-gray-900" : "bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* informações */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-gray-900 truncate uppercase">
              {user.full_name}
              {age ? `, ${age}` : ""}
            </h2>
            {user.is_iconic && (
              <span className="px-3 py-1 bg-gradient-to-r from-purple-600 via-pink-400 to-purple-600 text-white text-xs font-semibold rounded-full animate-[gradient-move_2s_linear_infinite]">
                ICONIC MEMBER
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-3 truncate">
            @{user.nickname}
          </p>
          {user.bio && <p className="text-sm text-gray-700 mb-3">{user.bio}</p>}
          {user.instagram && (
            <a
              href={`https://instagram.com/${user.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline mb-2"
            >
              <Instagram className="w-4 h-4" /> @{user.instagram}
            </a>
          )}
        </div>
      </div>

      {/* animação gradiente */}
      <style>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </Dialog>
  );
};
