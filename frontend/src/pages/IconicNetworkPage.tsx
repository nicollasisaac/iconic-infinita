// src/pages/IconicNetworkPage.tsx
import React, { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { IconicChat } from "@/components/IconicChat";
import { BecomeIconicCard } from "@/components/BecomeIconicCard";
import { UserGrid } from "@/components/UserGrid";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@suiet/wallet-kit";
import { usePaywall } from "@/lib/sui";
import { MessageSquare, Users } from "lucide-react";

const tabList = [
  { key: "chat", icon: <MessageSquare className="w-5 h-5" /> },
  { key: "members", icon: <Users className="w-5 h-5" /> },
];

export default function IconicNetworkPage() {
  const { isIconic, user, token } = useAuth();
  const { connected, connect } = useWallet();
  const { payFee } = usePaywall();
  const [waiting, setWaiting] = useState(false);
  const [tab, setTab] = useState<"chat" | "members">("chat");

  const handleSubscribe = async () => {
    if (!connected) {
      await connect();
      return;
    }
    setWaiting(true);
    try {
      const txId = await payFee(0.1);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/iconic/${user!.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Transaction-Id": txId,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      if (res.ok) window.location.reload();
      else if (res.status === 403)
        alert("Pending promotion: please refresh after confirmation.");
      else throw new Error("Unexpected error: " + res.status);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error during upgrade process.");
    } finally {
      setWaiting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pt-16 pb-24">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden w-full max-w-4xl mx-auto">
        {!isIconic ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <BecomeIconicCard
              connected={connected}
              connect={connect}
              waiting={waiting}
              onSubscribe={handleSubscribe}
            />
          </div>
        ) : (
          <>
            <div className="flex gap-4 p-4 justify-center">
              {tabList.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  className={`flex flex-col items-center py-2 px-4 rounded-full transition ${
                    tab === t.key
                      ? "iconic-gradient text-white scale-105 font-bold"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {t.icon}
                  <span className="text-xs mt-1 capitalize">{t.key}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 flex overflow-hidden px-4">
              <div className="flex-1 h-full flex flex-col">
                {tab === "chat" ? (
                  <IconicChat />
                ) : (
                  <UserGrid endpoint="/iconic/members" />
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
      <style>{`@keyframes gradient-pan{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}.animate-gradient-pan{background-size:200% 200%;animation:gradient-pan 4s linear infinite;}.iconic-gradient{background:linear-gradient(90deg,#A855F7,#EC4899,#A855F7,#FDE68A);background-size:300% 300%;animation:gradient-pan 4s linear infinite;}`}</style>
    </div>
  );
}
