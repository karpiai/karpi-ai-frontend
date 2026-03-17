/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Users, LayoutDashboard, Activity, School, ArrowLeft, TrendingUp } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AdminDashboard = ({ goBack }: { goBack: () => void }) => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // AbortController prevents the "double fire" from causing issues
    const controller = new AbortController();

    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
          signal: controller.signal 
        });
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Dashboard error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    return () => controller.abort(); // Cleanup on unmount
  }, []);

  // Dynamic Totals based on real database data
  const totalInstitutions = stats.length;
  const totalRequests = stats.reduce((acc, curr) => acc + curr.requests, 0);
  const totalStudents = stats.reduce((acc, curr) => acc + (curr.students || 0), 0);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-cyan-400 font-mono animate-pulse">Loading Analytics...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft />
          </button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-cyan-400" /> Karpi SaaS Admin
          </h1>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-lg text-cyan-400 font-bold text-sm">
          Live Trials
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <MetricCard icon={<School />} title="Institutions" value={totalInstitutions} color="blue" />
        {/* Note: Student count will show 0 until we add the .count() logic to backend */}
        <MetricCard icon={<Users />} title="Total Students" value={totalStudents} color="purple" />
        <MetricCard icon={<Activity />} title="AI Queries" value={totalRequests} color="cyan" />
      </div>

      {/* Institution Table */}
      <div className="max-w-6xl mx-auto bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold">Partner Institutions</h2>
          <TrendingUp size={20} className="text-cyan-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-b border-slate-700">College Name</th>
                <th className="px-6 py-4 border-b border-slate-700 text-center">Requests</th>
                <th className="px-6 py-4 border-b border-slate-700 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {stats.map((col, i) => (
                <tr key={i} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-5 font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                    {col.name}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-slate-900 px-4 py-1.5 rounded-lg text-sm font-mono border border-slate-700 text-cyan-400 shadow-inner">
                      {col.requests}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold uppercase tracking-tighter border border-green-500/20">
                      {col.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-500 italic">
                    No active usage data found in Supabase.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function MetricCard({ icon, title, value, color }: any) {
  const colorMap: any = {
    blue: "text-blue-400 border-blue-500/20",
    purple: "text-purple-400 border-purple-500/20",
    cyan: "text-cyan-400 border-cyan-500/20",
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl hover:border-slate-500 transition-all duration-300">
      <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${colorMap[color]}`}>
        {icon} {title}
      </div>
      <div className="text-4xl font-black tabular-nums">{value}</div>
    </div>
  );
}

export default AdminDashboard;