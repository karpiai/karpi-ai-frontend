import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Registration from "./components/Registration";
import MainPortal from "./components/MainPortal";
import AdminDashboard from "./components/AdminDashboard";
import type { JSX } from "react";

// 🛡️ The Gatekeeper: Prevents unauthenticated access to the AI tools
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { student } = useAuth();
  
  if (!student) {
    // If no student is in memory, kick them back to the login page
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// We separate AppRoutes so useAuth can exist inside the AuthProvider
function AppRoutes() {
  const { student } = useAuth();

  return (
    <Routes>
      {/* If they are already logged in and try to go to "/", 
        push them directly to the portal. Otherwise, show Registration.
      */}
      <Route 
        path="/" 
        element={student ? <Navigate to="/portal" replace /> : <Registration />} 
      />

      <Route 
        path="/portal" 
        element={
          <ProtectedRoute>
            {/* Notice we no longer need to pass userContext or onLogout as props! */}
            <MainPortal /> 
          </ProtectedRoute>
        } 
      />

      <Route path="/admin" element={<AdminDashboard />} />

      {/* Catch-all: If someone types a random URL, send them home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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