import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import karpiLogo from "../assets/logo.png"; // Make sure to have a logo in this path or update accordingly

interface StudentMetric {
    rollNumber: string;
    name: string;
    department: string;
    semester: number;
    wordsUsed: number;
}

interface UsageLog {
    id: string;
    studentName: string;
    rollNumber: string;
    department: string;
    semester: number;
    subjectName: string;
    mode: string;
    topic: string;
    createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    
    const [accessCode, setAccessCode] = useState<string>('');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false); // State for the sync button
    const [error, setError] = useState<string>('');
    
    const [metrics, setMetrics] = useState<StudentMetric[]>([]);
    const [logs, setLogs] = useState<UsageLog[]>([]);
    const [institutionName, setInstitutionName] = useState<string>('');
    const [totalStudents, setTotalStudents] = useState<number>(0);

    // --- FEATURE 1: Session Persistence & Data Fetching ---
    const fetchDashboardData = async (code: string, silentRefresh = false) => {
        if (!silentRefresh) setLoading(true);
        else setIsRefreshing(true);
        setError('');

        try {
            const metricRes = await fetch(`${API_BASE_URL}/admin/metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessCode: code })
            });
            const metricData = await metricRes.json();
            if (!metricRes.ok) throw new Error(metricData.error || 'Failed to authenticate');

            const logRes = await fetch(`${API_BASE_URL}/admin/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessCode: code })
            });
            const logData = await logRes.json();
            if (!logRes.ok) throw new Error(logData.error || 'Failed to fetch logs');

            setInstitutionName(metricData.institutionName);
            setTotalStudents(metricData.totalStudentsRegistered);
            setMetrics(metricData.metrics);
            setLogs(logData.logs);
            setIsAuthenticated(true);
            
            // Save to session storage so reloads don't log them out
            sessionStorage.setItem('adminAccessCode', code);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            setIsAuthenticated(false);
            sessionStorage.removeItem('adminAccessCode');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    // Auto-login on page reload if session exists
    useEffect(() => {
        const savedCode = sessionStorage.getItem('adminAccessCode');
        if (savedCode) {
            setAccessCode(savedCode);
            fetchDashboardData(savedCode);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        fetchDashboardData(accessCode);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setAccessCode('');
        sessionStorage.removeItem('adminAccessCode');
    };

   // --- VIEW 1: Login Screen ---
    if (!isAuthenticated) {
        return (
            // CRITICAL FIX: Added w-full and ensured flex-col is present to stack elements vertically
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 w-full">
                
                {/* --- LOGO CONTAINER --- */}
                <div className="mb-6 flex justify-center w-full">
                    <img 
                        src={karpiLogo} 
                        alt="Karpi AI Logo" 
                        // Bumped height from h-24/28 to h-36/48 for massive legibility
                        className="h-35 md:h-45 w-auto object-contain rounded-2xl shadow-md" 
                    />
                </div>

                {/* --- LOGIN CARD --- */}
                <Card title="Institutional Admin Access" className="w-full max-w-md shadow-lg rounded-xl border-none">
                    <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-2">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="accessCode" className="text-sm font-semibold text-gray-700">Enter Admin Access Code</label>
                            <InputText 
                                id="accessCode" 
                                type="password" 
                                value={accessCode} 
                                onChange={(e) => setAccessCode(e.target.value)} 
                                placeholder="e.g. ADMIN-2026" 
                                className="w-full p-2 border border-gray-300 rounded-md" 
                            />
                        </div>
                        {error && <small className="text-red-500 font-medium">{error}</small>}
                        <Button 
                            label={loading ? "Verifying..." : "Access Dashboard"} 
                            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-lock-open"} 
                            disabled={!accessCode || loading} 
                            type="submit" 
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 border-none p-3 font-bold" 
                        />
                    </form>

                    <div className="mt-6 border-t border-gray-100 pt-4 text-center">
                        <button 
                            onClick={() => navigate('/')} 
                            className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full bg-transparent border-none cursor-pointer"
                        >
                            <i className="pi pi-arrow-left text-xs translate-y-[1px]"></i>
                            Return to Student Login
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    // --- VIEW 2: Data Dashboard ---
    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-blue-800 m-0">{institutionName}</h1>
                    <p className="text-gray-600 m-0 mt-1 text-lg">Institutional Intelligence & Audit</p>
                </div>
                
                <div className="flex gap-4 items-center">
                    <div className="bg-white p-4 shadow-md rounded-lg border-t-4 border-blue-600 flex items-center gap-4">
                        <i className="pi pi-users text-blue-600 text-3xl"></i>
                        <div>
                            <span className="text-gray-500 font-medium block text-sm mb-1">Total Registered</span>
                            <div className="text-gray-900 font-bold text-2xl">{totalStudents} Students</div>
                        </div>
                    </div>
                    
                    {/* --- FEATURE 2: Sync & Logout Buttons --- */}
                    <div className="flex gap-2">
                        <Button 
                            icon={isRefreshing ? "pi pi-spin pi-spinner" : "pi pi-sync"} 
                            severity="info" 
                            outlined 
                            rounded
                            onClick={() => fetchDashboardData(accessCode, true)} 
                            tooltip="Refresh Live Data"
                            tooltipOptions={{ position: 'bottom' }}
                            className="bg-white"
                        />
                        <Button 
                            icon="pi pi-sign-out" 
                            severity="secondary" 
                            outlined 
                            rounded
                            onClick={handleLogout} 
                            tooltip="Secure Log Out"
                            tooltipOptions={{ position: 'bottom' }}
                            className="bg-white"
                        />
                    </div>
                </div>
            </div>

            <Card className="shadow-lg rounded-xl overflow-hidden border-none p-0">
                <TabView className="w-full">
                    {/* TAB 1: High-Level Metrics */}
                    <TabPanel header="Student Metrics" leftIcon="pi pi-chart-bar mr-2">
                        <DataTable value={metrics} paginator rows={10} rowsPerPageOptions={[10, 25, 50]} dataKey="rollNumber" emptyMessage="No student activity found." className="p-datatable-sm w-full" stripedRows removableSort tableStyle={{ minWidth: '50rem' }}>
                            <Column field="rollNumber" header="Roll Number" sortable style={{ width: '15%' }}></Column>
                            <Column field="name" header="Student Name" sortable style={{ width: '25%' }}></Column>
                            <Column field="department" header="Department" sortable style={{ width: '25%' }}></Column>
                            <Column field="semester" header="Sem" sortable align="center" style={{ width: '15%' }}></Column>
                            <Column field="wordsUsed" header="Words Generated" sortable style={{ width: '20%' }} body={(rowData) => <span className="font-bold text-blue-600">{rowData.wordsUsed.toLocaleString()} words</span>}></Column>
                        </DataTable>
                    </TabPanel>

                    {/* TAB 2: Detailed Audit Trail (Now with Department!) */}
                    <TabPanel header="Detailed Audit Log" leftIcon="pi pi-list mr-2">
                        <DataTable value={logs} paginator rows={10} rowsPerPageOptions={[10, 50, 100]} dataKey="id" emptyMessage="No queries logged yet." className="p-datatable-sm w-full" stripedRows removableSort tableStyle={{ minWidth: '65rem' }}>
                            <Column field="createdAt" header="Timestamp" sortable style={{ width: '10%' }}></Column>
                            <Column field="rollNumber" header="Roll No." sortable style={{ width: '8%' }}></Column>
                            <Column field="studentName" header="Name" sortable style={{ width: '12%' }}></Column>
                            <Column field="department" header="Dept" sortable style={{ width: '12%' }}></Column>
                            <Column field="semester" header="Sem" sortable align="center" style={{ width: '5%' }}></Column>
                            <Column field="subjectName" header="Subject" sortable style={{ width: '18%' }}></Column>
                            <Column field="mode" header="Mode" sortable style={{ width: '10%' }} body={(rowData) => <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase">{rowData.mode}</span>}></Column>
                            <Column field="topic" header="Query / Topic" style={{ width: '25%' }}></Column>
                        </DataTable>
                    </TabPanel>
                </TabView>
            </Card>
        </div>
    );
};

export default AdminDashboard;