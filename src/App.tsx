import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Registration from "./components/Registration";
import MainPortal from "./components/MainPortal";
import AdminDashboard from "./components/AdminDashboard";
import type { JSX } from "react";
import AdminDashboardV2 from "./components/AdminDashboardV2";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { student } = useAuth();
  
  if (!student) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// 1. Create a Footer Component
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-6 mt-auto bg-slate-50 border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500">
        <div className="text-sm font-medium">
          © {currentYear} <span className="text-cyan-600 font-bold">Karpi AI</span>. All rights reserved.
        </div>
        <div className="text-sm">
          Designed and Developed by <span className="text-slate-800 font-bold uppercase tracking-tight">Venkatraj Selvakumar</span>
        </div>
      </div>
    </footer>
  );
};

function AppRoutes() {
  const { student } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Routes>
          <Route 
            path="/" 
            element={student ? <Navigate to="/portal" replace /> : <Registration />} 
          />
          <Route 
            path="/portal" 
            element={
              <ProtectedRoute>
                <MainPortal /> 
              </ProtectedRoute>
            } 
          />
          <Route path="/admin" element={<AdminDashboardV2 />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* 2. Add the Footer here so it shows on every page */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;