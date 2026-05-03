export default function KpiCard({ title, value, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "from-blue-500/20 to-cyan-500/10 border-blue-400/20",
    green: "from-emerald-500/20 to-green-500/10 border-emerald-400/20",
    orange: "from-orange-500/20 to-yellow-500/10 border-orange-400/20",
    red: "from-red-500/20 to-pink-500/10 border-red-400/20",
    purple: "from-purple-500/20 to-indigo-500/10 border-purple-400/20",
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${tones[tone]} p-5 shadow-xl backdrop-blur`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>

        {Icon && (
          <div className="rounded-xl bg-white/10 p-3">
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}