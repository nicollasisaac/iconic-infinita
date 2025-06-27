// src/components/AddressAutocomplete.tsx
import React, { useEffect, useRef, useState } from "react";

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: Record<string, string>;
}

interface Props {
  value: string;
  onChange(addr: { full: string; lat: number; lon: number }): void;
}

export default function AddressAutocomplete({ value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const skipNext = useRef(false);

  /* -------------------------------------------------- *
   *  BUSCA COM DEBOUNCE
   * -------------------------------------------------- */
  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const id = setTimeout(async () => {
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q: query,
          format: "json",
          addressdetails: "1",
          limit: "5",
        });
      const res = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
      const data = (await res.json()) as Suggestion[];
      setSuggestions(data);
      setOpen(data.length > 0);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  /* mantém valor externo sincronizado */
  useEffect(() => setQuery(value), [value]);

  /* formata sugestão */
  const format = (s: Suggestion) => {
    const a = s.address;
    const rua =
      a.road || a.pedestrian || a.footway || a.cycleway || a.path || "";
    const bairro =
      a.suburb || a.neighbourhood || a.city_district || a.village || "";
    const estado = a.state || a.region || "";
    const cep = a.postcode || "";
    return [rua, bairro, estado, cep].filter(Boolean).join(", ");
  };

  /* seleção de item */
  const pick = (s: Suggestion) => {
    const formatted = format(s);
    skipNext.current = true;
    setQuery(formatted);
    setSuggestions([]); // <<< limpa lista
    setOpen(false);
    onChange({ full: formatted, lat: +s.lat, lon: +s.lon });
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} // clique ainda captura
        className="w-full mt-1 p-3 rounded-xl bg-white outline-none"
        placeholder="Street, neighborhood, state…"
      />

      {open && (
        <ul className="absolute z-10 w-full bg-white rounded-xl shadow mt-1 max-h-60 overflow-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
              onMouseDown={(e) => e.preventDefault()} // evita blur imediato
              onClick={() => pick(s)}
            >
              {format(s)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
