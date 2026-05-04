import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { supabase } from "../services/supabase";

function playSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(900, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.6);
  } catch (error) {
    console.warn("Son bloqué :", error);
  }
}

function sendBrowserNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "/favicon.ico",
  });
}

export default function AdminNotifications() {
  const [enabled, setEnabled] = useState(false);
  const [alert, setAlert] = useState(null);
  const firstLoadDone = useRef(false);

  async function activateNotifications() {
    try {
      if ("Notification" in window && Notification.permission !== "granted") {
        await Notification.requestPermission();
      }

      setEnabled(true);
      playSound();

      setAlert({
        title: "Notifications activées",
        message: "Tu seras prévenu à chaque nouvelle commande.",
      });

      setTimeout(() => setAlert(null), 4000);
    } catch (error) {
      console.error(error);
      alert("Impossible d’activer les notifications.");
    }
  }

  function handleNewOrder(order, type) {
    if (!firstLoadDone.current || !enabled) return;

    const title =
      type === "team"
        ? "Nouvelle commande équipe"
        : "Nouvelle commande individuelle";

    const client =
      order.customer_name ||
      order.contact_name ||
      order.name ||
      "Nouveau client";

    const slot =
      order.delivery_slot ||
      order.delivery_time ||
      order.slot ||
      "créneau non précisé";

    playSound();

    sendBrowserNotification(title, `${client} · ${slot}`);

    setAlert({
      title,
      message: `${client} · ${slot}`,
    });

    setTimeout(() => setAlert(null), 10000);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      firstLoadDone.current = true;
    }, 2000);

    const channel = supabase
      .channel("admin-global-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          handleNewOrder(payload.new, "individual");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_orders",
        },
        (payload) => {
          handleNewOrder(payload.new, "team");
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[9999]">
        {!enabled && (
          <button
            onClick={activateNotifications}
            className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500 px-4 py-3 font-black text-slate-950 shadow-2xl hover:bg-emerald-400"
          >
            <Bell size={18} />
            Activer notifications
          </button>
        )}
      </div>

      {alert && (
        <div className="fixed right-4 top-4 z-[9999] w-[90%] max-w-md rounded-2xl border border-cyan-400/30 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-cyan-500/20 p-3 text-cyan-300">
              <Bell size={22} />
            </div>

            <div className="flex-1">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
                Alerte admin
              </p>
              <h3 className="mt-1 text-lg font-black">{alert.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{alert.message}</p>
            </div>

            <button
              onClick={() => setAlert(null)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}