import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import the router hook
import { useAuth } from "../context/AuthContext"; // Import our global memory
import { UserPlus, PenTool, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import karpiLogo from "../assets/logo.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Notice: We completely removed the Props!
const Registration = () => {
  const navigate = useNavigate(); // Tool to change pages
  const { login } = useAuth();    // Tool to save student session
  
  const [regData, setRegData] = useState({ name: "", rollNo: "", accessCode: "" });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      });

      const data = await res.json();

      if (res.ok) {
        // Construct the SaaS Profile based on backend response
        const userData = {
          id: data.studentId || "temp-id-replace-me", // CRITICAL for billing
          name: data.studentName,
          collegeName: data.collegeName,
          rollNo: regData.rollNo,
          department: data.department || "B.Ed.",
          semester: data.semester || 1,
        };

        // 1. Save to global context (which handles localStorage automatically)
        login(userData); 
        
        // 2. Teleport the user to the portal!
        navigate("/portal"); 
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Connection to auth server failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1f38] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-cyan-500/20">
        <div className="bg-gradient-to-r from-[#0b1f38] to-[#132f50] p-8 text-center border-b border-cyan-500/30">
          <div className="bg-white p-3 rounded-2xl inline-block mb-4 shadow-lg">
            <img src={karpiLogo} alt="Karpi Logo" className="h-30 w-auto" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Student Portal</h2>
          <p className="text-cyan-400 text-sm font-medium mt-1">Activate Institutional License</p>
        </div>

        <form onSubmit={handleRegister} className="p-8 space-y-5">
          <div className="space-y-4">
            <div className="relative">
              <UserPlus className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                placeholder="Full Name"
                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
              />
            </div>

            <div className="relative">
              <PenTool className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                placeholder="Roll Number / College ID"
                onChange={(e) => setRegData({ ...regData, rollNo: e.target.value })}
              />
            </div>

            <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
              <label className="text-xs font-bold text-cyan-700 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <ShieldCheck size={14} /> College Access Code
              </label>
              <input
                required
                type="text"
                className="w-full p-3 bg-white border border-cyan-200 rounded-lg outline-none font-mono text-center tracking-widest uppercase"
                placeholder="Ex: COLLEGE-NAME-2026"
                onChange={(e) => setRegData({ ...regData, accessCode: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Access AI Tools <CheckCircle2 size={20} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registration;