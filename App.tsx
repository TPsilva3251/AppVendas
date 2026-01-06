
import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from './db.ts';
import { aiAssistant } from './geminiService.ts';
import { Client, Appointment, Sale, AppTab, SavedRoute, User } from './types.ts';

// Components
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import ClientManager from './components/ClientManager.tsx';
import Agenda from './components/Agenda.tsx';
import RoutePlanner from './components/RoutePlanner.tsx';
import AIChat from './components/AIChat.tsx';
import Login from './components/Login.tsx';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('salesmaster_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);

  // Initialize DB and load data
  useEffect(() => {
    const initApp = async () => {
      try {
        await dbService.init();
        if (user) await refreshData(user.id);
        setIsDbReady(true);
      } catch (error) {
        console.error("Failed to init app", error);
      }
    };
    initApp();
  }, [user]);

  const refreshData = useCallback(async (userId: string) => {
    try {
      const loadedClients = await dbService.getAllForUser<Client>('clients', userId);
      const loadedApps = await dbService.getAllForUser<Appointment>('appointments', userId);
      const loadedSales = await dbService.getAllForUser<Sale>('sales', userId);
      const loadedRoutes = await dbService.getAllForUser<SavedRoute>('routes', userId);
      setClients(loadedClients);
      setAppointments(loadedApps);
      setSales(loadedSales);
      setSavedRoutes(loadedRoutes);
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
    }
  }, []);

  const handleLogin = (loggedUser: User) => {
    sessionStorage.setItem('salesmaster_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('salesmaster_user');
    setUser(null);
    setClients([]);
    setAppointments([]);
    setSales([]);
    setSavedRoutes([]);
  };

  if (!isDbReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-600 text-white flex-col">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4"></div>
        <h1 className="text-2xl font-bold">SalesMaster Pro</h1>
        <p>Iniciando banco de dados local...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.DASHBOARD:
        return <Dashboard user={user} clients={clients} appointments={appointments} sales={sales} onNavigate={setActiveTab} onUpdate={() => refreshData(user.id)} />;
      case AppTab.CLIENTS:
        return <ClientManager user={user} clients={clients} onUpdate={() => refreshData(user.id)} />;
      case AppTab.AGENDA:
        return <Agenda user={user} appointments={appointments} clients={clients} onUpdate={() => refreshData(user.id)} />;
      case AppTab.ROUTES:
        return <RoutePlanner user={user} clients={clients} savedRoutes={savedRoutes} onUpdate={() => refreshData(user.id)} />;
      case AppTab.AI:
        return <AIChat clients={clients} appointments={appointments} />;
      default:
        return <Dashboard user={user} clients={clients} appointments={appointments} sales={sales} onNavigate={setActiveTab} onUpdate={() => refreshData(user.id)} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
