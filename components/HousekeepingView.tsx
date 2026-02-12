
import React, { useState, useMemo } from 'react';
import { SavedEvent, DayData, SalleDisposition } from '../types';
import { 
  Shapes, 
  ChevronRight, 
  Users, 
  Calendar, 
  ArrowLeft,
  Printer,
  Loader2,
  Monitor,
  Layout,
  Layers,
  CheckCircle2,
  LayoutGrid,
  Filter,
  Building2
} from 'lucide-react';

declare var html2pdf: any;

interface HousekeepingViewProps {
  events: SavedEvent[];
}

interface AggregatedRoom extends SalleDisposition {
  entreprise: string;
  eventId: string;
}

const HousekeepingView: React.FC<HousekeepingViewProps> = ({ events }) => {
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

  const currentDayData = useMemo(() => {
    if (!selectedEvent) return null;
    return selectedEvent.days.find(d => d.date === selectedDate);
  }, [selectedEvent, selectedDate]);

  // Agrégation de toutes les salles pour la vue par jour
  const dailyAggregatedRooms = useMemo(() => {
    if (!selectedDate) return [];
    const rooms: AggregatedRoom[] = [];
    events.forEach(event => {
      const day = event.days.find(d => d.date === selectedDate);
      if (day && day.sallesDisposition) {
        day.sallesDisposition.forEach(s => {
          rooms.push({
            ...s,
            entreprise: event.entreprise,
            eventId: event.id
          });
        });
      }
    });
    return rooms.sort((a, b) => a.entreprise.localeCompare(b.entreprise));
  }, [selectedDate, events]);

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
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    try { await html2pdf().set(opt).from(element).save(); } 
    catch (err) { console.error(err); } 
    finally { setIsGeneratingPDF(false); }
  };

  // Composant de rendu d'une carte de salle
  const renderRoomCard = (s: AggregatedRoom | (SalleDisposition & { entreprise?: string }), idx: number) => (
    <div key={idx} className="bg-white border-4 border-slate-900 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col relative h-full">
      <div className="bg-indigo-600 text-white p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layout size={32} />
          <h3 className="text-3xl font-black uppercase tracking-tighter italic">{s.salle || 'SALLE À DÉFINIR'}</h3>
        </div>
        <div className="bg-white/20 px-4 py-2 rounded-2xl flex items-center gap-2">
           <Users size={20} className="text-indigo-100" />
           <span className="text-3xl font-black">{s.pax || '0'}</span>
        </div>
      </div>
      
      <div className="p-8 space-y-8 flex-1">
        {s.entreprise && (
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Groupe / Entreprise</span>
            <div className="flex items-center gap-2 text-indigo-700 font-black uppercase text-lg italic leading-none">
              <Building2 size={18} />
              {s.entreprise}
            </div>
          </div>
        )}

        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Format de disposition</span>
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[2rem] border-l-8 border-indigo-600">
            <Monitor size={24} className="text-indigo-600" />
            <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">{s.format || 'STANDARD'}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Matériel & Équipement</span>
          <div className="bg-slate-50 p-6 rounded-[2rem] min-h-[100px] border border-slate-100">
             {s.materiel ? (
               <p className="text-slate-700 font-bold whitespace-pre-wrap italic leading-relaxed">
                 {s.materiel}
               </p>
             ) : (
               <p className="text-slate-300 italic">Aucun matériel spécifique renseigné.</p>
             )}
          </div>
        </div>
      </div>
      <div className="bg-slate-900 text-white p-4 text-center">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Housekeeping Management System</span>
      </div>
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
              <p className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                <Shapes size={14} /> Dossier Housekeeping Groupe
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
                onClick={() => handleDownloadPDF('housekeeping-print-content', `Housekeeping_${selectedEvent.entreprise}_${selectedDate}`)} 
                disabled={isGeneratingPDF}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                Imprimer Mise en Place
              </button>
          </div>
        </header>

        <div id="housekeeping-print-content" className="space-y-10 print:space-y-6">
          <div className="hidden print:block text-center border-b-4 border-slate-900 pb-6 mb-10">
             <h1 className="text-4xl font-black uppercase italic tracking-tighter">{selectedEvent.entreprise}</h1>
             <p className="text-xl font-bold uppercase tracking-widest mt-2 text-indigo-600">PLANNING MISE EN PLACE SALLES — {selectedDate.toUpperCase()}</p>
          </div>

          {currentDayData && currentDayData.sallesDisposition && currentDayData.sallesDisposition.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-10">
              {currentDayData.sallesDisposition.map((s, idx) => renderRoomCard({...s, entreprise: selectedEvent.entreprise}, idx))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white border-4 border-dashed border-slate-200 rounded-[3rem]">
              <Shapes size={64} className="text-slate-200 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Aucune disposition de salle pour ce jour</h3>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vue globale "Par Jour" pour la gouvernante
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
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Vue Quotidienne Salles</h2>
              <p className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                <Layers size={14} /> Toutes les Salles du Jour
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
                onClick={() => handleDownloadPDF('daily-housekeeping-print', `Housekeeping_Jour_${selectedDate}`)} 
                disabled={isGeneratingPDF}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                Imprimer Tout le Jour
              </button>
          </div>
        </header>

        <div id="daily-housekeeping-print" className="space-y-10 print:space-y-12">
          <div className="hidden print:block text-center border-b-8 border-slate-900 pb-8 mb-12">
             <h1 className="text-5xl font-black uppercase italic tracking-tighter">Planning Quotidien Salles</h1>
             <p className="text-2xl font-black uppercase tracking-widest mt-4 text-indigo-600">{selectedDate.toUpperCase()}</p>
          </div>

          {dailyAggregatedRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-12">
              {dailyAggregatedRooms.map((s, idx) => renderRoomCard(s, idx))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white border-4 border-dashed border-slate-200 rounded-[3rem]">
              <Shapes size={64} className="text-slate-200 mx-auto mb-6" />
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Aucune salle pour ce jour</h3>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Housekeeping</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Mise en place des salles et logistique des espaces</p>
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
          <Shapes size={64} className="text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Aucun groupe actif</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map(event => (
            <div 
              key={event.id}
              className="group bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl hover:border-indigo-600 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => setSelectedEventId(event.id)}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:bg-indigo-600"></div>
              
              <div className="relative z-10">
                <div className="mb-4">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full group-hover:bg-white transition-colors">
                    Dossier #{event.id.substring(0, 8)}
                  </span>
                </div>

                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-6 group-hover:text-indigo-700 transition-colors">
                  {event.entreprise}
                </h4>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-tight">
                    <Calendar size={16} className="text-indigo-500" />
                    <span>{event.days.length} Journée{event.days.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-tight">
                    <LayoutGrid size={16} className="text-indigo-500" />
                    <span>{event.days.reduce((acc, d) => acc + (d.sallesDisposition?.length || 0), 0)} Salles config.</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Shapes size={16} className="text-indigo-600" /> Voir Mise en Place
                  </span>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HousekeepingView;
