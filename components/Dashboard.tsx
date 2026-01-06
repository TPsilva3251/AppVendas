
import React, { useState } from 'react';
import { Client, Appointment, Sale, AppTab, User } from '../types.ts';
import { dbService } from '../db.ts';

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

  const todayStr = new Date().toISOString().split('T')[0];
  const currentDayIndex = Math.min(Math.max(new Date().getDay() - 1, 0), 4);
  const todayRouteName = DAYS_OF_WEEK[currentDayIndex];

  const weeklySales = sales.filter(s => {
    const saleDate = new Date(s.date);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return saleDate >= oneWeekAgo;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const weeklyTotal = weeklySales.reduce((acc, sale) => acc + sale.amount, 0);

  const visitsToday = clients.filter(c => c.lastVisitDate === todayStr);
  const pendingToday = clients.filter(c => c.assignedRoute === todayRouteName && c.lastVisitDate !== todayStr);
  const lateClients = clients.filter(c => {
    if (!c.assignedRoute) return false;
    const routeIndex = DAYS_OF_WEEK.indexOf(c.assignedRoute);
    return routeIndex < currentDayIndex && c.lastVisitDate !== todayStr;
  });

  const stats = [
    { type: 'total' as ModalType, label: 'Clientes', value: clients.length, icon: 'fa-users', color: 'bg-blue-500' },
    { type: 'hoje' as ModalType, label: 'Visitas Hoje', value: visitsToday.length, icon: 'fa-calendar-check', color: 'bg-green-500' },
    { type: 'vendas' as ModalType, label: 'Vendas Semana', value: weeklySales.length, icon: 'fa-shopping-cart', color: 'bg-purple-600' },
    { type: 'pendentes' as ModalType, label: 'Pendentes', value: pendingToday.length, icon: 'fa-clock', color: 'bg-yellow-500' },
    { type: 'atrasados' as ModalType, label: 'Atrasados', value: lateClients.length, icon: 'fa-exclamation-triangle', color: 'bg-red-500' },
  ];

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

    if (window.confirm('Excluir este registro de venda permanentemente?')) {
      try {
        await dbService.delete('sales', saleId);
        onUpdate();
        if (activeModal === 'vendas' && weeklySales.length <= 1) {
          setActiveModal(null);
        }
      } catch (err) {
        alert("Erro ao excluir do banco de dados local.");
      }
    }
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
    return list.filter(item => (item.name || item.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Olá, {user.name.split(' ')[0]}!</h2>
          <p className="text-gray-500 mt-1">Rota de {todayRouteName}: {pendingToday.length} pendências.</p>
        </div>
        <button 
          onClick={() => { setEditingSale(null); setShowSaleForm(true); }}
          className="bg-purple-600 text-white px-6 py-3 rounded-2xl hover:bg-purple-700 transition-all shadow-lg flex items-center gap-2 font-bold"
        >
          <i className="fas fa-plus-circle"></i> Nova Venda
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            onClick={() => { setActiveModal(stat.type); setSearchTerm(''); }}
            className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2 hover:shadow-md cursor-pointer transition-all"
          >
            <div className={`${stat.color} w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{stat.label}</p>
              <p className="text-xl font-black text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">Vendas da Semana</h3>
          <span className="text-sm font-black text-purple-600">Total: R$ {weeklyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {weeklySales.length > 0 ? weeklySales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs text-gray-500">{sale.date.split('-').reverse().join('/')}</td>
                  <td className="px-6 py-4 font-bold text-gray-800 text-sm">{sale.clientName}</td>
                  <td className="px-6 py-4 font-black text-purple-600 text-sm">R$ {sale.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingSale(sale); setShowSaleForm(true); }} className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg"><i className="fas fa-pencil-alt"></i></button>
                      <button onClick={(e) => handleDeleteSale(e, sale.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic text-sm">Nenhuma venda esta semana.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-zoomIn">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{stats.find(s => s.type === activeModal)?.label}</h3>
              <button onClick={() => setActiveModal(null)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <i className="fas fa-times text-gray-600"></i>
              </button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <input 
                type="text" placeholder="Filtrar na lista..."
                className="w-full px-4 py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/30">
              {getModalData().map((item: any) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{item.name || item.clientName}</h4>
                    <p className="text-[10px] text-gray-500">{item.company || (item.amount ? `Valor: R$ ${item.amount}` : '')}</p>
                  </div>
                  {activeModal === 'vendas' && (
                    <button onClick={(e) => handleDeleteSale(e, item.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><i className="fas fa-trash-alt"></i></button>
                  )}
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
              <h3 className="text-xl font-bold mb-6">{editingSale ? 'Editar Venda' : 'Nova Venda'}</h3>
              <div className="space-y-4">
                {!editingSale && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cliente</label>
                    <select name="clientId" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                      <option value="">Selecione...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valor (R$)</label>
                  <input name="amount" type="number" step="0.01" defaultValue={editingSale?.amount} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Observações</label>
                  <textarea name="notes" defaultValue={editingSale?.notes} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none h-20 text-sm"></textarea>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button type="submit" className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors">Salvar</button>
                <button type="button" onClick={() => { setShowSaleForm(false); setEditingSale(null); }} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">Voltar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
