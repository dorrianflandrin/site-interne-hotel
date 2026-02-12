
import React, { useState, useMemo } from 'react';
import { SavedEvent, DayData, Prestation } from '../types';
import { 
  Coffee, 
  ChevronRight, 
  Users, 
  Calendar, 
  ArrowLeft,
  Search,
  Printer,
  Loader2,
  Square,
  LayoutGrid,
  Filter,
  Layers
} from 'lucide-react';

declare var html2pdf: any;

interface RestaurantViewProps {
  events: SavedEvent[];
}

interface AggregatedPause {
  entreprise: string;
  pax: string;
  type: string;
  nom: string;
  horaires: string;
  lieu: string;
  timeValue: number;
}

const RestaurantView: React.FC<RestaurantViewProps> = ({ events }) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'by-group' | 'by-day'>('by-group');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Liste de toutes les dates uniques présentes dans tous les événements
  const allAvailableDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach(event => {
      event.days.forEach(day => {
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

  // Initialisation de la date sélectionnée si vide
  React.useEffect(() => {
    if (!selectedDate && allAvailableDates.length > 0) {
      setSelectedDate(allAvailableDates[0]);
    }
  }, [allAvailableDates, selectedDate]);

  // Calcul des pauses agrégées pour la vue par jour
  const aggregatedPauses = useMemo(() => {
    if (!selectedDate) return [];
    const results: AggregatedPause[] = [];
    const validPauseTypes = ["Café d'accueil", "Pause AM", "Pause PM"];

    events.forEach(event => {
      const dayData = event.days.find(d => d.date === selectedDate);
      if (dayData) {
        dayData.prestations.forEach(p => {
          const isPause = validPauseTypes.some(vt => p.type.toLowerCase().includes(vt.toLowerCase()));
          if (isPause) {
            const timeMatch = (p.horaires || '').match(/(\d{1,2})[h:](\d{0,2})/i);
            let timeValue = 0;
            if (timeMatch) {
              timeValue = parseInt(timeMatch[1]) * 60 + (timeMatch[2] ? parseInt(timeMatch[2]) : 0);
            }
            results.push({
              entreprise: event.entreprise,
              pax: p.pax || '0',
              type: p.type,
              nom: p.nom || p.type,
              horaires: p.horaires || '--:--',
              lieu: p.lieu || '—',
              timeValue
            });
          }
        });
      }
    });

    return results.sort((a, b) => a.timeValue - b.timeValue);
  }, [selectedDate, events]);

  const selectedEvent = useMemo(() => 
    events.find(e => e.id === selectedEventId), 
    [selectedEventId, events]
  );

  const eventDates = useMemo(() => {
    if (!selectedEvent) return [];
    return selectedEvent.days.map(d => d.date);
  }, [selectedEvent]);

  // Si on est en mode groupe et qu'on change d'événement, on ajuste la date
  React.useEffect(() => {
    if (selectedEventId && eventDates.length > 0 && !eventDates.includes(selectedDate)) {
      setSelectedDate(eventDates[0]);
    }
  }, [selectedEventId, eventDates, selectedDate]);

  const currentEventDayData = useMemo(() => {
    if (!selectedEvent) return null;
    return selectedEvent.days.find(d => d.date === selectedDate);
  }, [selectedEvent, selectedDate]);

  const groupPausePrestations = useMemo(() => {
    if (!currentEventDayData) return [];
    const validTypes = ["Café d'accueil", "Pause AM", "Pause PM"];
    return currentEventDayData.prestations.filter(p => 
      validTypes.some(vt => p.type.toLowerCase().includes(vt.toLowerCase()))
    ).map(p => ({
      ...p,
      entreprise: selectedEvent.entreprise
    }));
  }, [currentEventDayData, selectedEvent]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (b.weekNumber !== a.weekNumber) return b.weekNumber - a.weekNumber;
      return a.entreprise.localeCompare(b.entreprise);
    });
  }, [events]);

  const handleDownloadPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    setIsGeneratingPDF(true);
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try { await html2pdf().set(opt).from(element).save(); } 
    catch (err) { console.error(err); } 
    finally { setIsGeneratingPDF(false); }
  };

  // Rendu de la table de pauses (utilisée pour les deux vues)
  const renderPauseTable = (pauses: any[], date: string, id: string) => (
    <div id={id} className="bg-white p-12 border border-slate-200 shadow-2xl mx-auto w-full max-w-[210mm] print:shadow-none print:border-none print:p-0">
      <div className="text-center mb-10">
        <h1 className="text-rose-500 font-black italic underline uppercase text-xl mb-4">
          TABLEAU DES PAUSES SEMINAIRES :
        </h1>
        <div className="inline-block border-2 border-slate-500 p-4 min-w-[300px]">
          <h2 className="text-3xl font-black text-slate-700 uppercase">
            {date.toUpperCase()}
          </h2>
        </div>
      </div>

      <table className="w-full border-collapse border-[2px] border-black">
        <thead>
          <tr className="bg-slate-100 divide-x divide-black h-12">
            <th className="border-b-[2px] border-black px-4 text-left font-black italic text-rose-600 text-[11px] uppercase w-[25%]">Nom du groupe</th>
            <th className="border-b-[2px] border-black px-2 text-center font-black italic text-rose-600 text-[11px] uppercase w-[10%]">Nb de pax</th>
            <th className="border-b-[2px] border-black px-4 text-center font-black italic text-rose-600 text-[11px] uppercase w-[20%]">TYPE DE PAUSE</th>
            <th className="border-b-[2px] border-black px-2 text-center font-black italic text-rose-600 text-[11px] uppercase w-[10%]">Heure</th>
            <th className="border-b-[2px] border-black px-4 text-center font-black italic text-rose-600 text-[11px] uppercase w-[15%]">LIEUX</th>
            <th className="border-b-[2px] border-black px-2 text-center font-black italic text-rose-600 text-[11px] uppercase w-[10%]">Pausée</th>
            <th className="border-b-[2px] border-black px-4 text-center font-black italic text-rose-600 text-[11px] uppercase w-[10%]">Débarrassée</th>
          </tr>
        </thead>
        <tbody>
          {pauses.length > 0 ? (
            pauses.map((p, idx) => (
              <tr key={idx} className="divide-x divide-black border-b border-black h-16">
                <td className="px-4 font-bold text-slate-800 uppercase text-[10px]">{p.entreprise}</td>
                <td className="px-2 text-center font-black text-sm">{p.pax || '0'}</td>
                <td className="px-4 text-center font-bold text-slate-700 uppercase text-[9px] leading-tight">{p.nom || p.type}</td>
                <td className="px-2 text-center font-black text-sm">{p.horaires || '--:--'}</td>
                <td className="px-4 text-center font-bold uppercase text-[9px]">{p.lieu || '—'}</td>
                <td className="px-2 text-center">
                  <div className="w-5 h-5 border-[1.5px] border-black mx-auto rounded-sm"></div>
                </td>
                <td className="px-4 text-center">
                  <div className="w-5 h-5 border-[1.5px] border-black mx-auto rounded-sm"></div>
                </td>
              </tr>
            ))
          ) : (
            <tr className="h-16">
              <td colSpan={7} className="text-center italic text-slate-400">Aucune pause pour cette date.</td>
            </tr>
          )}
          {/* Remplissage de lignes vides pour atteindre 15 lignes */}
          {Array.from({ length: Math.max(0, 15 - pauses.length) }).map((_, i) => (
            <tr key={`empty-${i}`} className="divide-x divide-black border-b border-black h-16">
               <td className="px-4"></td>
               <td className="px-2"></td>
               <td className="px-4"></td>
               <td className="px-2"></td>
               <td className="px-4"></td>
               <td className="px-2 text-center"><div className="w-5 h-5 border-[1.5px] border-black mx-auto rounded-sm"></div></td>
               <td className="px-4 text-center"><div className="w-5 h-5 border-[1.5px] border-black mx-auto rounded-sm"></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Vue d'un groupe spécifique
  if (selectedEventId && selectedEvent) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-slate-900 pb-6 no-print">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setSelectedEventId(null)}
                className="p-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{selectedEvent.entreprise}</h2>
              <p className="text-amber-600 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                <Coffee size={14} /> Planning Pauses Groupe
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <Calendar size={18} className="text-slate-400 ml-2" />
                <select 
                  className="bg-transparent border-none outline-none font-black text-slate-900 text-sm py-1 pr-8 cursor-pointer uppercase tracking-tighter"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  {eventDates.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => handleDownloadPDF('pause-table-print', `Pauses_${selectedEvent.entreprise}_${selectedDate}`)} 
                disabled={isGeneratingPDF}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                Imprimer
              </button>
          </div>
        </header>

        {renderPauseTable(groupPausePrestations, selectedDate, 'pause-table-print')}
      </div>
    );
  }

  // Vue globale par jour
  if (viewMode === 'by-day') {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-slate-900 pb-6 no-print">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setViewMode('by-group')}
                className="p-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Vue Quotidienne</h2>
              <p className="text-amber-600 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                <Layers size={14} /> Tous les Groupes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <Calendar size={18} className="text-slate-400 ml-2" />
                <select 
                  className="bg-transparent border-none outline-none font-black text-slate-900 text-sm py-1 pr-8 cursor-pointer uppercase tracking-tighter"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  {allAvailableDates.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => handleDownloadPDF('daily-pauses-print', `Tableau_Pauses_${selectedDate}`)} 
                disabled={isGeneratingPDF}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                Imprimer Planning Jour
              </button>
          </div>
        </header>

        {renderPauseTable(aggregatedPauses, selectedDate, 'daily-pauses-print')}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Restaurant</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Gestion des pauses et logistique service</p>
        </div>
        <div className="flex p-1 bg-slate-200 rounded-2xl no-print">
            <button 
              onClick={() => setViewMode('by-group')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'by-group' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Filter size={14} /> Par Groupe
            </button>
            <button 
              onClick={() => setViewMode('by-day')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'by-day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Layers size={14} /> Par Jour
            </button>
        </div>
      </header>

      {events.length === 0 ? (
        <div className="text-center py-32 bg-white border-4 border-dashed border-slate-200 rounded-[3rem]">
          <Coffee size={64} className="text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Aucun groupe actif</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map(event => (
            <div 
              key={event.id}
              className="group bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl hover:border-amber-600 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => setSelectedEventId(event.id)}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:bg-amber-600"></div>
              
              <div className="relative z-10">
                <div className="mb-4">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full group-hover:bg-white transition-colors">
                    Dossier #{event.id.substring(0, 8)}
                  </span>
                </div>

                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-6 group-hover:text-amber-700 transition-colors">
                  {event.entreprise}
                </h4>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-tight">
                    <Calendar size={16} className="text-amber-500" />
                    <span>Semaine {event.weekNumber} ({event.year})</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-tight">
                    <Users size={16} className="text-indigo-500" />
                    <span>Max {Math.max(...event.days.map(d => parseInt(d.prestations[0]?.pax || '0')))} PAX</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Coffee size={16} className="text-amber-600" /> Tableau des Pauses
                  </span>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-amber-600 transform group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantView;
