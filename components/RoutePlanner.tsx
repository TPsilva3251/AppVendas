
import React, { useState, useEffect } from 'react';
import { Client, SavedRoute, User } from '../types';
import { aiAssistant } from '../geminiService';
import { dbService } from '../db';

interface RoutePlannerProps {
  user: User;
  clients: Client[];
  savedRoutes: SavedRoute[];
  onUpdate: () => void;
}

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

const RoutePlanner: React.FC<RoutePlannerProps> = ({ user, clients, savedRoutes, onUpdate }) => {
  const [activeDay, setActiveDay] = useState<string>(DAYS_OF_WEEK[0]);
  const [optimization, setOptimization] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const assignedClients = clients.filter(c => c.assignedRoute === activeDay);
  const otherClients = clients.filter(c => c.assignedRoute !== activeDay);

  const toggleClientAssignment = async (client: Client, isCurrentlyAssigned: boolean) => {
    const updatedClient = {
      ...client,
      assignedRoute: isCurrentlyAssigned ? undefined : activeDay
    };
    
    await dbService.put('clients', updatedClient);
    onUpdate();
  };

  const handleToggleVisit = async (client: Client) => {
    const isVisited = client.lastVisitDate === todayStr;
    const updated = { ...client, lastVisitDate: isVisited ? undefined : todayStr };
    await dbService.put('clients', updated);
    onUpdate();
  };

  const handleOptimize = async () => {
    if (assignedClients.length < 2) {
      alert("Adicione pelo menos 2 clientes à rota de " + activeDay + ".");
      return;
    }
    setLoading(true);
    try {
      const addresses = assignedClients.map(c => `${c.name}: ${c.address}`);
      const result = await aiAssistant.optimizeRoute(addresses);
      setOptimization(result);
    } catch (error) {
      console.error(error);
      setOptimization("Erro ao otimizar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Planejamento de Rota</h2>
          <p className="text-gray-500">Defina os clientes para cada dia da semana.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 overflow-x-auto">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day}
              onClick={() => { setActiveDay(day); setOptimization(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeDay === day 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {day}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeDay === day ? 'bg-blue-100' : 'bg-gray-200'}`}>
                {clients.filter(c => c.assignedRoute === day).length}
              </span>
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[650px]">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-list-check text-blue-600"></i>
              Clientes na {activeDay}
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4 scrollbar-thin">
              {assignedClients.length > 0 ? assignedClients.map(client => (
                <div key={client.id} className="p-3 rounded-2xl border border-blue-200 bg-blue-50/50 flex flex-col gap-2">
                  <div className="flex justify-between items-start" onClick={() => toggleClientAssignment(client, true)}>
                    <div className="cursor-pointer flex-1">
                      <p className="text-sm font-bold text-gray-800 truncate">{client.name}</p>
                      <p className="text-[10px] text-gray-500">{client.company}</p>
                    </div>
                    <i className="fas fa-check-circle text-blue-600"></i>
                  </div>
                  <button 
                    onClick={() => handleToggleVisit(client)}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                      client.lastVisitDate === todayStr 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                    }`}
                  >
                    <i className={`fas ${client.lastVisitDate === todayStr ? 'fa-check-double' : 'fa-check'}`}></i>
                    {client.lastVisitDate === todayStr ? 'Visitado' : 'Registrar Visita'}
                  </button>
                </div>
              )) : (
                <div className="py-4 text-center text-gray-400 text-xs italic">Nenhum cliente para este dia.</div>
              )}
              
              <hr className="my-4 border-gray-50" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Outros Clientes</p>
              
              {otherClients.map(client => (
                <div 
                  key={client.id} 
                  onClick={() => toggleClientAssignment(client, false)} 
                  className="p-3 rounded-2xl border border-gray-50 bg-white hover:border-gray-200 cursor-pointer transition-all flex justify-between items-center group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800 truncate">{client.name}</p>
                      {client.assignedRoute && (
                        <span className="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 font-bold">{client.assignedRoute}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{client.company}</p>
                  </div>
                  <i className="far fa-circle text-gray-200 group-hover:text-blue-300 transition-colors"></i>
                </div>
              ))}
            </div>

            <button 
              onClick={handleOptimize}
              disabled={loading || assignedClients.length < 2}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-700 disabled:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <i className="fas fa-magic"></i>
              )}
              Otimizar Rota de {activeDay}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {optimization ? (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-slideUp">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-gray-800"><i className="fas fa-route text-blue-600 mr-2"></i> Rota Sugerida: {activeDay}</h3>
                 <button 
                    onClick={() => {
                      if (assignedClients.length === 0) return;
                      const waypoints = assignedClients.slice(0, -1).map(c => encodeURIComponent(c.address)).join('|');
                      const destination = encodeURIComponent(assignedClients[assignedClients.length - 1].address);
                      window.open(`https://www.google.com/maps/dir/?api=1&origin=Minha+Localização&destination=${destination}&waypoints=${waypoints}&travelmode=driving`, '_blank');
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 flex items-center gap-2"
                 >
                   <i className="fas fa-location-dot"></i> Abrir no Maps
                 </button>
               </div>
               <div className="prose prose-blue max-w-none text-gray-700 whitespace-pre-line bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                {optimization}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm h-full min-h-[400px]">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <i className="fas fa-map-location-dot text-3xl text-blue-300"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-400">Inteligência Logística</h4>
              <p className="text-gray-400 max-w-xs mx-auto mt-2">Selecione pelo menos 2 clientes para a {activeDay.toLowerCase()} e solicite a otimização da rota ao Sales Copilot.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutePlanner;
