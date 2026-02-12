
import React, { useState, useEffect } from 'react';
import { ExtractedEventData, DayData, Prestation, MenuDetails, Allergy, SalleDisposition, RoomDetails } from '../types';
import { 
  Save, Sparkles, Plus, Trash2, Calendar, Users, 
  MapPin, Clock, Utensils, BedDouble, ShieldAlert,
  ChevronRight, ChevronLeft, Info, LogIn, LogOut, Coffee, Presentation,
  AlertCircle, Edit2, Wine, GlassWater, CheckSquare, Square, Layers, MessageSquare, Flag, CreditCard, Mail, Phone,
  Trophy
} from 'lucide-react';
import TimeInput from './TimeInput';
import DateInput from './DateInput';

interface Props {
  initialData?: ExtractedEventData | null;
  onSave: (data: ExtractedEventData) => void;
  onCancel: () => void;
}

const CATEGORY_CONFIG: { [key: string]: { label: string, color: string, bg: string, border: string, icon: any } } = {
  'Arrivée Responsable': { label: "Arrivée Responsable", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: <LogIn size={14} /> },
  'Arrivée Participants': { label: "Arrivée Participants", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", icon: <LogIn size={14} /> },
  'Café d\'accueil': { label: "Café d'accueil", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: <Coffee size={14} /> },
  'Pause AM': { label: "Pause AM", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", icon: <Coffee size={14} /> },
  'Pause PM': { label: "Pause PM", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", icon: <Coffee size={14} /> },
  'APERITIF': { label: "APERITIF", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: <Wine size={14} /> },
  'DEJEUNER': { label: "DEJEUNER", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: <Utensils size={14} /> },
  'DINER': { label: "DINER", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", icon: <Utensils size={14} /> },
  'Départ': { label: "Départ", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: <LogOut size={14} /> },
  'Réunion': { label: "Réunion", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", icon: <Presentation size={14} /> },
  'Autre': { label: "Autre", color: "text-slate-400", bg: "bg-slate-100", border: "border-slate-200", icon: <Info size={14} /> }
};

const CATEGORIES = Object.values(CATEGORY_CONFIG);

const NewPrestationForm: React.FC<Props> = ({ initialData, onSave, onCancel }) => {
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<ExtractedEventData>({
    entreprise: "",
    secteur: "",
    contactClient: { nom: "", email: "", tel: "" },
    responsableSurPlace: { nom: "", email: "", tel: "" },
    days: [{
      date: "",
      prestations: [
        { type: "Arrivée Responsable", nom: "", pax: "", horaires: "08:00", lieu: "" },
        { type: "Arrivée Participants", nom: "", pax: "", horaires: "08:30", lieu: "" },
        { type: "Café d'accueil", nom: "Accueil", pax: "", horaires: "09:00", lieu: "" },
        { type: "DEJEUNER", nom: "Déjeuner", pax: "", horaires: "12:30", lieu: "Restaurant" },
        { type: "Départ", nom: "Fin", horaires: "17:00", lieu: "" }
      ],
      dejeunerMenu: { menuName: "Menu du jour", entree: "", plat: "", fromage: "", dessert: "", hasAperitif: false, hasForfaitBoisson: false, vinNb: "", softNb: "", allergies: [] },
      dinerMenu: { menuName: "Menu Gourmet", entree: "", plat: "", fromage: "", dessert: "", hasAperitif: false, hasForfaitBoisson: false, vinNb: "", softNb: "", allergies: [] },
      hebergement: [],
      sallesDisposition: [],
      teamBuilding: { enabled: false, description: "" }
    }],
    allergies: [],
    commentairesEquipe: "",
    teamBuilding: { enabled: false, date: "", description: "" },
    extras: { bar: "Société", restaurant: "Société", transfert: "NON" }
  });

  useEffect(() => {
    if (initialData) {
      setFormData(JSON.parse(JSON.stringify(initialData)));
    }
  }, [initialData]);

  const updateField = (path: string, value: any) => {
    setFormData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addItem = (path: string, defaultObj: any) => {
    setFormData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length; i++) {
        if (!current[keys[i]]) current[keys[i]] = (i === keys.length - 1) ? [] : {};
        current = current[keys[i]];
      }
      current.push(defaultObj);
      return newData;
    });
  };

  const removeItem = (path: string, index: number) => {
    setFormData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length; i++) {
        current = current[keys[i]];
      }
      current.splice(index, 1);
      return newData;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{initialData ? 'Modifier' : 'Rédaction de'} Fiche</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Dossier opérationnel complet</p>
        </div>
        <div className="flex gap-3">
            <button onClick={onCancel} className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-50 transition-all">Annuler</button>
            <button 
              onClick={() => onSave(formData)} 
              className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-emerald-700 transition-all shadow-xl flex items-center gap-2"
            >
                <Save size={18} /> Enregistrer
            </button>
        </div>
      </header>

      {/* Stepper */}
      <nav className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {[
          { step: 1, label: "Général", icon: Calendar },
          { step: 2, label: "Programme", icon: Clock },
          { step: 3, label: "Menus", icon: Utensils },
          { step: 4, label: "Hébergement", icon: BedDouble },
          { step: 5, label: "Salles", icon: Layers },
          { step: 6, label: "Team Building", icon: Trophy },
          { step: 7, label: "Commentaires & Extras", icon: CreditCard },
        ].map(s => (
          <button key={s.step} onClick={() => setStep(s.step)} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap ${step === s.step ? 'bg-slate-900 text-white font-black' : 'text-slate-400 font-bold hover:bg-slate-50'}`}>
            <s.icon size={18} />
            <span className="text-[11px] uppercase tracking-widest">{s.label}</span>
          </button>
        ))}
      </nav>

      <div className="bg-white border-2 border-slate-200 rounded-[3rem] p-10 shadow-sm">
        {step === 1 && (
          <div className="space-y-12">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Entreprise *</label>
                <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black outline-none focus:border-indigo-500" value={formData.entreprise} onChange={(e) => updateField('entreprise', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Secteur</label>
                <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black outline-none focus:border-indigo-500" value={formData.secteur} onChange={(e) => updateField('secteur', e.target.value)} />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-4 border-b pb-2">Contact Client</h4>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nom complet *</label>
                  <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500" value={formData.contactClient.nom} onChange={(e) => updateField('contactClient.nom', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 font-medium outline-none focus:border-indigo-500" value={formData.contactClient.email} onChange={(e) => updateField('contactClient.email', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 font-medium outline-none focus:border-indigo-500" value={formData.contactClient.tel} onChange={(e) => updateField('contactClient.tel', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-4 border-b pb-2">Responsable sur place</h4>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nom complet *</label>
                  <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500" value={formData.responsableSurPlace.nom} onChange={(e) => updateField('responsableSurPlace.nom', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 font-medium outline-none focus:border-indigo-500" value={formData.responsableSurPlace.email} onChange={(e) => updateField('responsableSurPlace.email', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 font-medium outline-none focus:border-indigo-500" value={formData.responsableSurPlace.tel} onChange={(e) => updateField('responsableSurPlace.tel', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-12">
            {formData.days.map((day, dIdx) => (
              <div key={dIdx} className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <DateInput value={day.date} onChange={(v) => updateField(`days.${dIdx}.date`, v)} />
                  <button onClick={() => addItem(`days.${dIdx}.prestations`, { type: "Autre", nom: "", pax: "", horaires: "09:00", lieu: "" })} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest"><Plus size={16}/> Ajouter prestation</button>
                </div>
                <div className="space-y-3">
                  {day.prestations.map((p, pIdx) => (
                    <div key={pIdx} className="bg-white p-4 rounded-xl shadow-sm grid grid-cols-12 gap-4 items-center border border-slate-100 relative group">
                      <select className={`col-span-3 text-[10px] font-black uppercase outline-none ${CATEGORY_CONFIG[p.type]?.color || 'text-slate-600'}`} value={p.type} onChange={(e) => updateField(`days.${dIdx}.prestations.${pIdx}.type`, e.target.value)}>
                        {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                      </select>
                      <TimeInput className="col-span-2" value={p.horaires || ""} onChange={(v) => updateField(`days.${dIdx}.prestations.${pIdx}.horaires`, v)} />
                      <input className="col-span-3 font-bold outline-none text-sm" placeholder="Libellé" value={p.nom} onChange={(e) => updateField(`days.${dIdx}.prestations.${pIdx}.nom`, e.target.value)} />
                      <input className="col-span-1 text-center font-black" placeholder="PAX" value={p.pax} onChange={(e) => updateField(`days.${dIdx}.prestations.${pIdx}.pax`, e.target.value)} />
                      <input className="col-span-2 text-xs font-bold text-indigo-600 bg-indigo-50 p-1 rounded" placeholder="Lieu" value={p.lieu} onChange={(e) => updateField(`days.${dIdx}.prestations.${pIdx}.lieu`, e.target.value)} />
                      <button onClick={() => removeItem(`days.${dIdx}.prestations`, pIdx)} className="col-span-1 text-rose-300 hover:text-rose-500 flex justify-end"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => addItem('days', { date: "", prestations: [], dejeunerMenu: {}, dinerMenu: {}, hebergement: [], sallesDisposition: [], teamBuilding: { enabled: false, description: "" } })} className="w-full border-4 border-dashed border-slate-200 rounded-[2rem] p-8 text-slate-300 font-black uppercase text-sm hover:bg-slate-50 transition-all">+ Ajouter une journée</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-12">
            {formData.days.map((day, dIdx) => (
              <div key={dIdx} className="bg-slate-50 p-8 rounded-[2.5rem] space-y-8">
                <div className="flex items-center gap-4 text-slate-900 font-black uppercase text-sm border-b pb-4"><Calendar size={20}/> Journée du {day.date || '...'}</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {['dejeunerMenu', 'dinerMenu'].map(mKey => {
                    const menu = day[mKey as 'dejeunerMenu' | 'dinerMenu'] || { allergies: [] };
                    const label = mKey === 'dejeunerMenu' ? 'DÉJEUNER' : 'DÎNER';
                    return (
                      <div key={mKey} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Edit2 size={18} className="text-emerald-700" />
                          <input className="bg-transparent font-black text-slate-900 uppercase text-lg flex-1 outline-none" placeholder={`Nom Menu ${label}`} value={menu.menuName || ''} onChange={(e) => updateField(`days.${dIdx}.${mKey}.menuName`, e.target.value)} />
                        </div>
                        <div className="space-y-4">
                          <textarea className="w-full text-xs p-2 bg-slate-50 rounded outline-none h-10" placeholder="Entrée" value={menu.entree || ''} onChange={(e) => updateField(`days.${dIdx}.${mKey}.entree`, e.target.value)} />
                          <textarea className="w-full text-xs p-2 bg-slate-50 rounded outline-none h-14" placeholder="Plat" value={menu.plat || ''} onChange={(e) => updateField(`days.${dIdx}.${mKey}.plat`, e.target.value)} />
                          <input className="w-full text-xs p-2 bg-slate-50 rounded outline-none" placeholder="Fromage" value={menu.fromage || ''} onChange={(e) => updateField(`days.${dIdx}.${mKey}.fromage`, e.target.value)} />
                          <input className="w-full text-xs p-2 bg-slate-50 rounded outline-none" placeholder="Dessert" value={menu.dessert || ''} onChange={(e) => updateField(`days.${dIdx}.${mKey}.dessert`, e.target.value)} />
                          
                          {/* Régimes spécifiques au repas */}
                          <div className="pt-4 border-t space-y-3">
                             <div className="flex items-center justify-between">
                                <h5 className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-2"><ShieldAlert size={14}/> Régimes / Allergies Repas</h5>
                                <button onClick={() => addItem(`days.${dIdx}.${mKey}.allergies`, { nb: "1", name: "", restriction: "" })} className="text-[8px] font-black text-indigo-600 uppercase border border-indigo-100 px-2 py-0.5 rounded-full hover:bg-indigo-50">+ Ajouter</button>
                             </div>
                             <div className="space-y-2">
                                {(menu.allergies || []).map((a, aIdx) => (
                                  <div key={aIdx} className="flex items-center gap-2 bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                                    <input className="w-8 text-[10px] font-black bg-white rounded border border-amber-100 px-1 text-center" value={a.nb} onChange={(e) => updateField(`days.${dIdx}.${mKey}.allergies.${aIdx}.nb`, e.target.value)} />
                                    <input className="flex-1 text-[10px] font-bold bg-white rounded border border-amber-100 px-2" placeholder="Nom" value={a.name} onChange={(e) => updateField(`days.${dIdx}.${mKey}.allergies.${aIdx}.name`, e.target.value)} />
                                    <input className="flex-1 text-[10px] italic bg-white rounded border border-amber-100 px-2" placeholder="Restriction" value={a.restriction} onChange={(e) => updateField(`days.${dIdx}.${mKey}.allergies.${aIdx}.restriction`, e.target.value)} />
                                    <button onClick={() => removeItem(`days.${dIdx}.${mKey}.allergies`, aIdx)} className="text-rose-400 hover:text-rose-600"><Trash2 size={14}/></button>
                                  </div>
                                ))}
                             </div>
                          </div>

                          <div className="pt-4 border-t grid grid-cols-2 gap-4">
                             <div><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Vin Nb</label><input className="w-full text-xs font-black p-2 bg-rose-50 text-rose-600 rounded outline-none" value={menu.vinNb || ''} onChange={(e) => updateField(`days.${dIdx}.${mKey}.vinNb`, e.target.value)} /></div>
                             <div><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Soft Nb</label><input className="w-full text-xs font-black p-2 bg-blue-50 text-blue-600 rounded outline-none" value={menu.softNb || ''} onChange={(e) => updateField(`days.${dIdx}.${mKey}.softNb`, e.target.value)} /></div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                             <span className="text-[10px] font-black uppercase">Apéritif ?</span>
                             <button onClick={() => updateField(`days.${dIdx}.${mKey}.hasAperitif`, !menu.hasAperitif)}>{menu.hasAperitif ? <CheckSquare size={18} className="text-emerald-600"/> : <Square size={18}/>}</button>
                          </div>
                          {menu.hasAperitif && <input className="w-full text-xs p-2 bg-amber-50 rounded outline-none" placeholder="Type Cocktail" value={menu.aperitifName || ''} onChange={(e) => updateField(`days.${dIdx}.${mKey}.aperitifName`, e.target.value)} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-12">
            {formData.days.map((day, dIdx) => (
              <div key={dIdx} className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <h4 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2"><BedDouble size={20}/> Hébergement du {day.date || '...'}</h4>
                  <button onClick={() => addItem(`days.${dIdx}.hebergement`, { nbChambres: "0", typeChambre: "Twin", nbPersonnes: "0" })} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Plus size={16}/> Ajouter chambres</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {(day.hebergement || []).map((h, hIdx) => (
                    <div key={hIdx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-4 gap-4 items-center">
                      <div><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Nb Chambres</label><input className="w-full p-2 bg-slate-50 font-black rounded" value={h.nbChambres} onChange={(e) => updateField(`days.${dIdx}.hebergement.${hIdx}.nbChambres`, e.target.value)} /></div>
                      <div><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Type</label><input className="w-full p-2 bg-slate-50 font-black rounded" value={h.typeChambre} onChange={(e) => updateField('days.' + dIdx + '.hebergement.' + hIdx + '.typeChambre', e.target.value)} /></div>
                      <div><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Nb Personnes</label><input className="w-full p-2 bg-slate-50 font-black rounded" value={h.nbPersonnes} onChange={(e) => updateField(`days.${dIdx}.hebergement.${hIdx}.nbPersonnes`, e.target.value)} /></div>
                      <div className="flex justify-end"><button onClick={() => removeItem(`days.${dIdx}.hebergement`, hIdx)} className="text-rose-300 hover:text-rose-500"><Trash2 size={20}/></button></div>
                    </div>
                  ))}
                  {(day.hebergement || []).length === 0 && <p className="text-center italic text-slate-400 text-xs">Aucun hébergement configuré</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-12">
            {formData.days.map((day, dIdx) => (
              <div key={dIdx} className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <h4 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2"><Layers size={20}/> Disposition des Salles - {day.date || '...'}</h4>
                  <button onClick={() => addItem(`days.${dIdx}.sallesDisposition`, { salle: "", pax: "", format: "", materiel: "" })} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Plus size={16}/> Ajouter salle</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {(day.sallesDisposition || []).map((s, sIdx) => (
                    <div key={sIdx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3"><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Salle</label><input className="w-full p-2 bg-slate-50 font-black rounded text-xs" value={s.salle} onChange={(e) => updateField(`days.${dIdx}.sallesDisposition.${sIdx}.salle`, e.target.value)} /></div>
                      <div className="col-span-1"><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">PAX</label><input className="w-full p-2 bg-slate-50 font-black rounded text-center text-xs" value={s.pax} onChange={(e) => updateField(`days.${dIdx}.sallesDisposition.${sIdx}.pax`, e.target.value)} /></div>
                      <div className="col-span-4"><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Format</label><input className="w-full p-2 bg-slate-50 font-black rounded text-xs" value={s.format} onChange={(e) => updateField(`days.${dIdx}.sallesDisposition.${sIdx}.format`, e.target.value)} /></div>
                      <div className="col-span-3"><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Matériel</label><input className="w-full p-2 bg-slate-50 font-black rounded text-xs" value={s.materiel} onChange={(e) => updateField(`days.${dIdx}.sallesDisposition.${sIdx}.materiel`, e.target.value)} /></div>
                      <div className="col-span-1 flex justify-end"><button onClick={() => removeItem(`days.${dIdx}.sallesDisposition`, sIdx)} className="text-rose-300 hover:text-rose-500"><Trash2 size={20}/></button></div>
                    </div>
                  ))}
                  {(day.sallesDisposition || []).length === 0 && <p className="text-center italic text-slate-400 text-xs">Aucune disposition de salle configurée</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-12">
            {formData.days.map((day, dIdx) => (
              <div key={dIdx} className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <h4 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2"><Trophy size={20}/> Team Building du {day.date || '...'}</h4>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400">Activer Team Building pour ce jour ?</span>
                    <button 
                      onClick={() => updateField(`days.${dIdx}.teamBuilding.enabled`, !day.teamBuilding?.enabled)}
                      className={`w-12 h-6 rounded-full transition-all relative ${day.teamBuilding?.enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${day.teamBuilding?.enabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                  {day.teamBuilding?.enabled && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-2">Description de l'activité</label>
                      <textarea 
                        className="w-full p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 outline-none focus:border-indigo-500 font-medium text-sm transition-all h-24"
                        placeholder="Ex: Olympiades dans le parc, Chasse au trésor..."
                        value={day.teamBuilding?.description || ''}
                        onChange={(e) => updateField(`days.${dIdx}.teamBuilding.description`, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-12">
            <section className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 space-y-6">
              <h4 className="font-black text-rose-600 uppercase text-xs flex items-center gap-2"><CreditCard size={18}/> Prise en charge des Extras</h4>
              <div className="grid grid-cols-3 gap-6">
                <div><label className="text-[9px] font-black uppercase text-rose-400 block mb-1">BAR</label><select className="w-full p-4 rounded-xl border border-rose-200 font-bold text-xs bg-white" value={formData.extras?.bar} onChange={(e) => updateField('extras.bar', e.target.value)}><option value="Société">Société</option><option value="Individuel">Individuel</option></select></div>
                <div><label className="text-[9px] font-black uppercase text-rose-400 block mb-1">RESTAURANT</label><select className="w-full p-4 rounded-xl border border-rose-200 font-bold text-xs bg-white" value={formData.extras?.restaurant} onChange={(e) => updateField('extras.restaurant', e.target.value)}><option value="Société">Société</option><option value="Individuel">Individuel</option></select></div>
                <div><label className="text-[9px] font-black uppercase text-rose-400 block mb-1">TRANSFERT LEADER</label><select className="w-full p-4 rounded-xl border border-rose-200 font-bold text-xs bg-white" value={formData.extras?.transfert} onChange={(e) => updateField('extras.transfert', e.target.value)}><option value="OUI">OUI</option><option value="NON">NON</option></select></div>
              </div>
            </section>
            
            <section className="bg-slate-50 p-8 rounded-[2.5rem] space-y-4">
              <h4 className="font-black text-slate-900 uppercase text-xs">Instructions & Commentaires</h4>
              <textarea className="w-full h-32 p-6 rounded-[2rem] border-2 border-white outline-none focus:border-indigo-500 font-medium text-sm transition-all" placeholder="Instructions particulières pour les équipes..." value={formData.commentairesEquipe} onChange={(e) => updateField('commentairesEquipe', e.target.value)} />
            </section>
          </div>
        )}
      </div>

      <footer className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border-2 border-slate-900 no-print shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
        <button onClick={() => setStep(s => Math.max(1, s-1))} className="text-slate-500 font-black uppercase text-xs px-6 py-2 disabled:opacity-20" disabled={step === 1}>Précédent</button>
        <button onClick={() => step < 7 ? setStep(step + 1) : onSave(formData)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all">
          {step === 7 ? "Finaliser" : "Suivant"}
        </button>
      </footer>
    </div>
  );
};

export default NewPrestationForm;
