// src/components/LiveEvent/Countdown.tsx
import React, { useEffect, useState } from "react";

export default function Countdown({ target }: { target: string }) {
  const [diff, setDiff] = useState(() =>
    Math.max(new Date(target).getTime() - Date.now(), 0)
  );
  useEffect(() => {
    const iv = setInterval(() => {
      setDiff((d) => Math.max(d - 1000, 0));
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return (
    <p className="text-sm text-gray-600">
      Começa em {days}d {hrs}h {mins}m {secs}s
    </p>
  );
}
