
import React, { useState, useMemo } from 'react';
import { SavedEvent, Prestation } from '../types';
import { 
  Calendar, Users, MapPin, Clock, BedDouble, 
  ChevronRight, Search, Printer, Coffee, 
  Utensils, LogIn, LogOut, Presentation, 
  Info, Sparkles, Timer, Loader2, Save, CheckCircle,
  Building2,
  Home
} from 'lucide-react';

declare var html2pdf: any;

interface DailyOrgViewProps {
  events: SavedEvent[];
  onSelectEvent: (id: string) => void;
  onUpdateEvent: (updatedEvent: SavedEvent) => void;
}

interface TimelineItem {
  event: SavedEvent;
  prestation: Prestation;
  dayIndex: number;
  prestationIndex: number;
  time: string;
  hour: number;
  minutes: number;
  type: string; // Utilise maintenant les catégories fixes
}

// Palette de couleurs par CATÉGORIE
const CATEGORY_STYLES: { [key: string]: any } = {
  'Arrivée': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', marker: 'bg-blue-600', light: 'bg-blue-100', icon: <LogIn size={20} /> },
  'Pause': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', marker: 'bg-amber-600', light: 'bg-amber-100', icon: <Coffee size={20} /> },
  'Réunion': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', marker: 'bg-indigo-600', light: 'bg-indigo-100', icon: <Presentation size={20} /> },
  'Déjeuner': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', marker: 'bg-emerald-600', light: 'bg-emerald-100', icon: <Utensils size={20} /> },
  'Dîner': { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', marker: 'bg-rose-600', light: 'bg-rose-100', icon: <Utensils size={20} /> },
  'Départ': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', marker: 'bg-slate-600', light: 'bg-slate-100', icon: <LogOut size={20} /> },
  'Autre': { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-500', marker: 'bg-slate-400', light: 'bg-slate-50', icon: <Info size={20} /> }
};

const DailyOrgView: React.FC<DailyOrgViewProps> = ({ events, onSelectEvent, onUpdateEvent }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{[key: string]: boolean}>({});

  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    (events || []).forEach(event => {
      (event.days || []).forEach(day => {
        if (day.date) dates.add(day.date);
      });
    });
    
    return Array.from(dates).sort((a, b) => {
        const parse = (dStr: string) => {
            const parts = dStr.split(/\s+/);
            const months: any = { "janvier": 0, "fevrier": 1, "mars": 2, "avril": 3, "mai": 4, "juin": 5, "juillet": 6, "aout": 7, "septembre": 8, "octobre": 9, "novembre": 10, "decembre": 11 };
            let d = 1, m = 0, y = 2024;
            parts.forEach(p => {
                const n = parseInt(p);
                if (!isNaN(n)) n > 31 ? y = n : d = n;
                Object.keys(months).forEach(mk => { if(p.toLowerCase().includes(mk)) m = months[mk]; });
            });
            return new Date(y, m, d).getTime();
        };
        return parse(a) - parse(b);
    });
  }, [events]);

  if (!selectedDate && availableDates.length > 0) {
    setSelectedDate(availableDates[0]);
  }

  const timelineData = useMemo(() => {
    if (!selectedDate) return [];
    const items: TimelineItem[] = [];

    (events || []).forEach(event => {
      const dIdx = (event.days || []).findIndex(d => d.date === selectedDate);
      if (dIdx !== -1) {
        (event.days[dIdx].prestations || []).forEach((p, pIdx) => {
          const timeMatch = (p.horaires || '').match(/(\d{1,2})[h:](\d{0,2})/i);
          let h = 23, m = 59;
          if (timeMatch) {
            h = parseInt(timeMatch[1]);
            m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          }
          
          let category = p.type || 'Autre';
          // Tolérance pour les anciennes fiches importées
          if (!CATEGORY_STYLES[category]) {
              const t = category.toLowerCase();
              if (t.includes('déjeuner')) category = 'Déjeuner';
              else if (t.includes('dîner')) category = 'Dîner';
              else if (t.includes('pause') || t.includes('café')) category = 'Pause';
              else if (t.includes('arrivée')) category = 'Arrivée';
              else if (t.includes('départ') || t.includes('fin')) category = 'Départ';
              else if (t.includes('réunion') || t.includes('salle')) category = 'Réunion';
              else category = 'Autre';
          }

          items.push({ event, prestation: p, dayIndex: dIdx, prestationIndex: pIdx, time: p.horaires || '--:--', hour: h, minutes: m, type: category });
        });
      }
    });

    return items.sort((a, b) => {
        const scoreA = (a.type === 'Départ' ? 20000 : 0) + (a.hour * 60 + a.minutes);
        const scoreB = (b.type === 'Départ' ? 20000 : 0) + (b.hour * 60 + b.minutes);
        return scoreA - scoreB;
    });
  }, [selectedDate, events]);

  const dailyAccommodation = useMemo(() => {
    if (!selectedDate) return [];
    const acc: { entreprise: string, rooms: any[] }[] = [];
    events.forEach(event => {
      const day = event.days.find(d => d.date === selectedDate);
      if (day && day.hebergement && day.hebergement.length > 0) {
        acc.push({
          entreprise: event.entreprise,
          rooms: day.hebergement
        });
      }
    });
    return acc;
  }, [selectedDate, events]);

  const handleInlineUpdate = (item: TimelineItem, field: 'pax' | 'lieu', value: string) => {
    const updatedEvent = JSON.parse(JSON.stringify(item.event)) as SavedEvent;
    if (updatedEvent.days[item.dayIndex] && updatedEvent.days[item.dayIndex].prestations[item.prestationIndex]) {
        updatedEvent.days[item.dayIndex].prestations[item.prestationIndex][field] = value;
        onUpdateEvent(updatedEvent);
        
        const syncKey = `${item.event.id}-${item.dayIndex}-${item.prestationIndex}`;
        setSyncStatus(prev => ({ ...prev, [syncKey]: true }));
        setTimeout(() => {
            setSyncStatus(prev => ({ ...prev, [syncKey]: false }));
        }, 2000);
    }
  };

  const groupedTimeline = useMemo(() => {
    const groups: { [key: string]: TimelineItem[] } = {};
    timelineData.forEach(item => {
      const key = item.type === 'Départ' ? 'DEPART' : item.hour.toString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [timelineData]);

  const sortedGroupKeys = useMemo(() => {
    const keys = Object.keys(groupedTimeline);
    return keys.sort((a, b) => {
        if (a === 'DEPART') return 1;
        if (b === 'DEPART') return -1;
        return parseInt(a) - parseInt(b);
    });
  }, [groupedTimeline]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('daily-org-content');
    if (!element) return;
    setIsGeneratingPDF(true);
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Journal_${selectedDate.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    try { await html2pdf().set(opt).from(element).save(); } catch (err) { console.error(err); } finally { setIsGeneratingPDF(false); }
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-xl border-b-4 border-emerald-500">
                <Timer size={32} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Journal du Jour</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Intelligence Opérationnelle par Catégorie</p>
            </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <Search size={18} className="text-slate-400 ml-2" />
            <select className="bg-transparent border-none outline-none font-black text-slate-900 text-sm py-1 pr-8 cursor-pointer uppercase tracking-tighter" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>{availableDates.map(d => (<option key={d} value={d}>{d}</option>))}</select>
            <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50">{isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} {isGeneratingPDF ? 'GÉNÉRATION...' : 'IMPRIMER PDF'}</button>
        </div>
      </header>

      {availableDates.length === 0 ? (
        <div className="text-center py-32 bg-white border-4 border-dashed border-slate-200 rounded-[3rem]"><Calendar size={64} className="text-slate-200 mx-auto mb-4" /><h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Aucune donnée</h3></div>
      ) : (
        <div id="daily-org-content" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start p-2">
          <div className="lg:col-span-8 space-y-12">
            {sortedGroupKeys.map(key => (
              <div key={key} className="relative">
                <div className="sticky top-4 z-10 flex items-center gap-4 mb-8">
                    <div className={`px-8 py-3 rounded-full font-black text-xl shadow-2xl border-4 border-white flex items-center gap-3 ${key === 'DEPART' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>{key === 'DEPART' ? (<><LogOut size={22} className="text-rose-200" /> FIN DE JOURNÉE</>) : (<><Clock size={22} className="text-emerald-400" /> {key}h00</>)}</div>
                    <div className={`h-1 flex-1 rounded-full ${key === 'DEPART' ? 'bg-rose-100' : 'bg-slate-100'}`}></div>
                </div>
                <div className={`grid grid-cols-1 gap-8 pl-12 border-l-4 ml-10 transition-all ${key === 'DEPART' ? 'border-rose-200' : 'border-slate-100'}`}>
                  {groupedTimeline[key].map((item, idx) => {
                    const style = CATEGORY_STYLES[item.type] || CATEGORY_STYLES['Autre'];
                    const syncKey = `${item.event.id}-${item.dayIndex}-${item.prestationIndex}`;
                    const isSynced = syncStatus[syncKey];

                    return (
                      <div key={idx} className={`group bg-white border-2 ${style.border} rounded-[2rem] p-7 hover:shadow-2xl transition-all relative overflow-hidden shadow-sm`}>
                        <div className={`absolute top-0 left-0 w-4 h-full ${style.marker}`}></div>
                        {isSynced && <div className="absolute top-3 right-6 flex items-center gap-1 text-[10px] font-black text-emerald-600 animate-bounce uppercase tracking-widest"><CheckCircle size={14}/> Synchronisé</div>}
                        <div className="flex flex-col gap-8">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="flex items-start gap-6">
                                    <div className={`p-5 rounded-2xl ${style.light} ${style.text} shadow-inner flex items-center justify-center`}>
                                        {style.icon}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[12px] font-black uppercase tracking-[0.2em] bg-slate-900 text-white px-3 py-1 rounded-lg`}>{item.time}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>{item.type}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Building2 size={18} className={style.text} />
                                            <h4 onClick={() => onSelectEvent(item.event.id)} className="text-3xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors cursor-pointer leading-none">
                                                {item.event.entreprise || 'Groupe sans nom'}
                                            </h4>
                                        </div>
                                        <p className="text-slate-500 font-bold text-lg italic">{item.prestation.nom || 'Sans intitulé spécifique'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 self-end md:self-start">
                                    <div className={`flex flex-col items-center justify-center ${style.bg} px-6 py-4 rounded-[1.5rem] border-2 ${style.border} shadow-sm min-w-[110px] group/pax relative transition-all hover:scale-105`}>
                                        <input 
                                          className={`text-3xl font-black text-center w-20 outline-none bg-transparent ${style.text} focus:bg-white rounded-xl`}
                                          value={item.prestation.pax || '0'}
                                          onChange={(e) => handleInlineUpdate(item, 'pax', e.target.value)}
                                        />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Effectif PAX</span>
                                    </div>
                                    <div className="flex flex-col items-start bg-white px-6 py-4 rounded-[1.5rem] border-2 border-slate-100 shadow-sm min-w-[240px] group/lieu transition-all hover:border-slate-300">
                                        <div className="flex items-center gap-2 text-indigo-600 w-full mb-1">
                                            <MapPin size={20} className="shrink-0" />
                                            <input 
                                              className="text-lg font-black uppercase tracking-tight outline-none w-full bg-transparent focus:bg-slate-50 rounded-lg p-1 placeholder:text-slate-200"
                                              value={item.prestation.lieu || ''}
                                              placeholder="LIEU À PRÉCISER"
                                              onChange={(e) => handleInlineUpdate(item, 'lieu', e.target.value)}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Emplacement Logistique</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 no-print opacity-60">
                                <div className={`h-1.5 flex-1 rounded-full ${style.light} overflow-hidden`}>
                                    <div className={`h-full ${style.marker}`} style={{ width: '40%' }}></div>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Classification {item.type}</span>
                            </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 space-y-8 sticky top-8 print:relative print:top-0">
            {/* Légende Catégories */}
            <section className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center gap-3">
                    <Users size={24} className="text-indigo-600" /> Légende Catégories
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    {Object.keys(CATEGORY_STYLES).filter(k => k !== 'Autre').map(cat => (
                        <div key={cat} className={`flex items-center gap-3 p-3 rounded-xl border ${CATEGORY_STYLES[cat].border} ${CATEGORY_STYLES[cat].bg}`}>
                            <div className={`w-8 h-8 rounded-lg ${CATEGORY_STYLES[cat].marker} text-white flex items-center justify-center`}>
                                {CATEGORY_STYLES[cat].icon}
                            </div>
                            <span className={`font-black uppercase text-xs ${CATEGORY_STYLES[cat].text}`}>{cat}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Récapitulatif Hébergement */}
            <section className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center gap-3">
                    <BedDouble size={24} className="text-emerald-600" /> Hébergement du Jour
                </h3>
                {dailyAccommodation.length > 0 ? (
                  <div className="space-y-8">
                    {dailyAccommodation.map((item, idx) => (
                      <div key={idx} className="border-b-2 border-slate-100 last:border-0 pb-6 last:pb-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 size={16} className="text-slate-400" />
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{item.entreprise}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {item.rooms.map((room, rIdx) => (
                            <div key={rIdx} className="bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Home size={24} className="text-emerald-600" />
                              </div>
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <div className="font-black text-emerald-900 text-sm leading-none">
                                    {room.nbChambres} {room.typeChambre}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600/70 uppercase">
                                    <Users size={12} /> {room.nbPersonnes} PAX
                                  </div>
                                </div>
                              </div>
                              {room.notes && (
                                <div className="mt-3 text-[10px] font-bold italic text-emerald-700 bg-white/50 p-2 rounded-lg border border-emerald-100 flex items-start gap-2">
                                  <Info size={14} className="shrink-0 text-emerald-500" />
                                  <span>{room.notes}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <BedDouble size={48} className="mx-auto text-slate-100 mb-4" />
                    <p className="text-xs font-bold italic text-slate-400 uppercase tracking-widest">Aucune nuitée ce jour</p>
                  </div>
                )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyOrgView;
