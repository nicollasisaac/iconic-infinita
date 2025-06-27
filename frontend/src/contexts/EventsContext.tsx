import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  category: string;
  is_exclusive: boolean;
  is_public: boolean;
  max_attendees: number;
  current_attendees: number;
  partner_name?: string;
  partner_logo_url?: string;
  cover_image_url: string;
  created_at: string;

  // Novos campos vindos do backend:
  is_participating: boolean;
  participation_id?: string;
}

interface EventsContextData {
  events: Event[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  participate: (eventId: string) => Promise<void>;
  cancelParticipation: (
    participationId: string,
    eventId: string
  ) => Promise<void>;
}

const EventsContext = createContext<EventsContextData>({} as EventsContextData);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca recomendados com flags
  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Event[]>("api/events/recommended");
      setEvents(data);
      setError(null);
    } catch (err: any) {
      setError("Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const participate = async (eventId: string) => {
    const { data } = await api.post<{ id: string }>("/event-participations", {
      event_id: eventId,
      status: "confirmed",
    });
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              is_participating: true,
              participation_id: data.id,
              current_attendees: e.current_attendees + 1,
            }
          : e
      )
    );
  };

  const cancelParticipation = async (
    participationId: string,
    eventId: string
  ) => {
    await api.patch(`api/event-participations/${participationId}`, {
      status: "cancelled",
    });
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              is_participating: false,
              participation_id: undefined,
              current_attendees: e.current_attendees - 1,
            }
          : e
      )
    );
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        loading,
        error,
        refresh,
        participate,
        cancelParticipation,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export const useEvents = () => useContext(EventsContext);
