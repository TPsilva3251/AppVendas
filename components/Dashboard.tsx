
import React, { useState } from 'react';
import { Client, Appointment, Sale, AppTab, User } from '../types';
import { dbService } from '../db';

interface DashboardProps {
  user: User;
  clients: Client[];
  appointments: Appointment[];
  sales: Sale[];
  onNavigate: (tab: AppTab) => void;
  onUpdate: () => void;
}

type ModalType = 'total' | 'hoje' | 'vendas' | 'pendentes' | 'atrasados' | null;

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

const Dashboard: React.FC<DashboardProps> = ({ user, clients, appointments, sales, onNavigate, onUpdate }) => {
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'name' | 'code'>('name');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentDayIndex = Math.min(Math.max(new Date().getDay() - 1, 0), 4);
  const todayRouteName = DAYS_OF_WEEK[currentDayIndex];

  // Filtro de vendas da última semana (7 dias)
  const weeklySales = sales.filter(s => {
    const saleDate = new Date(s.date);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return saleDate >= oneWeekAgo;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Soma total das vendas da semana
  const weeklyTotal = weeklySales.reduce((acc, sale) => acc + sale.amount, 0);

  const visitsToday = clients.filter(c => c.lastVisitDate === todayStr);
  const pendingToday = clients.filter(c => c.assignedRoute === todayRouteName && c.lastVisitDate !== todayStr);
  const lateClients = clients.filter(c => {
    if (!c.assignedRoute) return false;
    const routeIndex = DAYS_OF_WEEK.indexOf(c.assignedRoute);
    const isPastDay = routeIndex < currentDayIndex;
    const notVisitedToday = c.lastVisitDate !== todayStr;
    return isPastDay && notVisitedToday;
  });

  const stats = [
    { type: 'total' as ModalType, label: 'Total Clientes', value: clients.length, icon: 'fa-users', color: 'bg-blue-500' },
    { type: 'hoje' as ModalType, label: 'Visitas Hoje', value: visitsToday.length, icon: 'fa-calendar-check', color: 'bg-green-500' },
    { type: 'vendas' as ModalType, label: 'Positivações Semana', value: weeklySales.length, icon: 'fa-shopping-cart', color: 'bg-purple-600' },
    { type: 'pendentes' as ModalType, label: 'Pendentes Hoje', value: pendingToday.length, icon: 'fa-clock', color: 'bg-yellow-500' },
    { type: 'atrasados' as ModalType, label: 'Atrasados', value: lateClients.length, icon: 'fa-exclamation-triangle', color: 'bg-red-500' },
  ];

  const handleToggleVisit = async (client: Client) => {
    const isVisited = client.lastVisitDate === todayStr;
    const updated = { ...client, lastVisitDate: isVisited ? undefined : todayStr };
    await dbService.put('clients', updated);
    onUpdate();
  };

  const handleRegisterSale = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientId = formData.get('clientId') as string;
    const client = clients.find(c => c.id === clientId);

    const sale: Sale = {
      id: editingSale ? editingSale.id : crypto.randomUUID(),
      userId: user.id,
      clientId: clientId || (editingSale?.clientId || ''),
      clientName: client?.name || (editingSale?.clientName || 'Cliente'),
      amount: parseFloat(formData.get('amount') as string),
      date: editingSale ? editingSale.date : todayStr,
      notes: formData.get('notes') as string
    };

    await dbService.put('sales', sale);
    setShowSaleForm(false);
    setEditingSale(null);
    onUpdate();
  };

  const handleDeleteSale = async (e: React.MouseEvent, saleId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!saleId) return;

    if (window.confirm('Atenção: Você deseja realmente EXCLUIR este registro de venda permanentemente?')) {
      try {
        console.log("Iniciando exclusão da venda ID:", saleId);
        await dbService.delete('sales', saleId);
        console.log("Exclusão concluída no IndexedDB");
        
        // Atualiza a lista no App.tsx
        onUpdate();
      } catch (err) {
        console.error("Erro ao deletar venda:", err);
        alert("Ocorreu um erro no banco de dados ao tentar excluir o registro.");
      }
    }
  };

  const openEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setShowSaleForm(true);
  };

  const getModalData = () => {
    let list: any[] = [];
    switch (activeModal) {
      case 'total': list = clients; break;
      case 'hoje': list = visitsToday; break;
      case 'vendas': list = weeklySales; break;
      case 'pendentes': list = pendingToday; break;
      case 'atrasados': list = lateClients; break;
    }

    return list
      .filter(item => {
        const name = item.name || item.clientName || '';
        const code = item.code?.toString() || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) || code.includes(searchTerm);
      })
      .sort((a, b) => {
        if (sortOrder === 'name') {
          const nameA = a.name || a.clientName || '';
          const nameB = b.name || b.clientName || '';
          return nameA.localeCompare(nameB);
        } else {
          return (a.code || 0) - (b.code || 0);
        }
      });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Olá, {user.name.split(' ')[0]}!</h2>
          <p className="text-gray-500 mt-1">Sua rota de {todayRouteName} tem {pendingToday.length} pendências.</p>
        </div>
        <button 
          onClick={() => { setEditingSale(null); setShowSaleForm(true); }}
          className="bg-purple-600 text-white px-6 py-3 rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center gap-2 font-bold"
        >
          <i className="fas fa-plus-circle"></i> Registrar Positivação
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            onClick={() => { setActiveModal(stat.type); setSearchTerm(''); }}
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div className={`${stat.color} w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg shadow-inner group-hover:rotate-6 transition-transform`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <i className="fas fa-shopping-bag text-purple-600"></i>
            Últimas Positivações
          </h3>
          <div className="text-right">
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Esta Semana</span>
            <span className="text-sm font-black text-purple-600 leading-none">Total: R$ {weeklyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Valor Pedido</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {weeklySales.length > 0 ? weeklySales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">{sale.date.split('-').reverse().join('/')}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{sale.clientName}</td>
                  <td className="px-6 py-4 font-black text-purple-600">R$ {sale.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => openEditSale(sale)}
                        className="text-blue-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                        title="Editar Valor"
                      >
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteSale(e, sale.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                        title="Excluir Registro"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Nenhuma venda registrada nesta semana.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-zoomIn">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                  {stats.find(s => s.type === activeModal)?.label}
                </h3>
                <p className="text-xs text-gray-500">Exibindo {getModalData().length} registros</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                <i className="fas fa-times text-gray-600"></i>
              </button>
            </div>

            <div className="p-4 bg-white border-b border-gray-100 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="text" 
                  placeholder="Buscar..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSortOrder('name')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortOrder === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  Ordem A-Z
                </button>
                <button 
                  onClick={() => setSortOrder('code')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortOrder === 'code' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  Por Código
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/30">
              {getModalData().map((item: any) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                      {item.code || '#'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{item.name || item.clientName}</h4>
                      <p className="text-xs text-gray-500">{item.company || (item.amount ? `R$ ${item.amount.toLocaleString('pt-BR')}` : 'Sem empresa')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {activeModal === 'vendas' ? (
                      <div className="flex gap-2">
                         <button 
                          onClick={() => openEditSale(item)}
                          className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl transition-all"
                          title="Editar"
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSale(e, item.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                          title="Excluir Registro"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    ) : (
                       <button 
                        onClick={() => handleToggleVisit(item)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                          item.lastVisitDate === todayStr 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <i className={`fas ${item.lastVisitDate === todayStr ? 'fa-check-double' : 'fa-check'}`}></i>
                        {item.lastVisitDate === todayStr ? 'Visitado' : 'Visitar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSaleForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            <form onSubmit={handleRegisterSale} className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingSale ? 'Editar Positivação' : 'Nova Positivação'}</h3>
                <button type="button" onClick={() => { setShowSaleForm(false); setEditingSale(null); }} className="text-gray-400">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="space-y-4">
                {!editingSale && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Cliente</label>
                    <select name="clientId" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="">Selecione...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {editingSale && (
                  <div className="p-3 bg-purple-50 rounded-xl mb-4">
                    <p className="text-xs font-bold text-purple-600 uppercase">Cliente</p>
                    <p className="font-bold text-gray-800">{editingSale.clientName}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Valor (R$)</label>
                  <input name="amount" type="number" step="0.01" defaultValue={editingSale?.amount} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Notas (Opcional)</label>
                  <textarea name="notes" defaultValue={editingSale?.notes} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none h-20"></textarea>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button type="submit" className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700">Salvar</button>
                <button type="button" onClick={() => { setShowSaleForm(false); setEditingSale(null); }} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl">Voltar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
