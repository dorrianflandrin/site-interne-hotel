
import React from 'react';
import { ExtractedEventData, DayData, Prestation, Allergy, SalleDisposition, RoomDetails } from '../types';
import { Users, MapPin, AlertTriangle, Briefcase, Calendar, BedDouble, Info, Plus, Trash2, Mail, Phone } from 'lucide-react';
import TimeInput from './TimeInput';

interface Props {
  data: ExtractedEventData;
  onUpdateData: (newData: ExtractedEventData) => void;
}

const ExtractionResult: React.FC<Props> = ({ data, onUpdateData }) => {
  const handleChange = (path: string, value: any) => {
    const newData = JSON.parse(JSON.stringify(data));
    const keys = path.split('.');
    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onUpdateData(newData);
  };

  const addPrestation = (dayIdx: number) => {
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData.days[dayIdx].prestations) newData.days[dayIdx].prestations = [];
    newData.days[dayIdx].prestations.push({ type: 'NOUVELLE', nom: '', pax: '', horaires: '08:00', lieu: '' });
    onUpdateData(newData);
  };

  const removePrestation = (dayIdx: number, pIdx: number) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.days[dayIdx].prestations.splice(pIdx, 1);
    onUpdateData(newData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      <div className="lg:col-span-2 space-y-10">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
            <Briefcase size={16} className="text-indigo-600" /> Entreprise & Groupe
          </h4>
          <input 
            className="w-full text-xl font-black text-slate-900 border-b-2 border-slate-100 focus:border-indigo-500 outline-none pb-1"
            value={data.entreprise || ''}
            onChange={(e) => handleChange('entreprise', e.target.value)}
          />
        </section>

        {(data.days || []).map((day, dIdx) => (
          <section key={dIdx} className="space-y-4">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
              <Calendar size={20} className="text-indigo-600" />
              <input 
                className="font-bold text-slate-900 text-lg uppercase tracking-tight outline-none focus:text-indigo-600 bg-transparent"
                value={day.date || ''}
                onChange={(e) => handleChange(`days.${dIdx}.date`, e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {(day.prestations || []).map((p, pIdx) => (
                <div key={pIdx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 hover:border-indigo-200 transition-colors shadow-sm relative group">
                  <div className="min-w-[140px]">
                    <input 
                      className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none bg-transparent outline-none w-full mb-2"
                      value={p.type || ''}
                      onChange={(e) => handleChange(`days.${dIdx}.prestations.${pIdx}.type`, e.target.value)}
                    />
                    <TimeInput 
                      value={p.horaires || "00:00"} 
                      onChange={(val) => handleChange(`days.${dIdx}.prestations.${pIdx}.horaires`, val)} 
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      className="text-slate-600 text-sm font-medium bg-transparent outline-none w-full border-b border-transparent focus:border-slate-200"
                      value={p.nom || ''}
                      placeholder="Nom de la prestation"
                      onChange={(e) => handleChange(`days.${dIdx}.prestations.${pIdx}.nom`, e.target.value)}
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Users size={12} /> 
                        <input className="w-8 bg-transparent outline-none font-bold" value={p.pax || ''} onChange={(e) => handleChange(`days.${dIdx}.prestations.${pIdx}.pax`, e.target.value)} /> PAX
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 flex-1">
                        <MapPin size={12} />
                        <input className="bg-transparent outline-none w-full" value={p.lieu || ''} placeholder="Lieu" onChange={(e) => handleChange(`days.${dIdx}.prestations.${pIdx}.lieu`, e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removePrestation(dIdx, pIdx)} className="absolute -right-2 -top-2 bg-white text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-red-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => addPrestation(dIdx)} className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-indigo-200 transition-all text-xs font-bold uppercase tracking-widest">
                <Plus size={16} /> Ajouter une prestation
              </button>
            </div>
          </section>
        ))}
      </div>

      <div className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
            <Briefcase size={16} className="text-indigo-600" /> Contact Client
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Nom</p>
              <input className="w-full text-sm font-semibold text-slate-800 outline-none border-b border-indigo-50" value={data.contactClient?.nom || ''} onChange={(e) => handleChange('contactClient.nom', e.target.value)} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Email</p>
              <input className="w-full text-sm font-semibold text-slate-800 outline-none border-b border-indigo-50" value={data.contactClient?.email || ''} onChange={(e) => handleChange('contactClient.email', e.target.value)} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Téléphone</p>
              <input className="w-full text-sm font-semibold text-slate-800 outline-none border-b border-indigo-50" value={data.contactClient?.tel || ''} onChange={(e) => handleChange('contactClient.tel', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
            <Briefcase size={16} className="text-emerald-600" /> Responsable sur place
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Nom</p>
              <input className="w-full text-sm font-semibold text-slate-800 outline-none border-b border-emerald-50" value={data.responsableSurPlace?.nom || ''} onChange={(e) => handleChange('responsableSurPlace.nom', e.target.value)} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Email</p>
              <input className="w-full text-sm font-semibold text-slate-800 outline-none border-b border-emerald-50" value={data.responsableSurPlace?.email || ''} onChange={(e) => handleChange('responsableSurPlace.email', e.target.value)} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Téléphone</p>
              <input className="w-full text-sm font-semibold text-slate-800 outline-none border-b border-emerald-50" value={data.responsableSurPlace?.tel || ''} onChange={(e) => handleChange('responsableSurPlace.tel', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
            <AlertTriangle size={16} className="text-amber-600" /> Allergies & Régimes
          </h4>
          <div className="space-y-3">
            {(data.allergies || []).map((a, idx) => (
              <div key={idx} className="flex gap-2 items-center text-[11px] border-b border-amber-200/50 pb-2">
                <input className="w-8 font-bold bg-white rounded border border-amber-100 px-1 text-center" value={a.nb || ''} onChange={(e) => handleChange(`allergies.${idx}.nb`, e.target.value)} />
                <input className="flex-1 font-medium text-amber-900 bg-transparent outline-none" value={a.name || ''} onChange={(e) => handleChange(`allergies.${idx}.name`, e.target.value)} />
                <input className="w-20 text-[9px] italic text-amber-600 bg-transparent outline-none" value={a.restriction || ''} onChange={(e) => handleChange(`allergies.${idx}.restriction`, e.target.value)} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExtractionResult;
