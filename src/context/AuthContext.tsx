import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

// Define the exact shape of your SaaS Student Profile
export interface StudentProfile {
  id: string;
  name: string;
  rollNo: string;
  department: string; 
  semester: number;
  collegeName: string;
  institutionId: string; // CRITICAL for billing and admin features
  // --- SCALABLE ARCHITECTURE FIELDS ---
  programId: string; // e.g., "6bf348ad-a999-4dbc-b006-643e0ac863b8" for B.Ed
  departmentId: string; // e.g., "33f8e401-5bdb-4e4f-835a-876aac8a6a60" for General
  medium: string; // e.g., "English" or "Tamil"
}

interface AuthContextType {
  student: StudentProfile | null;
  login: (profile: StudentProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Replaces the useEffect from your old App.tsx
  useEffect(() => {
    const savedUser = sessionStorage.getItem("karpi_user");
    if (savedUser) {
      setStudent(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (profile: StudentProfile) => {
    sessionStorage.setItem("karpi_user", JSON.stringify(profile));
    setStudent(profile);
  };

  const logout = () => {
    sessionStorage.removeItem("karpi_user");
    setStudent(null);
  };

  // Don't render routes until we've checked local storage
  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ student, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};