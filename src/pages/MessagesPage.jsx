import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { supabase } from "../services/supabase";
import { MessageSquare, RefreshCcw } from "lucide-react";

export default function MessagesPage({ activePage, setActivePage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadMessages() {
    setLoading(true);

    const { data, error } = await supabase
      .from("customer_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erreur chargement messages");
    } else {
      setMessages(data || []);
    }

    setLoading(false);
  }

  async function updateStatus(messageId, status) {
    const { error } = await supabase
      .from("customer_messages")
      .update({ status })
      .eq("id", messageId);

    if (error) {
      console.error(error);
      alert("Erreur changement statut");
      return;
    }

    await loadMessages();
  }

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <MainLayout activePage={activePage} setActivePage={setActivePage}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            MESSAGES
          </p>
          <h1 className="mt-2 text-3xl font-black">Messages clients</h1>
          <p className="mt-2 text-slate-400">
            Questions, suggestions, réclamations et demandes de réunion.
          </p>
        </div>

        <button
          onClick={loadMessages}
          className="flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-cyan-200"
        >
          <RefreshCcw size={18} />
          Actualiser
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
        {loading ? (
          <p className="text-slate-400">Chargement...</p>
        ) : messages.length === 0 ? (
          <p className="text-slate-400">Aucun message.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isMeeting = String(
                message.type || message.category || message.subject || ""
              )
                .toLowerCase()
                .includes("réunion");

              return (
                <div
                  key={message.id}
                  className={`rounded-2xl border p-5 ${
                    isMeeting
                      ? "border-purple-400/30 bg-purple-500/10"
                      : "border-white/10 bg-slate-950/50"
                  }`}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="text-cyan-300" size={20} />
                        <h2 className="text-xl font-bold">
                          {message.subject || message.type || "Message client"}
                        </h2>
                      </div>

                      {isMeeting && (
                        <p className="mt-2 w-fit rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-200">
                          Demande réunion prioritaire
                        </p>
                      )}

                      <p className="mt-4 text-slate-200">
                        {message.message || message.content || "-"}
                      </p>

                      <div className="mt-4 grid gap-2 text-sm text-slate-400 md:grid-cols-2">
                        <p>Nom : {message.name || message.customer_name || "-"}</p>
                        <p>Téléphone : {message.phone || message.customer_phone || "-"}</p>
                        <p>Email : {message.email || message.customer_email || "-"}</p>
                        <p>Date souhaitée : {message.meeting_date || "-"}</p>
                        <p>Heure souhaitée : {message.meeting_time || "-"}</p>
                      </div>
                    </div>

                    <div className="min-w-[220px]">
                      <select
                        value={message.status || "nouveau"}
                        onChange={(e) => updateStatus(message.id, e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none"
                      >
                        <option value="nouveau">Nouveau</option>
                        <option value="en cours">En cours</option>
                        <option value="traité">Traité</option>
                      </select>

                      <p className="mt-3 text-sm text-slate-500">
                        {message.created_at
                          ? new Date(message.created_at).toLocaleString("fr-FR")
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}