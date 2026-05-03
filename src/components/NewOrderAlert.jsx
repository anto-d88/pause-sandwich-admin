import { Bell, X } from "lucide-react";

export default function NewOrderAlert({ visible, order, onClose }) {
  if (!visible) return null;

  return (
    <div className="fixed right-5 top-5 z-50 w-[90%] max-w-md rounded-2xl border border-emerald-400/30 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-300">
          <Bell size={22} />
        </div>

        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">
            Nouvelle commande
          </p>

          <h3 className="mt-1 text-lg font-bold">
            {order?.customer_name || "Client"}
          </h3>

          <p className="mt-1 text-sm text-slate-300">
            Créneau : {order?.delivery_slot || "non précisé"}
          </p>

          <p className="mt-1 text-sm text-slate-300">
            Total :{" "}
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(order?.total_amount || 0)}
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}