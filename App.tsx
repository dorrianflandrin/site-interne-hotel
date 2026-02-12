
import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { extractFichePrestaDataFromImage, extractFichePrestaDataFromText } from './geminiService';
import { ExtractedEventData, AppStatus, SavedEvent, ViewMode } from './types';
import FileUpload from './components/FileUpload';
import ExtractionResult from './components/ExtractionResult';
import SchedulePreview from './components/SchedulePreview';
import Dashboard from './components/Dashboard';
import PlanningView from './components/PlanningView';
import WeeklySummary from './components/WeeklySummary';
import DailyOrgView from './components/DailyOrgView';
import NewPrestationForm from './components/NewPrestationForm';
import CuisineView from './components/CuisineView';
import RestaurantView from './components/RestaurantView';
import HousekeepingView from './components/HousekeepingView';
import Login from './components/Login';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Loader2, 
  Settings,
  TreeDeciduous,
  CalendarDays,
  Clock,
  LogOut,
  FileEdit,
  UtensilsCrossed,
  Coffee,
  Shapes
} from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [status, setStatus] = useState<AppStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedEventData | null>(null);
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{ title: string, events: SavedEvent[] } | null>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('optipresta_auth');
    if (authStatus === 'true') setIsAuthenticated(true);
    const data = localStorage.getItem('optipresta_events');
    if (data) setSavedEvents(JSON.parse(data));
  }, []);

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
      sessionStorage.setItem('optipresta_auth', 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('optipresta_auth');
  };

  const parseFrenchDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const months: Record<string, number> = { "janvier": 0, "fevrier": 1, "mars": 2, "avril": 3, "mai": 4, "juin": 5, "juillet": 6, "aout": 7, "septembre": 8, "octobre": 9, "novembre": 10, "decembre": 11 };
    const clean = dateStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const parts = clean.split(/\s+/);
    let day = 1, month = 0, year = new Date().getFullYear();
    parts.forEach(p => {
      const num = parseInt(p);
      if (!isNaN(num)) {
        if (num > 1000) year = num;
        else if (num > 0 && num <= 31) day = num;
      }
      for (const [mName, mIdx] of Object.entries(months)) { if (p.includes(mName)) { month = mIdx; break; } }
    });
    return new Date(year, month, day);
  };

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const saveEventToDB = (data: ExtractedEventData) => {
    const firstDateStr = data.days[0]?.date || "";
    const parsedDate = parseFrenchDate(firstDateStr);
    const weekNum = getWeekNumber(parsedDate);
    const year = parsedDate.getFullYear();

    if (selectedEventId) {
      const updatedEvents = savedEvents.map(e => {
        if (e.id === selectedEventId) {
          return {
            ...data,
            id: e.id,
            createdAt: e.createdAt,
            weekNumber: isNaN(weekNum) ? 1 : weekNum,
            year: isNaN(year) ? new Date().getFullYear() : year
          };
        }
        return e;
      });
      setSavedEvents(updatedEvents);
      localStorage.setItem('optipresta_events', JSON.stringify(updatedEvents));
      setView('detail');
      return;
    }

    const newEvent: SavedEvent = { 
        ...data, 
        id: crypto.randomUUID(), 
        createdAt: new Date().toISOString(), 
        weekNumber: isNaN(weekNum) ? 1 : weekNum, 
        year: isNaN(year) ? new Date().getFullYear() : year 
    };
    const updated = [newEvent, ...savedEvents];
    setSavedEvents(updated);
    localStorage.setItem('optipresta_events', JSON.stringify(updated));
    setExtractedData(null);
    setView('dashboard');
  };

  const updateSavedEvent = (updatedEvent: SavedEvent) => {
    const updated = savedEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    setSavedEvents(updated);
    localStorage.setItem('optipresta_events', JSON.stringify(updated));
  };

  const deleteEvent = (id: string) => {
    const updated = savedEvents.filter(e => e.id !== id);
    setSavedEvents(updated);
    localStorage.setItem('optipresta_events', JSON.stringify(updated));
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setStatus('uploading');
    setError(null);
    const isExcel = file.name.match(/\.(xlsx|xls|csv)$/i);
    const isImage = file.type.startsWith('image/');
    
    try {
      if (isExcel) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            let combinedCsv = "";
            workbook.SheetNames.forEach(name => { combinedCsv += `FEUILLE: ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}\n\n`; });
            setStatus('extracting');
            const extracted = await extractFichePrestaDataFromText(combinedCsv);
            setExtractedData(extracted);
            setStatus('completed');
          } catch (err: any) { setError(err.message); setStatus('error'); }
        };
        reader.readAsArrayBuffer(file);
      } else if (isImage) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            setStatus('extracting');
            const data = await extractFichePrestaDataFromImage(e.target?.result as string);
            setExtractedData(data);
            setStatus('completed');
          } catch (err: any) { setError(err.message); setStatus('error'); }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) { setError(err.message); setStatus('error'); }
  }, []);

  const handleShowSummary = (title: string, events: SavedEvent[]) => {
    setSummaryData({ title, events });
    setView('weekly-summary');
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  const selectedEvent = savedEvents.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-4 flex flex-col gap-2 shrink-0 no-print">
        <div className="flex items-center gap-3 px-2 py-6 border-b border-slate-800 mb-4">
          <div className="bg-emerald-600 p-2 rounded-xl text-white"><TreeDeciduous size={24} /></div>
          <div><h1 className="text-sm font-bold text-white tracking-tight leading-none">Domaine Lyon<br/>Saint-Joseph</h1><p className="text-[9px] text-slate-500 uppercase font-black mt-1 tracking-wider">Gestion Presta</p></div>
        </div>
        <button onClick={() => { setView('dashboard'); setSelectedEventId(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-emerald-600 text-white font-bold shadow-lg' : 'hover:bg-slate-800'}`}><LayoutDashboard size={20} /> Tableau de Bord</button>
        <button onClick={() => { setView('create'); setSelectedEventId(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'create' ? 'bg-indigo-600 text-white font-bold shadow-lg' : 'hover:bg-slate-800'}`}><FileEdit size={20} /> Rédiger une fiche</button>
        <button onClick={() => { setView('import'); setSelectedEventId(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'import' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800'}`}><PlusCircle size={20} /> Importer Excel/Photo</button>
        <button onClick={() => { setView('planning'); setSelectedEventId(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'planning' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800'}`}><CalendarDays size={20} /> Planning</button>
        <button onClick={() => { setView('daily-org'); setSelectedEventId(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'daily-org' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800'}`}><Clock size={20} /> Journal du Jour</button>
        <button onClick={() => { setView('cuisine'); setSelectedEventId(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'cuisine' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800'}`}><UtensilsCrossed size={20} /> Cuisine</button>
        <button onClick={() => { setView('restaurant'); setSelectedEventId(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'restaurant' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800'}`}><Coffee size={20} /> Restaurant</button>
        <button onClick={() => { setView('housekeeping'); setSelectedEventId(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'housekeeping' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800'}`}><Shapes size={20} /> Housekeeping</button>
        
        <div className="mt-auto pt-6 border-t border-slate-800 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-3 w-full hover:bg-slate-800 rounded-xl text-sm transition-all"><Settings size={18} /> Configuration</button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full hover:bg-rose-900/20 hover:text-rose-400 rounded-xl text-sm transition-all text-slate-500 font-bold"><LogOut size={18} /> Déconnexion</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {view === 'dashboard' && <Dashboard events={savedEvents} onSelectEvent={(id) => { setSelectedEventId(id); setView('detail'); }} onDeleteEvent={deleteEvent} onShowSummary={handleShowSummary} />}
          {view === 'create' && <NewPrestationForm initialData={selectedEvent} onSave={saveEventToDB} onCancel={() => selectedEventId ? setView('detail') : setView('dashboard')} />}
          {view === 'planning' && <PlanningView events={savedEvents} onSelectEvent={(id) => { setSelectedEventId(id); setView('detail'); }} />}
          {view === 'daily-org' && <DailyOrgView events={savedEvents} onSelectEvent={(id) => { setSelectedEventId(id); setView('detail'); }} onUpdateEvent={updateSavedEvent} />}
          {view === 'cuisine' && <CuisineView events={savedEvents} />}
          {view === 'restaurant' && <RestaurantView events={savedEvents} />}
          {view === 'housekeeping' && <HousekeepingView events={savedEvents} />}
          {view === 'weekly-summary' && summaryData && <WeeklySummary title={summaryData.title} events={summaryData.events} onBack={() => setView('dashboard')} onSelectEvent={(id) => { setSelectedEventId(id); setView('detail'); }} onUpdateEvent={updateSavedEvent} />}
          {view === 'import' && (
            <div className="animate-in fade-in duration-500 no-print">
              {status === 'idle' && <div className="max-w-3xl mx-auto mt-12 text-center"><h2 className="text-3xl font-extrabold text-slate-900 mb-2">Import de fichier</h2><FileUpload onFileSelected={handleFileUpload} /></div>}
              {(status === 'uploading' || status === 'extracting') && <div className="flex flex-col items-center justify-center py-32"><Loader2 size={48} className="text-emerald-600 animate-spin" /><h3 className="text-xl font-bold mt-6 text-slate-900">{status === 'uploading' ? 'Lecture...' : 'Analyse Gemini...'}</h3></div>}
              {status === 'completed' && extractedData && (
                <div className="space-y-6">
                  <div className="bg-white border border-emerald-200 p-6 rounded-3xl shadow-xl shadow-emerald-100 flex items-center justify-between">
                    <div><h3 className="text-xl font-black text-slate-900">Vérification des données</h3><p className="text-slate-500">Relisez les informations extraites par l'IA avant de valider.</p></div>
                    <button onClick={() => saveEventToDB(extractedData)} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-emerald-700 transition-all shadow-lg">Valider & Enregistrer</button>
                  </div>
                  <ExtractionResult data={extractedData} onUpdateData={setExtractedData} />
                </div>
              )}
            </div>
          )}
          {view === 'detail' && selectedEvent && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-6 flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                  <button onClick={() => { setView('dashboard'); setSelectedEventId(null); }} className="text-sm font-bold text-emerald-600 hover:underline">← Retour</button>
                  <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter italic">{selectedEvent.entreprise}</h2>
                </div>
                <button 
                  onClick={() => setView('create')} 
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg"
                >
                  <FileEdit size={14} /> Modifier Fiche Complète
                </button>
              </div>
              <SchedulePreview data={selectedEvent} onSave={updateSavedEvent} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
