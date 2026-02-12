
import React from 'react';
import { SavedEvent } from '../types';
import { Calendar, Users, ChevronRight, Trash2, Clock, FileText, LayoutGrid } from 'lucide-react';

interface DashboardProps {
  events: SavedEvent[];
  onSelectEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onShowSummary: (title: string, events: SavedEvent[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ events, onSelectEvent, onDeleteEvent, onShowSummary }) => {
  const parseDateForSorting = (dateStr: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
    }
    return 0;
  };

  const getWeekRange = (week: number, year: number) => {
    if (isNaN(week) || isNaN(year)) return "Semaine inconnue";
    const d = new Date(year, 0, 4);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1 + (week - 1) * 7);
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const format = (date: Date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `S${week} (${format(start)} - ${format(end)}) ${year}`;
  };

  const sortedEvents = [...events].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (b.weekNumber !== a.weekNumber) return b.weekNumber - a.weekNumber;
    return parseDateForSorting(a.days[0]?.date) - parseDateForSorting(b.days[0]?.date);
  });

  const groupedByWeek: { [key: string]: SavedEvent[] } = {};
  const weekOrder: string[] = [];

  sortedEvents.forEach(event => {
    const key = getWeekRange(event.weekNumber, event.year);
    if (!groupedByWeek[key]) {
      groupedByWeek[key] = [];
      weekOrder.push(key);
    }
    groupedByWeek[key].push(event);
  });

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Tableau de Bord</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Gestion des groupes par semaine</p>
        </div>
      </header>

      {weekOrder.length === 0 ? (
        <div className="text-center py-32 bg-white border-4 border-dashed border-slate-200 rounded-[3rem]">
          <LayoutGrid size={64} className="text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Aucun groupe enregistré</h3>
        </div>
      ) : (
        <div className="space-y-16">
          {weekOrder.map(weekKey => (
            <section key={weekKey} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6 border-b-4 border-slate-900 pb-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">{weekKey}</h3>
                <div className="bg-slate-900 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {groupedByWeek[weekKey].length} Groupe{groupedByWeek[weekKey].length > 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedByWeek[weekKey].map(event => (
                  <div 
                    key={event.id}
                    className="group bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => onSelectEvent(event.id)}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:bg-emerald-500"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full group-hover:bg-white transition-colors">
                          {event.secteur || 'Secteur libre'}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4 group-hover:text-emerald-600 transition-colors">
                        {event.entreprise}
                      </h4>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tight">
                          <Calendar size={14} className="text-emerald-500" />
                          <span>{event.days[0]?.date} — {event.days[event.days.length - 1]?.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tight">
                          <Users size={14} className="text-indigo-500" />
                          <span>{event.days[0]?.prestations[0]?.pax || '0'} PAX</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Dossier #{event.id.substring(0, 8)}
                        </span>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
