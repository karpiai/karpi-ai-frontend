import { useState, useEffect } from "react";
import Registration from "./components/Registration";
import MainPortal from "./components/MainPortal";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userContext, setUserContext] = useState({
    name: "",
    collegeName: "",
    rollNo: "",
  });

  // Simple logic to check for /admin in the URL
  useEffect(() => {
    if (window.location.pathname === "/admin") {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("karpi_user");
    if (savedUser) {
      setUserContext(JSON.parse(savedUser));
      setIsRegistered(true);
    }
  }, []);

  const handleRegistrationSuccess = (userData: any) => {
    setUserContext(userData);
    setIsRegistered(true);
  };

  const handleLogout = () => {
    // 1. Clear storage
    localStorage.removeItem("karpi_user");
    // 2. Reset state to trigger the Registration view
    setIsRegistered(false);
    setUserContext({ name: "", collegeName: "", rollNo: "" });
    // 3. Optional: Replace history to prevent "Back" button returns
    window.history.replaceState(null, "", "/");
  };

  if (isAdmin) {
    return <AdminDashboard goBack={() => setIsAdmin(false)} />;
  }

  return (
    <>
      {!isRegistered ? (
        <Registration onRegisterSuccess={handleRegistrationSuccess} />
      ) : (
        <MainPortal userContext={userContext} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
