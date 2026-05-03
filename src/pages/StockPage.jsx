import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import StockManager from "../components/StockManager";
import { getDashboardData } from "../services/dashboardService";
import { RefreshCcw, Package } from "lucide-react";

export default function StockPage({ activePage, setActivePage }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadStock() {
    setLoading(true);

    try {
      const data = await getDashboardData();
      setProducts(data.lists.products || []);
    } catch (error) {
      console.error(error);
      alert("Erreur chargement stock");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadStock();
  }, []);

  const totalProducts = products.length;
  const rupture = products.filter((p) => Number(p.display_stock || 0) === 0).length;
  const faible = products.filter(
    (p) => Number(p.display_stock || 0) > 0 && Number(p.display_stock || 0) <= 3
  ).length;

  return (
    <MainLayout activePage={activePage} setActivePage={setActivePage}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            STOCK
          </p>
          <h1 className="mt-2 text-3xl font-black">Gestion du stock</h1>
          <p className="mt-2 text-slate-400">
            Modifie les quantités disponibles en direct.
          </p>
        </div>

        <button
          onClick={loadStock}
          className="flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-cyan-200"
        >
          <RefreshCcw size={18} />
          Actualiser
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5">
          <Package className="mb-3 text-blue-300" />
          <p className="text-sm text-slate-400">Produits</p>
          <p className="text-3xl font-black">{totalProducts}</p>
        </div>

        <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-5">
          <p className="text-sm text-slate-400">Stock faible</p>
          <p className="text-3xl font-black text-orange-300">{faible}</p>
        </div>

        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
          <p className="text-sm text-slate-400">Rupture</p>
          <p className="text-3xl font-black text-red-300">{rupture}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400">Chargement...</p>
      ) : (
        <StockManager products={products} onStockUpdated={loadStock} />
      )}
    </MainLayout>
  );
}