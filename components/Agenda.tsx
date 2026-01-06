
import React, { useState } from 'react';
import { dbService } from '../db';
import { Client, Appointment, User } from '../types';

interface AgendaProps {
  user: User;
  appointments: Appointment[];
  clients: Client[];
  onUpdate: () => void;
}

const Agenda: React.FC<AgendaProps> = ({ user, appointments, clients, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientId = formData.get('clientId') as string;
    const client = clients.find(c => c.id === clientId);

    const app: Appointment = {
      id: crypto.randomUUID(),
      userId: user.id, // Isolation
      clientId: clientId,
      clientName: client?.name || 'Cliente Desconhecido',
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      duration: parseInt(formData.get('duration') as string),
      purpose: formData.get('purpose') as string,
      status: 'pending',
    };

    await dbService.put('appointments', app);
    setShowForm(false);
    onUpdate();
  };

  const handleToggleStatus = async (app: Appointment) => {
    const newStatus = app.status === 'completed' ? 'pending' : 'completed';
    await dbService.put('appointments', { ...app, status: newStatus });
    onUpdate();
  };

  const handleDelete = async (appId: string) => {
    if (confirm('Deseja realmente excluir este agendamento permanentemente?')) {
      await dbService.delete('appointments', appId);
      onUpdate();
    }
  };

  const sortedApps = [...appointments].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Minha Agenda</h2>
          <p className="text-gray-500">Compromissos de {user.name}.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-shadow shadow-md flex items-center gap-2"
        >
          <i className="fas fa-calendar-plus"></i> Novo Agendamento
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            <form onSubmit={handleSubmit} className="p-8">
              <h3 className="text-xl font-bold mb-6">Agendar Visita</h3>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600">Selecionar Cliente</label>
                  <select name="clientId" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-600">Data</label>
                    <input name="date" type="date" required defaultValue={today} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-600">Horário</label>
                    <input name="time" type="time" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600">Objetivo da Visita</label>
                  <textarea name="purpose" placeholder="Ex: Cobrança, pedido, entrega..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-24" required></textarea>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">Agendar</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl">Voltar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Data/Hora</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedApps.map(app => (
              <tr key={app.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{app.date.split('-').reverse().join('/')}</div>
                  <div className="text-sm text-blue-600">{app.time}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{app.clientName}</div>
                  <div className="text-[10px] text-gray-400 max-w-[200px] truncate">{app.purpose}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    app.status === 'completed' ? 'bg-green-100 text-green-600' :
                    app.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {app.status === 'completed' ? 'Concluído' : 'Pendente'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <button 
                    onClick={() => handleToggleStatus(app)} 
                    className={`transition-colors ${app.status === 'completed' ? 'text-green-600' : 'text-gray-300 hover:text-green-600'}`}
                    title={app.status === 'completed' ? 'Marcar como Pendente' : 'Marcar como Concluído'}
                  >
                    <i className={`fas ${app.status === 'completed' ? 'fa-check-circle' : 'fa-circle'}`}></i>
                  </button>
                  <button 
                    onClick={() => handleDelete(app.id)} 
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Excluir Agendamento"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {sortedApps.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Sua agenda está vazia.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Agenda;
