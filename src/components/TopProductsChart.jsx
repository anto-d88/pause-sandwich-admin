import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function TopProductsChart({ data }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <h2 className="mb-4 text-lg font-semibold">Top produits vendus</h2>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis type="number" stroke="#94a3b8" />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#94a3b8"
              width={120}
            />
            <Tooltip
              contentStyle={{
                background: "#020617",
                border: "1px solid #334155",
                borderRadius: "12px",
              }}
            />
            <Bar dataKey="quantity" fill="#a855f7" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}