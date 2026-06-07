import { useEffect, useState } from "react";
import {
  Power,
  Coffee,
  Clock,
  RefreshCw,
  Sandwich,
  Salad,
  CupSoda,
  CakeSlice,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import {
  getControlData,
  toggleDeliverySlot,
  toggleSetting,
} from "../services/dashboardService";

function StatusBadge({ active, trueLabel = "Ouvert", falseLabel = "Fermé" }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        active
          ? "bg-emerald-500/20 text-emerald-200"
          : "bg-red-500/20 text-red-200"
      }`}
    >
      {active ? `🟢 ${trueLabel}` : `🔴 ${falseLabel}`}
    </span>
  );
}

function ControlCard({ title, description, active, icon: Icon, onToggle }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
            <Icon size={22} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          </div>
        </div>

        <StatusBadge active={active} />
      </div>

      <button
        onClick={onToggle}
        className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
          active
            ? "bg-red-500/20 text-red-200 hover:bg-red-500/30"
            : "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
        }`}
      >
        {active ? "Fermer" : "Ouvrir"}
      </button>
    </div>
  );
}

function SlotRow({ slot, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#020617]/60 p-4">
      <div>
        <p className="font-bold text-white">{slot.label}</p>
        <p className="text-sm text-slate-400">
          {slot.slot_type === "breakfast" ? "Petit-déjeuner" : "Déjeuner"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge
          active={slot.active}
          trueLabel="Actif"
          falseLabel="Fermé"
        />

        <button
          onClick={() => onToggle(slot.id)}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            slot.active
              ? "bg-red-500/20 text-red-200 hover:bg-red-500/30"
              : "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
          }`}
        >
          {slot.active ? "Fermer" : "Ouvrir"}
        </button>
      </div>
    </div>
  );
}

export default function ControlPage({ activePage, setActivePage }) {
  const [settings, setSettings] = useState({});
  const [deliverySlots, setDeliverySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");

  async function loadControlData() {
    try {
      setLoading(true);
      const data = await getControlData();

      setSettings(data.settings || {});
      setDeliverySlots(data.deliverySlots || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le centre de contrôle.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSetting(key) {
    try {
      setSavingKey(key);
      await toggleSetting(key);
      await loadControlData();
    } catch (err) {
      console.error(err);
      setError("Impossible de modifier ce paramètre.");
    } finally {
      setSavingKey("");
    }
  }

  async function handleToggleSlot(slotId) {
    try {
      setSavingKey(`slot-${slotId}`);
      await toggleDeliverySlot(slotId);
      await loadControlData();
    } catch (err) {
      console.error(err);
      setError("Impossible de modifier ce créneau.");
    } finally {
      setSavingKey("");
    }
  }

  useEffect(() => {
    loadControlData();
  }, []);

  const breakfastSlots = deliverySlots.filter(
    (slot) => slot.slot_type === "breakfast"
  );

  const lunchSlots = deliverySlots.filter((slot) => slot.slot_type === "lunch");

  if (loading) {
    return (
      <MainLayout activePage={activePage} setActivePage={setActivePage}>
        <p className="text-slate-400">Chargement du centre de contrôle...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout activePage={activePage} setActivePage={setActivePage}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            PILOTAGE
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Centre de contrôle
          </h1>
          <p className="mt-2 text-slate-400">
            Ouvre ou ferme l’application, les catégories et les créneaux sans toucher au code.
          </p>
        </div>

        <button
          onClick={loadControlData}
          className="flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
        >
          <RefreshCw size={18} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {savingKey && (
        <div className="mb-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-200">
          Mise à jour en cours...
        </div>
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ControlCard
          title="Application"
          description="Ferme ou ouvre toute l’application publique."
          active={settings.app_open === "true"}
          icon={Power}
          onToggle={() => handleToggleSetting("app_open")}
        />

        <ControlCard
          title="Sandwichs"
          description="Affiche ou masque les sandwichs dans le menu."
          active={settings.sandwiches_open === "true"}
          icon={Sandwich}
          onToggle={() => handleToggleSetting("sandwiches_open")}
        />

        <ControlCard
          title="Bowls / Salades"
          description="Affiche ou masque les petits et grands bowls."
          active={settings.salads_open === "true"}
          icon={Salad}
          onToggle={() => handleToggleSetting("salads_open")}
        />

        <ControlCard
          title="Boissons"
          description="Affiche ou masque les boissons."
          active={settings.drinks_open === "true"}
          icon={CupSoda}
          onToggle={() => handleToggleSetting("drinks_open")}
        />

        <ControlCard
          title="Desserts"
          description="Affiche ou masque les desserts."
          active={settings.desserts_open === "true"}
          icon={CakeSlice}
          onToggle={() => handleToggleSetting("desserts_open")}
        />

        <ControlCard
          title="Petit-déjeuner"
          description="Affiche ou masque la nouvelle offre petit-déjeuner."
          active={settings.breakfast_open === "true"}
          icon={Coffee}
          onToggle={() => handleToggleSetting("breakfast_open")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-300">
              <Clock size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Créneaux petit-déjeuner
              </h2>
              <p className="text-sm text-slate-400">
                Livraison matin : 08h00, 09h00, 10h00, 11h00.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {breakfastSlots.length === 0 ? (
              <p className="text-slate-400">Aucun créneau petit-déjeuner.</p>
            ) : (
              breakfastSlots.map((slot) => (
                <SlotRow
                  key={slot.id}
                  slot={slot}
                  onToggle={handleToggleSlot}
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
              <Clock size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Créneaux déjeuner
              </h2>
              <p className="text-sm text-slate-400">
                Livraison déjeuner : 11h00 et 12h30.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {lunchSlots.length === 0 ? (
              <p className="text-slate-400">Aucun créneau déjeuner.</p>
            ) : (
              lunchSlots.map((slot) => (
                <SlotRow
                  key={slot.id}
                  slot={slot}
                  onToggle={handleToggleSlot}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}