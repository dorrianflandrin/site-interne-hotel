
import React, { useState, useMemo } from 'react';
import { SavedEvent, DayData } from '../types';
import { 
  UtensilsCrossed, 
  ChevronRight, 
  Users, 
  Calendar, 
  Clock, 
  Search,
  ArrowLeft,
  ChefHat,
  AlertCircle,
  Clock3,
  Flame,
  Filter,
  Layers,
  Printer,
  Loader2
} from 'lucide-react';

declare var html2pdf: any;

interface CuisineViewProps {
  events: SavedEvent[];
}

const CuisineView: React.FC<CuisineViewProps> = ({ events }) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'by-group' | 'by-day'>('by-group');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Liste de toutes les dates uniques présentes dans tous les événements pour la vue "Par Jour"
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

  // Initialisation de la date si vide
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

  const sortedEvents = useMemo(() => {
    const parseDateForSorting = (dateStr: string) => {
      if (!dateStr) return 0;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
      }
      return 0;
    };

    return [...events].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (b.weekNumber !== a.weekNumber) return b.weekNumber - a.weekNumber;
      return parseDateForSorting(a.days[0]?.date) - parseDateForSorting(b.days[0]?.date);
    });
  }, [events]);

  // Agrégation des menus pour la vue par jour
  const dailyMenus = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => e.days.some(d => d.date === selectedDate))
                 .map(e => ({
                   entreprise: e.entreprise,
                   dayData: e.days.find(d => d.date === selectedDate)!
                 }));
  }, [selectedDate, events]);

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

  // Composant de rendu d'un menu spécifique (utilisé pour les deux vues)
  const renderMenuCard = (title: string, colorClass: string, markerColor: string, menu: any, prestations: any[], icon: any, type: 'DEJEUNER' | 'DINER') => (
    <div className="bg-white border-4 border-slate-900 rounded-[3rem] overflow-hidden shadow-2xl h-full flex flex-col">
      <div className={`${colorClass} text-white p-6 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-3xl font-black uppercase tracking-tighter italic">{title}</h3>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase opacity-60">Effectif Cuisine</span>
          <div className="flex items-center gap-2">
            <Users size={20} />
            <span className="text-4xl font-black">{prestations.find(p => p.type.toUpperCase().includes(type))?.pax || '0'}</span>
          </div>
        </div>
      </div>
      
      <div className="p-10 space-y-8 flex-1">
        <div className="border-b-2 border-slate-100 pb-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Menu Sélectionné</span>
          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">{menu?.menuName || (type === 'DEJEUNER' ? 'Menu du jour' : 'Menu Gourmet')}</h4>
        </div>

        <div className="space-y-6">
          <div className={`bg-slate-50 p-6 rounded-3xl border-l-8 ${markerColor}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${title === 'Déjeuner' ? 'text-emerald-600' : 'text-rose-600'}`}>Entrée</span>
            <p className="text-xl font-bold text-slate-800 leading-snug">{menu?.entree || '—'}</p>
          </div>
          <div className={`bg-slate-50 p-6 rounded-3xl border-l-8 ${markerColor}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${title === 'Déjeuner' ? 'text-emerald-600' : 'text-rose-600'}`}>Plat Principal</span>
            <p className="text-xl font-black text-slate-900 leading-snug">{menu?.plat || '—'}</p>
          </div>
          <div className={`bg-slate-50 p-6 rounded-3xl border-l-8 ${markerColor}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${title === 'Déjeuner' ? 'text-emerald-600' : 'text-rose-600'}`}>Dessert</span>
            <p className="text-xl font-bold text-slate-800 leading-snug">{menu?.dessert || '—'}</p>
          </div>
        </div>

        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6">
           <h5 className="font-black text-amber-800 uppercase text-xs flex items-center gap-2 mb-4">
             <AlertCircle size={18} /> Régimes & Allergies ({title})
           </h5>
           <div className="grid grid-cols-1 gap-2">
              {(menu?.allergies || []).length > 0 ? (
                menu.allergies.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                    <span className="bg-amber-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black">{a.nb}</span>
                    <div className="flex-1">
                        <p className="font-black uppercase text-sm leading-none">{a.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{a.restriction}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs font-bold text-amber-600 italic">Aucun régime signalé pour ce repas.</p>
              )}
           </div>
        </div>
      </div>
      <div className="bg-slate-900 text-white p-4 flex justify-center gap-8">
         <div className="flex items-center gap-2">
            <Clock3 size={16} className={title === 'Déjeuner' ? 'text-emerald-400' : 'text-rose-400'} />
            <span className="text-[10px] font-black uppercase tracking-widest">Service : {prestations.find(p => p.type.toUpperCase().includes(type))?.horaires || '--:--'}</span>
         </div>
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
              <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                <ChefHat size={14} /> Dossier Cuisine Groupe
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
                onClick={() => handleDownloadPDF('cuisine-print-area', `Cuisine_${selectedEvent.entreprise}_${selectedDate}`)} 
                disabled={isGeneratingPDF}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                Imprimer Menus
              </button>
          </div>
        </header>

        <div id="cuisine-print-area">
          <div className="hidden print:block text-center mb-8 pb-8 border-b-4 border-slate-900">
             <h1 className="text-4xl font-black uppercase italic tracking-tighter">{selectedEvent.entreprise}</h1>
             <p className="text-xl font-bold uppercase tracking-widest mt-2">{selectedDate}</p>
          </div>
          {currentDayData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:gap-12">
              {renderMenuCard('Déjeuner', 'bg-emerald-600', 'border-emerald-500', currentDayData.dejeunerMenu, currentDayData.prestations, <Flame size={32} />, 'DEJEUNER')}
              {renderMenuCard('Dîner', 'bg-rose-600', 'border-rose-500', currentDayData.dinerMenu, currentDayData.prestations, <Flame size={32} />, 'DINER')}
            </div>
          ) : (
            <div className="text-center py-32 bg-white border-4 border-dashed border-slate-200 rounded-[3rem]">
              <UtensilsCrossed size={64} className="text-slate-200 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Pas de données pour cette date</h3>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vue globale "Par Jour" pour le chef
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
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Vue Quotidienne Cuisine</h2>
              <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                <ChefHat size={14} /> Tous les Menus du Jour
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
                onClick={() => handleDownloadPDF('daily-cuisine-print', `Cuisine_Jour_${selectedDate}`)} 
                disabled={isGeneratingPDF}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                Imprimer Tout le Jour
              </button>
          </div>
        </header>

        <div id="daily-cuisine-print" className="space-y-16 print:space-y-24">
          <div className="hidden print:block text-center mb-12 pb-8 border-b-8 border-slate-900">
             <h1 className="text-5xl font-black uppercase italic tracking-tighter">Menus du Jour</h1>
             <p className="text-2xl font-black uppercase tracking-widest mt-4 text-emerald-600">{selectedDate.toUpperCase()}</p>
          </div>

          {dailyMenus.length > 0 ? (
            dailyMenus.map((item, idx) => (
              <div key={idx} className="space-y-8 print:break-after-page">
                <div className="flex items-center gap-4 border-b-4 border-slate-200 pb-4">
                  <div className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl italic">{idx + 1}</div>
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">{item.entreprise}</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {renderMenuCard('Déjeuner', 'bg-emerald-600', 'border-emerald-500', item.dayData.dejeunerMenu, item.dayData.prestations, <Flame size={32} />, 'DEJEUNER')}
                  {renderMenuCard('Dîner', 'bg-rose-600', 'border-rose-500', item.dayData.dinerMenu, item.dayData.prestations, <Flame size={32} />, 'DINER')}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-32 bg-white border-4 border-dashed border-slate-200 rounded-[3rem]">
              <ChefHat size={64} className="text-slate-200 mx-auto mb-6" />
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Aucun menu pour ce jour</h3>
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
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Cuisine</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Dossiers menus et effectifs</p>
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
          <ChefHat size={64} className="text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Aucun groupe actif</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map(event => (
            <div 
              key={event.id}
              className="group bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl hover:border-emerald-600 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => setSelectedEventId(event.id)}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:bg-emerald-600"></div>
              
              <div className="relative z-10">
                <div className="mb-4">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full group-hover:bg-white transition-colors">
                    Dossier #{event.id.substring(0, 8)}
                  </span>
                </div>

                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-6 group-hover:text-emerald-700 transition-colors">
                  {event.entreprise}
                </h4>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-tight">
                    <Calendar size={16} className="text-emerald-500" />
                    <span>{event.days.length} Journée{event.days.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-tight">
                    <Users size={16} className="text-indigo-500" />
                    <span>Max {Math.max(...event.days.map(d => parseInt(d.prestations[0]?.pax || '0')))} PAX</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <UtensilsCrossed size={16} className="text-emerald-600" /> Voir Menus
                  </span>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CuisineView;
