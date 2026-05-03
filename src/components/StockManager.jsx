import { useState } from "react";
import { Minus, Plus, RefreshCcw } from "lucide-react";
import { updateProductStock } from "../services/stockService";

export default function StockManager({ products = [], onStockUpdated }) {
  const [loadingId, setLoadingId] = useState(null);

  async function handleUpdate(product, newStock) {
    try {
      setLoadingId(product.id);
      await updateProductStock(product.id, newStock);
      await onStockUpdated();
    } catch (error) {
      console.error(error);
      alert("Erreur pendant la mise à jour du stock.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Gestion du stock</h2>
          <p className="text-sm text-slate-400">
            Modification rapide des quantités disponibles.
          </p>
        </div>
        <RefreshCcw className="text-cyan-300" size={20} />
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
        {products.length === 0 ? (
          <p className="text-slate-400">Aucun produit trouvé.</p>
        ) : (
          products.map((product) => {
            const stock = Number(product.display_stock || 0);

            let badge = "bg-emerald-500/20 text-emerald-200";
            let label = "OK";

            if (stock === 0) {
              badge = "bg-red-500/20 text-red-200";
              label = "Rupture";
            } else if (stock <= 3) {
              badge = "bg-orange-500/20 text-orange-200";
              label = "Faible";
            }

            return (
              <div
                key={product.id}
                className="rounded-xl border border-white/10 bg-slate-950/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {product.display_name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {product.display_category}
                    </p>
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs ${badge}`}>
                    {label}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdate(product, stock - 1)}
                    disabled={loadingId === product.id}
                    className="rounded-xl bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30 disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>

                  <input
                    type="number"
                    value={stock}
                    min="0"
                    onChange={(e) => handleUpdate(product, e.target.value)}
                    className="w-24 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-white outline-none focus:border-cyan-400"
                  />

                  <button
                    onClick={() => handleUpdate(product, stock + 1)}
                    disabled={loadingId === product.id}
                    className="rounded-xl bg-emerald-500/20 p-2 text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>

                  <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                    Stock : {stock}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}