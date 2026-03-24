import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';

interface StudentMetric {
    rollNumber: string;
    name: string;
    department: string;
    semester: number;
    wordsUsed: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const AdminDashboard: React.FC = () => {
    const [accessCode, setAccessCode] = useState<string>('');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    
    const [metrics, setMetrics] = useState<StudentMetric[]>([]);
    const [institutionName, setInstitutionName] = useState<string>('');
    const [totalStudents, setTotalStudents] = useState<number>(0);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessCode })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to authenticate');
            }

            setInstitutionName(data.institutionName);
            setTotalStudents(data.totalStudentsRegistered);
            setMetrics(data.metrics);
            setIsAuthenticated(true);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    // --- VIEW 1: Login Screen (Tailwind Styled) ---
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <Card title="Institutional Admin Access" className="w-full max-w-md shadow-lg rounded-xl">
                    <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-2">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="accessCode" className="text-sm font-semibold text-gray-700">
                                Enter Admin Access Code
                            </label>
                            <InputText 
                                id="accessCode" 
                                type="password" 
                                value={accessCode} 
                                onChange={(e) => setAccessCode(e.target.value)} 
                                placeholder="e.g. JPE-ADMIN-2026"
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
                </Card>
            </div>
        );
    }

    // --- VIEW 2: Data Dashboard (Tailwind Styled) ---
    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-blue-800 m-0">{institutionName}</h1>
                    <p className="text-gray-600 m-0 mt-1 text-lg">Usage Metrics & Analytics Dashboard</p>
                </div>
                
                <div className="flex gap-4 items-center">
                    <div className="bg-white p-4 shadow-md rounded-lg border-t-4 border-blue-600 flex items-center gap-4">
                        <i className="pi pi-users text-blue-600 text-3xl"></i>
                        <div>
                            <span className="text-gray-500 font-medium block text-sm mb-1">Total Registered</span>
                            <div className="text-gray-900 font-bold text-2xl">{totalStudents} Students</div>
                        </div>
                    </div>
                    
                    <Button 
                        icon="pi pi-sign-out" 
                        severity="secondary" 
                        outlined 
                        rounded
                        onClick={() => {
                            setIsAuthenticated(false);
                            setMetrics([]);
                            setInstitutionName('');
                            setTotalStudents(0);
                            setAccessCode('');
                        }} 
                        tooltip="Secure Log Out"
                        tooltipOptions={{ position: 'bottom' }}
                        className="bg-white"
                    />
                </div>
            </div>

            <Card className="shadow-lg rounded-xl overflow-hidden border-none">
                <DataTable 
                    value={metrics} 
                    paginator 
                    rows={10} 
                    rowsPerPageOptions={[10, 25, 50]}
                    dataKey="rollNumber" 
                    emptyMessage="No student activity found for this institution."
                    className="p-datatable-sm"
                    stripedRows
                    removableSort
                >
                    <Column field="rollNumber" header="Roll Number" sortable style={{ width: '15%' }}></Column>
                    <Column field="name" header="Student Name" sortable style={{ width: '25%' }}></Column>
                    <Column field="department" header="Department" sortable style={{ width: '20%' }}></Column>
                    <Column field="semester" header="Sem" sortable style={{ width: '10%' }} align="center"></Column>
                    <Column 
                        field="wordsUsed" 
                        header="Words Generated" 
                        sortable 
                        style={{ width: '30%' }}
                        body={(rowData) => (
                            <span className="font-bold text-blue-600">
                                {rowData.wordsUsed.toLocaleString()} words
                            </span>
                        )}
                    ></Column>
                </DataTable>
            </Card>
        </div>
    );
};

export default AdminDashboard;