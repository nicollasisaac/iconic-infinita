/* eslint-disable jsx-a11y/label-has-associated-control */
// src/pages/CreateEditEventPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { supabase } from "@/supabaseClient";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import {
  UploadCloud,
  Check,
  ChevronLeft,
  Plus,
  X as XIcon,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import placeholder from "@/assets/placeholder_event.png";
import "react-toastify/dist/ReactToastify.css";
type Tab = "details" | "dynamics";
type PollDraft = { question: string; durationSec: number; options: string[] };
const emptyPoll: PollDraft = {
  question: "",
  durationSec: 30,
  options: ["", ""],
};
interface Draft {
  title: string;
  description: string;
  location: string;
  house_number: string;
  lat: number | null;
  lon: number | null;
  start_at: string;
  end_at?: string;
  category: string;
  max_attendees: number;
  is_exclusive: boolean;
  is_public: boolean;
  cover_image_url: string;
  with_poll: boolean;
  poll: PollDraft;
  pollRequireQr: boolean;
  with_match: boolean;
  groupSize: number;
  matchRequireQr: boolean;
}
const defaultDraft: Draft = {
  title: "",
  description: "",
  location: "",
  house_number: "",
  lat: null,
  lon: null,
  start_at: "",
  end_at: "",
  category: "party",
  max_attendees: 100,
  is_exclusive: false,
  is_public: true,
  cover_image_url: "",
  with_poll: false,
  poll: emptyPoll,
  pollRequireQr: false,
  with_match: false,
  groupSize: 2,
  matchRequireQr: false,
};
const uploadFile = async (file: File) => {
  const ext = file.name.split(".").pop();
  const path = `covers/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("events").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("events").getPublicUrl(path).data.publicUrl;
};
export default function CreateEditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const isEdit = Boolean(eventId);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("details");
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [loading, setLoading] = useState(isEdit);
  const coverInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data: ev } = await api.get<any>(`/api/events/${eventId}`);
        const parts = ev.location.split(",").map((p: string) => p.trim());
        const nIdx = parts.findIndex((p: string) => /^\d+$/.test(p));
        const num = nIdx >= 0 ? parts[nIdx] : "";
        const loc = parts.filter((_, i) => i !== nIdx).join(", ");
        setDraft((d) => ({
          ...d,
          title: ev.title,
          description: ev.description,
          location: loc,
          house_number: num,
          lat: ev.lat ?? null,
          lon: ev.lon ?? null,
          start_at: ev.start_at?.slice(0, 16) ?? "",
          end_at: ev.end_at?.slice(0, 16) ?? "",
          category: ev.category,
          max_attendees: ev.max_attendees,
          is_exclusive: ev.is_exclusive,
          is_public: ev.is_public,
          cover_image_url: ev.cover_image_url,
        }));
        const { data: live } = await api.get<any[]>(
          `/api/events/${eventId}/live-events`
        );
        live.forEach((le) => {
          if (le.title.toLowerCase().includes("poll"))
            setDraft((d) => ({
              ...d,
              with_poll: true,
              pollRequireQr: le.require_qr,
            }));
          if (le.title.toLowerCase().includes("match"))
            setDraft((d) => ({
              ...d,
              with_match: true,
              matchRequireQr: le.require_qr,
            }));
        });
      } catch {
        toast.error("Falha ao carregar evento.");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, isEdit]);
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target;
    setDraft((d) => ({
      ...d,
      [name]:
        type === "number"
          ? Number(value)
          : type === "checkbox"
          ? checked
          : value,
    }));
  };
  const onSelectCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setDraft((d) => ({ ...d, cover_image_url: url }));
    } catch {
      toast.error("Falha no upload da imagem.");
    }
  };
  const updatePoll = (field: keyof PollDraft, val: any) =>
    setDraft((d) => ({ ...d, poll: { ...d.poll, [field]: val } }));
  const updateOption = (i: number, val: string) =>
    setDraft((d) => {
      const o = [...d.poll.options];
      o[i] = val;
      return { ...d, poll: { ...d.poll, options: o } };
    });
  const handleSave = async () => {
    const { house_number, location, ...rest } = draft;
    const locParts = location.split(",").map((p) => p.trim());
    const finalLoc = [locParts[0], house_number, ...locParts.slice(1)].join(
      ", "
    );
    const payload = { ...rest, location: finalLoc };
    try {
      if (isEdit) {
        await api.patch(`/api/events/${eventId}`, payload);
        toast.success("Evento atualizado.");
      } else {
        const { data } = await api.post<{ id: string }>("/api/events", payload);
        if (draft.with_poll)
          await api.post(`/api/events/${data.id}/live-events`, {
            title: "Live Poll",
            require_qr: draft.pollRequireQr,
          });
        if (draft.with_match)
          await api.post(`/api/events/${data.id}/live-events`, {
            title: "Instant Match",
            require_qr: draft.matchRequireQr,
          });
        toast.success("Evento criado!");
      }
      navigate("/my-events", { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar.");
    }
  };
  if (loading) return <p className="p-4">Loading…</p>;
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ToastContainer position="top-center" autoClose={3000} />
      <Header />
      <div className="fixed top-16 inset-x-0 z-40 bg-white border-b">
        <div className="flex max-w-md mx-auto">
          {(["details", "dynamics"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`flex-1 py-3 text-sm font-semibold ${
                tab === t ? "iconic-gradient text-white" : "text-gray-500"
              }`}
              onClick={() => setTab(t)}
            >
              {t === "details" ? "Details" : "Dynamics"}
            </button>
          ))}
        </div>
      </div>
      <main className="flex-1 pt-28 pb-24 px-4 max-w-md mx-auto space-y-6">
        {tab === "details" && (
          <>
            <div
              className="relative w-full h-40 bg-gray-200 rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => coverInput.current?.click()}
            >
              <img
                src={draft.cover_image_url || placeholder}
                alt="cover"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white gap-1">
                <UploadCloud className="w-6 h-6" />
                <span className="text-xs">
                  {draft.cover_image_url ? "Trocar capa" : "Add cover"}
                </span>
              </div>
              <input
                hidden
                ref={coverInput}
                type="file"
                accept="image/*"
                onChange={onSelectCover}
              />
            </div>
            <label className="block">
              <span className="text-sm font-semibold">Title</span>
              <input
                name="title"
                value={draft.title}
                onChange={handleChange}
                className="w-full mt-1 p-3 rounded-xl bg-white outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Adress (without nº)</span>
              <AddressAutocomplete
                value={draft.location}
                onChange={({ full, lat, lon }) =>
                  setDraft((d) => ({ ...d, location: full, lat, lon }))
                }
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Number</span>
              <input
                name="house_number"
                value={draft.house_number}
                onChange={handleChange}
                className="w-full mt-1 p-3 rounded-xl bg-white outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Description</span>
              <textarea
                name="description"
                rows={3}
                value={draft.description}
                onChange={handleChange}
                className="w-full mt-1 p-3 rounded-xl bg-white outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Category</span>
              <select
                name="category"
                value={draft.category}
                onChange={handleChange}
                className="w-full mt-1 p-3 rounded-xl bg-white outline-none"
              >
                {["party", "drop", "dinner", "fashion_show", "other"].map(
                  (c) => (
                    <option key={c}>{c.replace("_", " ")}</option>
                  )
                )}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["start_at", "Start"],
                ["end_at", "End (optional)"],
              ].map(([n, l]) => (
                <label key={n}>
                  <span className="text-sm font-semibold">{l}</span>
                  <input
                    type="datetime-local"
                    name={n}
                    value={(draft as any)[n] || ""}
                    onChange={handleChange}
                    className="w-full mt-1 p-3 rounded-xl bg-white outline-none"
                  />
                </label>
              ))}
            </div>
            <label className="block">
              <span className="text-sm font-semibold">Maximum slots</span>
              <input
                type="number"
                name="max_attendees"
                value={draft.max_attendees}
                onChange={handleChange}
                className="w-full mt-1 p-3 rounded-xl bg-white outline-none"
              />
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                [
                  "is_public",
                  draft.is_public,
                  draft.is_public ? "Public" : "Private",
                ],
                ["is_exclusive", draft.is_exclusive, "ICONIC Exclusive"],
              ].map(([k, a, l]) => (
                <button
                  key={k as string}
                  type="button"
                  className={`px-4 py-2 text-sm rounded-full ${
                    a
                      ? "iconic-gradient text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={() =>
                    setDraft((d) => ({ ...d, [k as string]: !(a as boolean) }))
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </>
        )}
        {tab === "dynamics" && (
          <>
            <p className="text-sm text-gray-600 text-center">Choose the dynamics.</p>
            {[
              ["with_poll", "Live Poll", "Live poll"],
              ["with_match", "Instant Match", "Random groups"],
            ].map(([k, t, d]) => {
              const act = (draft as any)[k] as boolean;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setDraft((s) => ({ ...s, [k]: !act }))}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl shadow ${
                    act ? "iconic-gradient text-white" : "bg-white"
                  }`}
                >
                  <div className="flex-none w-9 h-9 rounded-full bg-black/10 flex items-center justify-center">
                    <Check
                      className={`w-5 h-5 ${
                        act ? "text-white" : "text-transparent"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{t}</h3>
                    <p className="text-xs opacity-75">{d}</p>
                  </div>
                </button>
              );
            })}
            {draft.with_poll && (
              <div className="bg-white rounded-xl p-4 space-y-4 shadow-inner">
                <h4 className="font-semibold">Configurar enquete</h4>
                <label>
                  <span className="text-xs font-medium">Pergunta</span>
                  <input
                    value={draft.poll.question}
                    onChange={(e) => updatePoll("question", e.target.value)}
                    className="w-full mt-1 p-2 rounded bg-gray-50 outline-none"
                  />
                </label>
                <label>
                  <span className="text-xs font-medium">
                    Duração (segundos)
                  </span>
                  <input
                    type="number"
                    min={5}
                    value={draft.poll.durationSec}
                    onChange={(e) =>
                      updatePoll("durationSec", Number(e.target.value))
                    }
                    className="w-full mt-1 p-2 rounded bg-gray-50 outline-none"
                  />
                </label>
                <div className="space-y-2">
                  <span className="text-xs font-medium">Opções</span>
                  {draft.poll.options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={o}
                        onChange={(e) => updateOption(i, e.target.value)}
                        className="flex-1 p-2 rounded bg-gray-50 outline-none"
                      />
                      {draft.poll.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            updatePoll(
                              "options",
                              draft.poll.options.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          <XIcon className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  ))}
                  {draft.poll.options.length < 6 && (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-primary"
                      onClick={() =>
                        updatePoll("options", [...draft.poll.options, ""])
                      }
                    >
                      <Plus className="w-4 h-4" /> adicionar opção
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, pollRequireQr: !d.pollRequireQr }))
                  }
                  className={`px-3 py-2 text-xs rounded-full ${
                    draft.pollRequireQr
                      ? "iconic-gradient text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {draft.pollRequireQr ? "Necessita bip" : "Livre (sem bip)"}
                </button>
              </div>
            )}
            {draft.with_match && (
              <div className="bg-white rounded-xl p-4 space-y-4 shadow-inner">
                <h4 className="font-semibold">Configurar match</h4>
                <label>
                  <span className="text-xs font-medium">Tamanho por grupo</span>
                  <input
                    type="number"
                    min={2}
                    value={draft.groupSize}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        groupSize: Math.max(2, Number(e.target.value)),
                      }))
                    }
                    className="w-full mt-1 p-2 rounded bg-gray-50 outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      matchRequireQr: !d.matchRequireQr,
                    }))
                  }
                  className={`px-3 py-2 text-xs rounded-full ${
                    draft.matchRequireQr
                      ? "iconic-gradient text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {draft.matchRequireQr ? "Necessita bip" : "Livre (sem bip)"}
                </button>
              </div>
            )}
          </>
        )}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl iconic-gradient text-white font-semibold"
          >
            Save
          </button>
        </div>
      </main>
      <BottomNav />
      <style>{`@keyframes gradient-pan{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}.iconic-gradient{background:linear-gradient(90deg,#A855F7,#EC4899,#A855F7);background-size:200% 200%;animation:gradient-pan 4s linear infinite}`}</style>
    </div>
  );
}
