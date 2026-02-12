
import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight, Sparkles, TreeDeciduous } from 'lucide-react';

interface LoginProps {
  onLogin: (success: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'DLSJ69110' && password === '1234') {
      onLogin(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Arrière-plan stylisé avec formes organiques rappelant le Domaine */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#2d8a5d]/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#007ba1]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Pattern de feuilles en arrière-plan */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none" style={{ backgroundImage: 'radial-gradient(#2d8a5d 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white rounded-[3.5rem] p-12 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.15)] border border-slate-100 relative overflow-hidden">
          
          {/* Bande de couleur subtile en haut */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#2d8a5d] to-[#007ba1]"></div>

          <div className="flex flex-col items-center mb-10 text-center">
            {/* Icône stylisée à la place du logo défectueux */}
            <div className="relative mb-8 w-full flex justify-center">
              <div className="bg-gradient-to-br from-[#2d8a5d] to-[#1e5c3e] text-white p-8 rounded-[2.5rem] shadow-2xl transform hover:rotate-3 transition-all duration-500 cursor-default border-b-4 border-[#14462f]">
                <TreeDeciduous size={64} strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-2 right-1/4 bg-[#007ba1] text-white p-2.5 rounded-full shadow-lg transform translate-x-10">
                <Sparkles size={20} />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#2d8a5d]">Domaine</h2>
              <h1 className="text-4xl font-black text-[#2d8a5d] tracking-tighter uppercase leading-none">
                Lyon Saint-Joseph
              </h1>
              <p className="text-[#2d8a5d] italic text-sm mt-3 font-medium opacity-80">"Et l'esprit se libère."</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">Identifiant Collaborateur</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#2d8a5d] transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#2d8a5d] focus:bg-white rounded-[1.5rem] py-5 pl-14 pr-6 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
                  placeholder="DLSJ69110"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">Mot de Passe</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#007ba1] transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#007ba1] focus:bg-white rounded-[1.5rem] py-5 pl-14 pr-6 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
                  placeholder="••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle size={20} className="shrink-0" />
                <span className="text-xs font-bold uppercase tracking-tight">Accès refusé. Vérifiez vos codes.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase text-sm tracking-[0.25em] hover:bg-black hover:shadow-2xl hover:shadow-[#2d8a5d]/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.97] mt-4"
            >
              Accéder au Portail
              <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
            <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full mb-4">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Serveur Opérationnel</span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              OptiPresta v2.6 • Domaine Lyon Saint-Joseph<br/>
              Plateforme Interne d'Exploitation
            </p>
          </div>
        </div>
        
        <div className="mt-10 flex items-center justify-center gap-6 opacity-40">
            <span className="h-px w-12 bg-slate-300"></span>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Hôtellerie • Séminaires • Restauration</p>
            <span className="h-px w-12 bg-slate-300"></span>
        </div>
      </div>
    </div>
  );
};

export default Login;
