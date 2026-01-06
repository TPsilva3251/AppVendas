
import React, { useState } from 'react';
import { User } from '../types';

/**
 * REGISTRO MANUAL DE USUÁRIOS (CADASTRO VIA "TERMINAL"/CÓDIGO)
 * Para excluir um usuário, mude 'isActive' para false.
 * Isso garante que o acesso seja bloqueado sem apagar os dados vinculados a ele no banco.
 */
const AUTHORIZED_USERS: User[] = [
  { id: '1', username: 'admin', name: 'Administrador Master', password: '123', isActive: true },
  { id: '2', username: 'vendedor1', name: 'João Silva', password: 'abc', isActive: true },
  { id: '3', username: 'representante', name: 'Maria Souza', password: 'xyz', isActive: true },
  { id: '4', username: 'Thiago', name: 'Thiago', password: 'Dudinh@2015', isActive: true },
];

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Procura o usuário nas credenciais autorizadas
    const userFound = AUTHORIZED_USERS.find(u => u.username === username && u.password === password);
    
    if (!userFound) {
      setError('Credenciais inválidas. Verifique usuário e senha.');
      return;
    }

    // Verificação de Inatividade (Usuário "Excluído" logicamente)
    if (!userFound.isActive) {
      setError('Este acesso foi desativado pelo administrador do sistema.');
      return;
    }

    // Login bem-sucedido: remove a senha antes de passar para o estado do app por segurança
    const { password: _, ...userWithoutPass } = userFound;
    onLogin(userWithoutPass as User);
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
      
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 animate-slideUp">
        <div className="bg-blue-600 p-10 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <i className="fas fa-lock-open text-4xl"></i>
          </div>
          <h1 className="text-3xl font-black tracking-tight">SalesMaster Pro</h1>
          <p className="text-blue-100 text-sm mt-2 font-medium">Autenticação de Representante</p>
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 border border-red-100 animate-fadeIn">
              <i className="fas fa-exclamation-triangle mt-1"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Usuário</label>
              <div className="relative">
                <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  placeholder="Seu usuário"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  placeholder="Sua senha segura"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            Acessar Painel
            <i className="fas fa-arrow-right"></i>
          </button>
          
          <div className="text-center">
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">
              Sistema de Acesso Restrito • V 4.1.0
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
