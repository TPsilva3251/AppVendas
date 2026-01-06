
import React from 'react';
import { AppTab, User } from '../types';

interface SidebarProps {
  user: User;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: AppTab.DASHBOARD, label: 'Painel', icon: 'fa-chart-pie' },
    { id: AppTab.CLIENTS, label: 'Clientes', icon: 'fa-users' },
    { id: AppTab.AGENDA, label: 'Agenda', icon: 'fa-calendar-alt' },
    { id: AppTab.ROUTES, label: 'Rotas', icon: 'fa-route' },
    { id: AppTab.AI, label: 'Assistente IA', icon: 'fa-robot' },
  ];

  return (
    <nav className="bg-blue-800 text-white w-full md:w-64 flex-shrink-0 flex md:flex-col shadow-xl z-20 sticky bottom-0 md:relative md:top-0">
      <div className="hidden md:flex items-center gap-2 p-6 border-b border-blue-700">
        <i className="fas fa-briefcase text-2xl text-blue-300"></i>
        <h1 className="text-xl font-bold tracking-tight">SalesMaster</h1>
      </div>

      <div className="flex md:flex-col flex-1 justify-around md:justify-start p-2 md:p-4 overflow-x-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 md:py-3 md:px-4 rounded-xl transition-all duration-200 text-xs md:text-base ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-blue-100 hover:bg-blue-700'
            }`}
          >
            <i className={`fas ${item.icon} text-lg md:text-xl`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 md:p-6 border-t border-blue-700 mt-auto bg-blue-900/50 md:bg-transparent">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold border-2 border-white/20">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold truncate max-w-[120px]">{user.name}</p>
              <p className="text-[10px] text-blue-300 uppercase font-black">Online</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-blue-300 hover:text-white transition-colors"
            title="Sair do sistema"
          >
            <i className="fas fa-sign-out-alt text-xl"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
