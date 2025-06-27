// src/components/LiveEvent/PollComponent.tsx
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  text: string;
}
interface Poll {
  id: string;
  question: string;
  options: Option[];
}

export default function PollComponent({
  liveEventId,
}: {
  liveEventId: string;
}) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [choice, setChoice] = useState<string>();
  useEffect(() => {
    (async () => {
      const { data } = await api.get<Poll[]>(
        `/api/live-events/${liveEventId}/polls`
      );
      setPoll(data[0] ?? null);
    })();
  }, [liveEventId]);
  if (!poll) return <p>No poll active.</p>;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{poll.question}</h2>
      {poll.options.map((o) => (
        <label key={o.id} className="block">
          <input
            type="radio"
            name="opt"
            value={o.id}
            onChange={() => setChoice(o.id)}
            className="mr-2"
          />
          {o.text}
        </label>
      ))}
      <Button
        disabled={!choice}
        onClick={async () => {
          await api.post(
            `/api/live-events/${liveEventId}/polls/${poll.id}/vote`,
            { optionId: choice }
          );
          alert("Voto registrado!");
        }}
      >
        Enviar voto
      </Button>
    </div>
  );
}
