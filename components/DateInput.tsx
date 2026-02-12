
import React from 'react';
import { Calendar, AlertCircle, Edit3 } from 'lucide-react';

interface DateInputProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
}

const DateInput: React.FC<DateInputProps> = ({ value, onChange, className = "" }) => {
  return (
    <div className={`relative group flex items-center bg-white border-2 rounded-[1.5rem] p-5 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 ${!value ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'} ${className}`}>
      
      <div className={`p-3 rounded-xl transition-all ${!value ? 'bg-rose-100 text-rose-500' : 'bg-indigo-600 text-white'}`}>
        <Calendar size={20} />
      </div>
      
      <div className="ml-4 flex-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1.5">Date (Format: JJ/MM/AAAA)</label>
        <input 
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex: 12/12/2026"
          className={`w-full bg-transparent text-xl font-black uppercase tracking-tighter outline-none placeholder:text-slate-200 ${!value ? 'text-rose-400' : 'text-slate-900'}`}
        />
      </div>

      {!value ? (
        <div className="flex items-center gap-2 bg-rose-500 text-white px-3 py-1.5 rounded-xl animate-pulse shrink-0">
           <AlertCircle size={14} />
           <span className="text-[9px] font-black uppercase tracking-widest">Date Requise</span>
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center shrink-0">
            <Edit3 size={16} />
        </div>
      )}
    </div>
  );
};

export default DateInput;
