
import React from 'react';
import { SavedEvent } from '../types';
import { Calendar, Users, ChevronRight, MapPin, Printer } from 'lucide-react';

interface PlanningViewProps {
  events: SavedEvent[];
  onSelectEvent: (id: string) => void;
}

const PlanningView: React.FC<PlanningViewProps> = ({ events, onSelectEvent }) => {
  /**
   * Parse une date au format français "Lundi 18 Mars 2024" vers un timestamp pour le tri.
   */
  const parseDateForSorting = (dateStr: string) => {
    if (!dateStr) return 0;
    const months = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
    const clean = dateStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const parts = clean.split(/\s+/);
    
    let d = 1, m = 0, y = new Date().getFullYear();
    parts.forEach(p => {
      const num = parseInt(p);
      if (!isNaN(num)) {
        if (num > 1000) y = num;
        else if (num > 0) d = num;
      }
      const mIdx = months.findIndex(month => p.includes(month) || month.includes(p));
      if (mIdx !== -1 && p.length > 2) m = mIdx;
    });
    return new Date(y, m, d).getTime();
  };

  /**
   * Calcule la plage de dates pour une semaine ISO donnée.
   */
  const getWeekRange = (week: number, year: number) => {
    if (isNaN(week) || isNaN(year)) return "Dates inconnues";
    const d = new Date(year, 0, 4);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1 + (week - 1) * 7);
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const format = (date: Date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    return `du ${format(start)} au ${format(end)} ${year}`;
  };

  // 1. Aplatir tous les jours de tous les événements pour une vue jour par jour
  const allDays: { event: SavedEvent; dayDate: string; timestamp: number }[] = [];
  events.forEach(event => {
    event.days.forEach(day => {
      allDays.push({
        event,
        dayDate: day.date,
        timestamp: parseDateForSorting(day.date)
      });
    });
  });

  // 2. Trier chronologiquement
  allDays.sort((a, b) => a.timestamp - b.timestamp);

  // 3. Grouper par semaine
  const groupedByWeek: { [key: string]: typeof allDays } = {};
  const weekKeys: string[] = [];

  allDays.forEach(item => {
    const d = new Date(item.timestamp);
    // On calcule la semaine pour ce jour spécifique
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const year = d.getUTCFullYear();
    
    const weekKey = getWeekRange(weekNo, year);
    if (!groupedByWeek[weekKey]) {
      groupedByWeek[weekKey] = [];
      weekKeys.push(weekKey);
    }
    groupedByWeek[weekKey].push(item);
  });

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Planning Quotidien</h2>
          <p className="text-slate-500 font-medium">Vue détaillée jour par jour de toutes les prestations.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-lg"
        >
          <Printer size={20} /> Imprimer le planning
        </button>
      </header>

      {weekKeys.length === 0 ? (
        <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-3xl no-print">
          <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800">Aucun planning à afficher</h3>
          <p className="text-slate-500 mt-2">Importez des fiches pour voir le calendrier se remplir.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {weekKeys.map(weekKey => (
            <section key={weekKey} className="space-y-8 print:break-after-page print:m-0 print:p-8">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em] whitespace-nowrap">Semaine {weekKey}</h3>
                <div className="h-px bg-slate-200 flex-1 print:bg-slate-300"></div>
              </div>

              <div className="space-y-4">
                {/* Regrouper les items de la semaine par date unique */}
                {Array.from(new Set(groupedByWeek[weekKey].map(i => i.timestamp))).map(ts => {
                    const dailyEvents = groupedByWeek[weekKey].filter(i => i.timestamp === ts);
                    const d = new Date(ts);
                    
                    const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'long' });
                    const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

                    return (
                        <div key={ts} className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 items-start border-b border-slate-100 pb-4 last:border-0 print:border-slate-200">
                            <div className="md:col-span-1 pt-2">
                                <span className="text-lg font-bold text-slate-900 block capitalize">{dayLabel}</span>
                                <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">{dateLabel}</span>
                            </div>
                            <div className="md:col-span-3 space-y-3">
                                {dailyEvents.map((item, idx) => {
                                    const dayInfo = item.event.days.find(d => d.date === item.dayDate);
                                    const rooms = dayInfo?.sallesDisposition || [];
                                    const roomNames = rooms.map(s => s.salle).join(', ');

                                    return (
                                        <div 
                                            key={`${item.event.id}-${idx}`}
                                            onClick={() => onSelectEvent(item.event.id)}
                                            className="group bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer print:shadow-none print:border-slate-300"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-1.5 h-10 bg-emerald-500 rounded-full print:bg-emerald-600"></div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{item.event.entreprise}</h4>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500 font-medium print:text-slate-600">
                                                        <span className="flex items-center gap-1">
                                                            <Users size={12}/> {dayInfo?.prestations[0]?.pax || '0'} PAX
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={12}/> {roomNames || 'Lieux divers'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all no-print" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlanningView;
