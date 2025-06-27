// src/components/UserGrid.tsx
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { UserProfileModal } from "./UserProfileModal";

export interface User {
  id: string;
  full_name: string;
  nickname: string;
  profile_picture_url: string | null;
  is_iconic: boolean;
}

interface UserGridProps {
  endpoint: string;
}

export const UserGrid: React.FC<UserGridProps> = ({ endpoint }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());

  // --------------------------------------------------------------
  // Carrega usuários
  // --------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<User[]>(`/api${endpoint}`);
        const shuffled = data
          .map((u) => ({ value: u, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value);
        setUsers(shuffled);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [endpoint]);

  const openProfile = async (id: string) => {
    try {
      const { data } = await api.get(`/api/users/public/${id}`);
      setSelectedUser(data);
    } catch (err) {
      console.error("Error loading public profile:", err);
    }
  };

  const markLoaded = (id: string) =>
    setLoadedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  if (loading) return <p className="text-sm text-gray-500">Loading users…</p>;
  if (users.length === 0)
    return <p className="text-sm text-gray-500">No users found.</p>;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 pb-24">
        {users.map((user) => {
          const name = (user.full_name || user.nickname)
            .split(" ")
            .slice(0, 3)
            .join(" ");
          const imgSrc = user.profile_picture_url || "/avatar_placeholder.png";
          const isLoaded = loadedIds.has(user.id);

          return (
            <div
              key={user.id}
              className="cursor-pointer"
              onClick={() => openProfile(user.id)}
            >
              <div
                className={
                  user.is_iconic
                    ? "rounded-xl p-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
                    : ""
                }
              >
                <div className="relative rounded-xl overflow-hidden bg-white shadow-lg">
                  {/*  Aspect ratio 3:4 para cartões mais altos  */}
                  <div className="w-full aspect-[3/4] bg-gray-200 relative">
                    {/* Skeleton enquanto carrega */}
                    {!isLoaded && (
                      <div className="absolute inset-0 animate-pulse bg-gray-300" />
                    )}

                    <img
                      src={imgSrc}
                      alt={name}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => markLoaded(user.id)}
                      onError={(e) => {
                        e.currentTarget.src = "/avatar_placeholder.png";
                        markLoaded(user.id);
                      }}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                        isLoaded ? "opacity-100" : "opacity-0"
                      }`}
                    />

                    {/* gradiente para legibilidade do nome */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

                    <span
                      className={`absolute bottom-2 left-3 right-3 z-20 truncate text-xs font-bold ${
                        user.is_iconic
                          ? "bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
                          : "text-white"
                      }`}
                    >
                      {name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedUser && (
        <UserProfileModal
          isOpen
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
        />
      )}
    </>
  );
};
