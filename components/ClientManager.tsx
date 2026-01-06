
import React, { useState } from 'react';
import { dbService } from '../db';
import { Client, User } from '../types';

interface ClientManagerProps {
  user: User;
  clients: Client[];
  onUpdate: () => void;
}

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

const ClientManager: React.FC<ClientManagerProps> = ({ user, clients, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    const codeValue = formData.get('code') as string;
    const codeInt = codeValue ? parseInt(codeValue, 10) : undefined;

    if (codeInt !== undefined) {
      const codeExists = clients.some(c => c.code === codeInt && c.id !== editingClient?.id);
      if (codeExists) {
        setError(`O código de cliente ${codeInt} já está em uso por outro cliente.`);
        return;
      }
    }

    const client: Client = {
      id: editingClient?.id || crypto.randomUUID(),
      userId: user.id, // Mandatory for isolation
      code: codeInt,
      name: formData.get('name') as string,
      cnpj: formData.get('cnpj') as string || undefined,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      company: formData.get('company') as string,
      category: formData.get('category') as 'A' | 'B' | 'C',
      assignedRoute: formData.get('assignedRoute') as string || undefined,
      notes: formData.get('notes') as string,
      lastVisitDate: editingClient?.lastVisitDate,
    };

    await dbService.put('clients', client);
    setShowForm(false);
    setEditingClient(null);
    onUpdate();
  };

  const handleToggleVisit = async (client: Client) => {
    const isVisited = client.lastVisitDate === todayStr;
    const updated = { ...client, lastVisitDate: isVisited ? undefined : todayStr };
    await dbService.put('clients', updated);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await dbService.delete('clients', id);
      onUpdate();
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code?.toString().includes(searchTerm) ||
    c.cnpj?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Meus Clientes</h2>
          <p className="text-gray-500">Logado como: <span className="font-bold text-blue-600">{user.name}</span></p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Buscar por nome, código ou CNPJ..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setShowForm(true); setError(null); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <i className="fas fa-plus"></i> Novo
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
            <form onSubmit={handleSubmit} className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h3>
                <button type="button" onClick={() => { setShowForm(false); setEditingClient(null); }} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center gap-2">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Código Cliente (Único)</label>
                  <input name="code" type="number" defaultValue={editingClient?.code} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 12345" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">CNPJ (Opcional)</label>
                  <input name="cnpj" defaultValue={editingClient?.cnpj} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Nome Completo</label>
                  <input name="name" defaultValue={editingClient?.name} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Empresa / Razão Social</label>
                  <input name="company" defaultValue={editingClient?.company} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Telefone</label>
                  <input name="phone" defaultValue={editingClient?.phone} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Rota Fixa</label>
                  <select name="assignedRoute" defaultValue={editingClient?.assignedRoute || ''} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Nenhuma</option>
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Categoria</label>
                  <select name="category" defaultValue={editingClient?.category || 'B'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="A">Curva A (Prioridade Alta)</option>
                    <option value="B">Curva B (Prioridade Média)</option>
                    <option value="C">Curva C (Prioridade Baixa)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Email (Opcional)</label>
                  <input name="email" type="email" defaultValue={editingClient?.email} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="cliente@exemplo.com" />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Endereço Completo</label>
                  <input name="address" defaultValue={editingClient?.address} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Rua, Número, Bairro, Cidade, UF" />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Observações</label>
                  <textarea name="notes" defaultValue={editingClient?.notes} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-24 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                  {editingClient ? 'Atualizar Dados' : 'Salvar Cliente'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingClient(null); }} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                   <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase w-fit ${
                    client.category === 'A' ? 'bg-red-100 text-red-600' :
                    client.category === 'B' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    Cat {client.category}
                  </div>
                  {client.assignedRoute && (
                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase w-fit bg-green-100 text-green-700 flex items-center gap-1">
                      <i className="fas fa-truck text-[8px]"></i> {client.assignedRoute}
                    </div>
                  )}
                </div>
                {client.code && (
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Cód: {client.code}</span>
                )}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingClient(client); setShowForm(true); setError(null); }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  onClick={() => handleDelete(client.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800">{client.name}</h3>
            <p className="text-sm font-medium text-blue-600 mb-2">{client.company}</p>
            {client.cnpj && (
              <p className="text-[11px] text-gray-400 font-mono mb-4">CNPJ: {client.cnpj}</p>
            )}
            
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <i className="fas fa-phone w-5 text-gray-400"></i> {client.phone}
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-map-marker-alt w-5 mt-1 text-gray-400"></i> 
                <span className="line-clamp-2">{client.address}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex flex-col gap-3">
              <button 
                onClick={() => handleToggleVisit(client)}
                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  client.lastVisitDate === todayStr 
                    ? 'bg-green-100 text-green-600 border border-green-200 hover:bg-green-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'
                }`}
              >
                <i className={`fas ${client.lastVisitDate === todayStr ? 'fa-check-double' : 'fa-calendar-check'}`}></i>
                {client.lastVisitDate === todayStr ? 'Visitado Hoje' : 'Registrar Visita Agora'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientManager;
