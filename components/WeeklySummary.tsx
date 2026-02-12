
import React, { useState, useEffect } from 'react';
import { SavedEvent, DayData, Prestation } from '../types';
import { Printer, ArrowLeft, Calendar, Users, MapPin, AlertTriangle, BedDouble, Table, Info, Edit3, Check, X, Trash2, Plus, Download, Loader2 } from 'lucide-react';

// Declaration for html2pdf which is loaded via script tag in index.html
declare var html2pdf: any;

interface WeeklySummaryProps {
  title: string;
  events: SavedEvent[];
  onBack: () => void;
  onSelectEvent: (id: string) => void;
  onUpdateEvent?: (updatedEvent: SavedEvent) => void;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ title, events, onBack, onUpdateEvent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editableEvents, setEditableEvents] = useState<SavedEvent[]>([]);

  useEffect(() => {
    setEditableEvents(JSON.parse(JSON.stringify(events)));
  }, [events]);

  const columns = [
    { label: "Arrivée", keys: ["arrivée", "responsable", "participants", "début"] },
    { label: "KF d'acceuil", keys: ["café", "accueil", "kf"] },
    { label: "Pause AM", keys: ["pause am"] },
    { label: "Apéritif", keys: ["apéritif", "apero"] },
    { label: "Déjeuner", keys: ["déjeuner", "dejeuner"] },
    { label: "Pause PM", keys: ["pause pm"] },
    { label: "Apéritif", keys: ["apéritif 2", "cocktail", "bar", "consommation"] },
    { label: "Diner", keys: ["dîner", "diner"] },
    { label: "Départ", keys: ["départ", "depart", "fin"] },
  ];

  const handleEditChange = (eventIdx: number, path: string, value: any) => {
    const newEvents = [...editableEvents];
    const keys = path.split('.');
    let current: any = newEvents[eventIdx];
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setEditableEvents(newEvents);
  };

  const handleSaveAll = () => {
    if (onUpdateEvent) {
      editableEvents.forEach(event => {
        onUpdateEvent(event);
      });
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    setEditableEvents(JSON.parse(JSON.stringify(events)));
    setIsEditing(false);
  };

  const handleDownloadPDF = async () => {
    if (isEditing) {
      alert("Veuillez enregistrer vos modifications avant de générer le PDF.");
      return;
    }

    const element = document.getElementById('weekly-dossier-root');
    if (!element) return;

    setIsGeneratingPDF(true);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Dossier_Semaine_${title.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Erreur lors de la génération du PDF:", err);
      alert("Une erreur est survenue lors de la création du PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getPrestationByType = (day: DayData, types: string[]): { p: Prestation | undefined, idx: number } => {
    const prestations = day.prestations || [];
    const idx = prestations.findIndex(p => types.some(t => p.type.toLowerCase().includes(t.toLowerCase())));
    return { p: prestations[idx], idx };
  };

  const parseDateForSorting = (dateStr: string) => {
    if (!dateStr) return 0;
    const months = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
    const clean = dateStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const parts = clean.split(/\s+/);
    let d = 1, m = 0, y = new Date().getFullYear();
    parts.forEach(p => {
      const num = parseInt(p);
      if (!isNaN(num)) {
        // Fix: Change 'year' to 'y' to match the declared variable 'y'
        if (num > 1000) y = num;
        else if (num > 0 && num <= 31) d = num;
      }
      const mIdx = months.findIndex(month => p.includes(month) || month.includes(p));
      if (mIdx !== -1 && p.length > 2) m = mIdx;
    });
    return new Date(y, m, d).getTime();
  };

  const currentEvents = isEditing ? editableEvents : events;
  
  const allDossierDays: { event: SavedEvent; eventIdx: number; day: DayData; dayIdx: number; timestamp: number }[] = [];
  (currentEvents || []).forEach((event, eIdx) => {
    (event.days || []).forEach((day, dIdx) => {
      allDossierDays.push({
        event,
        eventIdx: eIdx,
        day,
        dayIdx: dIdx,
        timestamp: parseDateForSorting(day.date)
      });
    });
  });

  allDossierDays.sort((a, b) => a.timestamp - b.timestamp);

  const housingSummaryByDate: { [date: string]: { rooms: number, persons: number, details: string[], timestamp: number } } = {};
  allDossierDays.forEach(({ day, timestamp }) => {
    const dateKey = day.date;
    if (!housingSummaryByDate[dateKey]) {
      housingSummaryByDate[dateKey] = { rooms: 0, persons: 0, details: [], timestamp };
    }
    if (day.hebergement && day.hebergement.length > 0) {
      day.hebergement.forEach(h => {
        const rooms = parseInt(h.nbChambres) || 0;
        const persons = parseInt(h.nbPersonnes) || 0;
        housingSummaryByDate[dateKey].rooms += rooms;
        housingSummaryByDate[dateKey].persons += persons;
        if (rooms > 0) {
          housingSummaryByDate[dateKey].details.push(`${rooms} ${h.typeChambre} (${persons}p)`);
        }
      });
    }
  });

  const sortedSummaryDates = Object.keys(housingSummaryByDate).sort((a, b) => 
    housingSummaryByDate[a].timestamp - housingSummaryByDate[b].timestamp
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-600">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dossier Hebdomadaire (Réception)</h2>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Semaine {title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
              >
                <Edit3 size={20} /> Modifier le dossier
              </button>
              <button 
                onClick={handleDownloadPDF} 
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Télécharger PDF
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button onClick={cancelEdit} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all"><X size={20}/> Annuler</button>
              <button onClick={handleSaveAll} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"><Check size={20}/> Enregistrer tout</button>
            </>
          )}
        </div>
      </header>

      <div id="weekly-dossier-root">
        <div className="hidden print:block text-center py-20 mb-10 border-4 border-double border-slate-900 rounded-[3rem]">
            <div className="flex justify-center mb-6 text-emerald-600">
              <Calendar size={64} />
            </div>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Planning Réception</h1>
            <p className="text-2xl font-bold text-slate-500 uppercase tracking-[0.3em]">Semaine {title}</p>
            <div className="mt-20 text-sm font-black text-slate-400 uppercase tracking-widest">
              Document Interne • Domaine Lyon Saint-Joseph
            </div>
        </div>

        <div className="space-y-16 print:space-y-0">
          {(allDossierDays || []).map(({ event, eventIdx, day, dayIdx, timestamp }, index) => {
            const dateLong = new Date(timestamp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            
            return (
              <div key={`${event.id}-${dayIdx}`} className="bg-white border border-slate-200 rounded-[2rem] shadow-xl p-6 md:p-10 print:shadow-none print:border-none print:p-0 print:break-after-page print:mb-0 mb-10 overflow-x-auto relative">
                
                <div className="min-w-[1000px]">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-slate-100">
                     <div className="flex-1">
                        {isEditing ? (
                          <input 
                            className="text-2xl font-black text-emerald-700 uppercase tracking-tighter w-full bg-emerald-50 outline-none p-1 rounded" 
                            value={event.entreprise || ''} 
                            onChange={(e) => handleEditChange(eventIdx, 'entreprise', e.target.value)} 
                          />
                        ) : (
                          <h3 className="text-2xl font-black text-emerald-700 uppercase tracking-tighter">{event.entreprise || ''}</h3>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fiche Prestation Dossier</p>
                     </div>
                     <div className="bg-slate-900 text-white px-10 py-4 rounded-2xl shadow-lg min-w-[280px] text-center">
                        {isEditing ? (
                          <input 
                            className="text-xl font-black uppercase tracking-widest bg-transparent outline-none w-full text-center" 
                            value={day.date || ''} 
                            onChange={(e) => handleEditChange(eventIdx, `days.${dayIdx}.date`, e.target.value)} 
                          />
                        ) : (
                          <h2 className="text-xl font-black uppercase tracking-widest capitalize">{dateLong}</h2>
                        )}
                     </div>
                     <div className="flex-1 text-right">
                        {/* Fix: Access nom property of ContactInfo object */}
                        <p className="text-[11px] font-black text-slate-900 uppercase">Contact: {event.contactClient?.nom || 'N/A'}</p>
                        {/* Fix: Access nom property of ContactInfo object */}
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Sur place: {event.responsableSurPlace?.nom || 'N/A'}</p>
                     </div>
                  </div>

                  <table className="w-full border-collapse border border-slate-400 text-[11px] mb-10">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 p-2 w-24"></th>
                        {columns.map((col, i) => (
                          <th key={i} className="border border-slate-400 p-2 font-black uppercase tracking-wider text-[9px] text-slate-600">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-400 p-3 font-black bg-slate-50 text-center uppercase text-[9px]">Nom</td>
                        {columns.map((col, i) => {
                          const { p, idx } = getPrestationByType(day, col.keys);
                          return (
                            <td key={i} className="border border-slate-400 p-3 text-center">
                              {isEditing && p ? (
                                <input 
                                  className="w-full text-center outline-none bg-emerald-50 rounded p-1" 
                                  value={p.nom || ''} 
                                  onChange={(e) => handleEditChange(eventIdx, `days.${dayIdx}.prestations.${idx}.nom`, e.target.value)} 
                                />
                              ) : (
                                <span className="font-bold text-slate-900">{p?.nom || (i === 0 ? event.entreprise : '')}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-3 font-black bg-slate-50 text-center uppercase text-[9px]">Pax</td>
                        {columns.map((col, i) => {
                          const { p, idx } = getPrestationByType(day, col.keys);
                          return (
                            <td key={i} className="border border-slate-400 p-3 text-center font-black text-emerald-600 text-base">
                              {isEditing && p ? (
                                <input 
                                  className="w-full text-center outline-none bg-emerald-50 rounded p-1" 
                                  value={p.pax || ''} 
                                  onChange={(e) => handleEditChange(eventIdx, `days.${dayIdx}.prestations.${idx}.pax`, e.target.value)} 
                                />
                              ) : p?.pax}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-3 font-black bg-slate-50 text-center uppercase text-[9px]">Horaires</td>
                        {columns.map((col, i) => {
                          const { p, idx } = getPrestationByType(day, col.keys);
                          return (
                            <td key={i} className="border border-slate-400 p-3 text-center font-mono font-bold text-slate-700">
                              {isEditing && p ? (
                                <input 
                                  className="w-full text-center outline-none bg-emerald-50 rounded p-1" 
                                  value={p.horaires || ''} 
                                  onChange={(e) => handleEditChange(eventIdx, `days.${dayIdx}.prestations.${idx}.horaires`, e.target.value)} 
                                />
                              ) : p?.horaires}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-3 font-black bg-slate-50 text-center uppercase text-[9px]">Lieux</td>
                        {columns.map((col, i) => {
                          const { p, idx } = getPrestationByType(day, col.keys);
                          return (
                            <td key={i} className="border border-slate-400 p-3 text-center text-slate-500 font-medium">
                              {isEditing && p ? (
                                <input 
                                  className="w-full text-center outline-none bg-emerald-50 rounded p-1" 
                                  value={p.lieu || ''} 
                                  onChange={(e) => handleEditChange(eventIdx, `days.${dayIdx}.prestations.${idx}.lieu`, e.target.value)} 
                                />
                              ) : p?.lieu}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6">
                    <div className="md:col-span-2 border-2 border-emerald-500 p-6 rounded-[1.5rem] bg-emerald-50/20">
                      <div className="flex items-center justify-between mb-4 border-b border-emerald-500 pb-2">
                        <div className="flex items-center gap-2">
                          <BedDouble size={20} className="text-emerald-600" />
                          <h5 className="font-black text-[12px] text-emerald-800 uppercase tracking-widest">Hébergement Prioritaire</h5>
                        </div>
                        {isEditing && (
                          <button 
                            onClick={() => {
                              const newEvents = [...editableEvents];
                              if (!newEvents[eventIdx].days[dayIdx].hebergement) newEvents[eventIdx].days[dayIdx].hebergement = [];
                              newEvents[eventIdx].days[dayIdx].hebergement!.push({ nbChambres: '0', nbPersonnes: '0', typeChambre: 'Single', notes: '' });
                              setEditableEvents(newEvents);
                            }}
                            className="bg-emerald-600 text-white p-1 rounded-full hover:bg-emerald-700 shadow-sm"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                         {(day.hebergement || []).map((h, hIdx) => (
                           <div key={hIdx} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm relative group">
                             {isEditing ? (
                               <div className="space-y-3">
                                 <div className="flex gap-2">
                                   <div className="flex-1">
                                     <label className="text-[9px] font-black text-slate-400 uppercase">Chambres / Type</label>
                                     <div className="flex gap-1">
                                       <input className="w-12 font-black outline-none border-b border-emerald-100" value={h.nbChambres || ''} onChange={(e) => handleEditChange(eventIdx, `days.${dayIdx}.hebergement.${hIdx}.nbChambres`, e.target.value)} />
                                       <input className="flex-1 font-black outline-none border-b border-emerald-100 uppercase" value={h.typeChambre || ''} onChange={(e) => handleEditChange(eventIdx, `days.${dayIdx}.hebergement.${hIdx}.typeChambre`, e.target.value)} />
                                     </div>
                                   </div>
                                   <div className="w-16">
                                     <label className="text-[9px] font-black text-slate-400 uppercase">Pax</label>
                                     <input className="w-full font-black outline-none border-b border-emerald-100 text-center" value={h.nbPersonnes || ''} onChange={(e) => handleEditChange(eventIdx, `days.${dayIdx}.hebergement.${hIdx}.nbPersonnes`, e.target.value)} />
                                   </div>
                                 </div>
                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase">Notes Réception</label>
                                    <textarea className="w-full text-xs text-slate-600 outline-none bg-slate-50 p-2 rounded" value={h.notes || ''} onChange={(e) => handleEditChange(eventIdx, `days.${dayIdx}.hebergement.${hIdx}.notes`, e.target.value)} />
                                 </div>
                                 <button 
                                   onClick={() => {
                                     const newEvents = [...editableEvents];
                                     newEvents[eventIdx].days[dayIdx].hebergement!.splice(hIdx, 1);
                                     setEditableEvents(newEvents);
                                   }}
                                   className="absolute -right-2 -top-2 bg-white text-red-500 p-1 rounded-full shadow border border-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                   <Trash2 size={12}/>
                                 </button>
                               </div>
                             ) : (
                               <>
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-black text-slate-900 uppercase text-[13px]">{h.nbChambres} {h.typeChambre}</p>
                                    <span className="bg-emerald-600 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase">{h.nbPersonnes} Pers.</span>
                                </div>
                                {h.notes && (
                                  <div className="mt-3 text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded border-l-4 border-emerald-500 flex items-start gap-2">
                                    <Info size={14} className="shrink-0 mt-0.5 text-emerald-500" />
                                    <span>{h.notes}</span>
                                  </div>
                                )}
                               </>
                             )}
                           </div>
                         ))}
                         {(!day.hebergement || day.hebergement.length === 0) && <p className="text-[11px] text-slate-300 italic py-4 text-center">Pas d'hébergement pour ce jour</p>}
                      </div>
                    </div>

                    <div className="md:col-span-1 border-2 border-slate-200 p-5 rounded-[1.5rem] bg-white">
                        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                          <MapPin size={16} className="text-slate-600" />
                          <h5 className="font-black text-[10px] text-slate-500 uppercase tracking-widest">Dispositions Salles</h5>
                        </div>
                        <div className="space-y-3">
                          {(day.sallesDisposition || []).map((s, sIdx) => (
                            <div key={sIdx} className="text-[11px] text-slate-700 font-medium pb-2 border-b border-slate-50 last:border-0">
                              {isEditing ? (
                                <div className="space-y-1">
                                  <input className="font-black text-slate-900 uppercase outline-none w-full bg-slate-50" value={s.salle || ''} onChange={(e) => handleEditChange(eventIdx, `days.${dayIdx}.sallesDisposition.${sIdx}.salle`, e.target.value)} />
                                  <input className="text-slate-500 outline-none w-full text-[10px]" value={s.format || ''} onChange={(e) => handleEditChange(eventIdx, `days.${dayIdx}.sallesDisposition.${sIdx}.format`, e.target.value)} />
                                </div>
                              ) : (
                                <>
                                  <p><span className="font-black text-slate-900 uppercase">{s.salle}</span></p>
                                  <p className="text-slate-500 mt-0.5">{s.format} • <span className="font-black text-emerald-600">{s.pax} PAX</span></p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                    </div>

                    <div className="md:col-span-1 border-2 border-amber-100 p-5 rounded-[1.5rem] bg-amber-50/30">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle size={16} className="text-amber-600" />
                          <h5 className="font-black text-[10px] text-amber-700 uppercase tracking-widest">Régimes Particuliers</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(event.allergies || []).map((a, aIdx) => (
                            <div key={aIdx} className="bg-white px-2 py-1 border border-amber-200 rounded-lg text-[10px] font-black text-amber-800 uppercase shadow-sm">
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    <input className="w-6 outline-none bg-amber-50" value={a.nb || ''} onChange={(e) => handleEditChange(eventIdx, `allergies.${aIdx}.nb`, e.target.value)} />
                                    <input className="outline-none bg-amber-50 min-w-[60px]" value={a.name || ''} onChange={(e) => handleEditChange(eventIdx, `allergies.${aIdx}.name`, e.target.value)} />
                                  </div>
                                ) : `${a.name || ''}: x${a.nb || ''}`}
                            </div>
                          ))}
                          {isEditing && (
                            <button 
                              onClick={() => {
                                const newEvents = [...editableEvents];
                                if (!newEvents[eventIdx].allergies) newEvents[eventIdx].allergies = [];
                                newEvents[eventIdx].allergies.push({ nb: '1', name: '', restriction: '' });
                                setEditableEvents(newEvents);
                              }}
                              className="bg-amber-600 text-white p-1 rounded-lg text-[8px] font-black"
                            >
                              + AJOUTER
                            </button>
                          )}
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-10 mt-20 print:shadow-none print:border-slate-900 print:break-before-page overflow-x-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-slate-900 text-white p-3 rounded-2xl">
                <Table size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Récapitulatif Hébergement</h2>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs italic">CUMUL HEBDOMADAIRE (VUE RÉCEPTION)</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-4 font-black uppercase tracking-widest text-[11px] border border-slate-900 w-1/4">Date</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[11px] border border-slate-900 text-center">Total Chambres</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[11px] border border-slate-900 text-center">Total Personnes</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[11px] border border-slate-900">Détails de la nuitée</th>
                </tr>
              </thead>
              <tbody>
                {sortedSummaryDates.map(dateKey => {
                  const summaryData = housingSummaryByDate[dateKey];
                  const d = new Date(summaryData.timestamp);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const formattedDate = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                  return (
                    <tr key={dateKey} className={`${isWeekend ? 'bg-slate-50' : 'bg-white'} hover:bg-emerald-50/30 transition-colors`}>
                      <td className="p-4 border border-slate-300"><span className="font-black text-slate-900 uppercase text-xs">{formattedDate}</span></td>
                      <td className="p-4 border border-slate-300 text-center"><span className={`inline-block px-4 py-1 rounded-full font-black text-lg ${summaryData.rooms > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>{summaryData.rooms}</span></td>
                      <td className="p-4 border border-slate-300 text-center"><span className={`inline-block px-4 py-1 rounded-full font-black text-lg ${summaryData.persons > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-400'}`}>{summaryData.persons}</span></td>
                      <td className="p-4 border border-slate-300">
                        {summaryData.details.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {summaryData.details.map((d, i) => <span key={i} className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm text-slate-600">{d}</span>)}
                          </div>
                        ) : <span className="text-[10px] text-slate-300 italic">Aucune réservation pour cette nuit</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-black">
                  <td className="p-4 border border-slate-900 uppercase text-xs">TOTAUX SEMAINE</td>
                  <td className="p-4 border border-slate-900 text-center text-xl">{Object.values(housingSummaryByDate).reduce((acc, curr) => acc + curr.rooms, 0)}</td>
                  <td className="p-4 border border-slate-900 text-center text-xl">{Object.values(housingSummaryByDate).reduce((acc, curr) => acc + curr.persons, 0)}</td>
                  <td className="p-4 border border-slate-900"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySummary;
