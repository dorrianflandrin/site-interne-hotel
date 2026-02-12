
import React, { useState, useEffect } from 'react';
import { SavedEvent, Prestation, DayData, Allergy } from '../types';
import { Printer, Calendar, Edit3, Check, TreeDeciduous, Info, Loader2, Download } from 'lucide-react';

// Déclaration pour html2pdf chargé via script dans index.html
declare var html2pdf: any;

interface Props {
  data: SavedEvent;
  onSave?: (updatedEvent: SavedEvent) => void;
}

const SchedulePreview: React.FC<Props> = ({ data, onSave }) => {
  const [dayIdx, setDayIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editData, setEditData] = useState<SavedEvent>(JSON.parse(JSON.stringify(data)));

  useEffect(() => {
    setEditData(JSON.parse(JSON.stringify(data)));
  }, [data]);

  const currentDay = editData.days[dayIdx] || editData.days[0];
  const todayDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const todayTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const currentDayFormatted = currentDay.date;

  const handleDownloadPDF = async () => {
    const element = document.getElementById('print-sheet');
    if (!element) return;

    setIsGeneratingPDF(true);

    const opt = {
      margin: [5, 5, 5, 5], // Marges minimales pour maximiser l'espace
      filename: `Fiche_${editData.entreprise.replace(/\s+/g, '_')}_${currentDay.date.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // On utilise html2pdf pour capturer l'élément et forcer le format A4
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Erreur PDF:", err);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getAdaptiveTextClass = (text: string | undefined, type: 'menu' | 'cell' | 'header' | 'title' = 'cell') => {
    const length = text?.length || 0;
    if (type === 'header') {
      if (length < 15) return 'text-4xl';
      if (length < 25) return 'text-3xl';
      return 'text-2xl';
    }
    if (type === 'title') {
      if (length < 15) return 'text-xl';
      if (length < 25) return 'text-lg';
      return 'text-base';
    }
    if (type === 'menu') {
      if (length < 40) return 'text-[11px]';
      if (length < 80) return 'text-[9px]';
      return 'text-[8px] leading-tight';
    }
    if (length < 15) return 'text-[11px]';
    if (length < 30) return 'text-[9px]';
    return 'text-[8px]';
  };

  const columns = [
    { label: "Café d'accueil", keys: ["café d'accueil", "kf d'accueil", "accueil"] },
    { label: "Pause AM", keys: ["pause am", "pause matin"] },
    { label: "APERITIF", keys: ["aperitif", "apéritif", "apero"] },
    { label: "DEJEUNER", keys: ["dejeuner", "déjeuner"] },
    { label: "Pause PM", keys: ["pause pm", "pause après-midi"] },
    { label: "APERITIF", keys: ["aperitif 2", "apéritif soir", "cocktail"] },
    { label: "DINER", keys: ["diner", "dîner"] },
    { label: "Départ", keys: ["départ", "fin"] },
  ];

  const getPrestationForColumn = (day: DayData, types: string[]): Prestation | undefined => {
    return day.prestations.find(p => 
      types.some(t => p.type.toLowerCase() === t.toLowerCase()) ||
      types.some(t => (p.nom || '').toLowerCase().includes(t.toLowerCase()))
    );
  };

  const findArrival = (role: 'RESPONSABLE' | 'PARTICIPANTS'): Prestation | undefined => {
    return currentDay.prestations.find(p => 
      p.type.toUpperCase().includes('ARRIVÉE') && 
      (p.type.toUpperCase().includes(role) || (p.nom || '').toUpperCase().includes(role))
    );
  };

  const isMenuEmpty = (menu?: any) => {
    if (!menu) return true;
    return !menu.menuName && !menu.entree && !menu.plat && !menu.dessert;
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Calendar className="text-emerald-600" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-slate-400">Jour de séminaire</span>
            <select 
              className="font-black text-slate-900 outline-none uppercase text-sm bg-slate-50 px-2 py-1 rounded border"
              value={dayIdx}
              onChange={(e) => setDayIdx(parseInt(e.target.value))}
            >
              {editData.days.map((d, i) => (
                <option key={i} value={i}>{d.date || `Jour ${i+1}`}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 bg-slate-100 rounded-xl font-black uppercase text-[10px] flex items-center gap-2">
                {isEditing ? <Check size={14}/> : <Edit3 size={14}/>} {isEditing ? 'Valider' : 'Modifier'}
            </button>
            <button 
              onClick={handleDownloadPDF} 
              disabled={isGeneratingPDF}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg disabled:opacity-70"
            >
                {isGeneratingPDF ? <Loader2 size={14} className="animate-spin"/> : <Printer size={14}/>} 
                {isGeneratingPDF ? 'Génération...' : 'Imprimer PDF'}
            </button>
        </div>
      </div>

      {/* Conteneur de la fiche - forcé à 210mm (A4 Portrait) pour la génération */}
      <div id="print-sheet" className="bg-white p-6 border border-black mx-auto w-full max-w-[210mm] print:max-w-none print:m-0 print:border-black text-[10px] font-sans leading-tight shadow-lg print:shadow-none min-h-[297mm]">
        
        <div className="border border-black mb-3">
          <div className="grid grid-cols-12 divide-x divide-black h-6">
            <div className="col-span-2 p-1 font-bold text-[8px] uppercase">Responsable du groupe</div>
            <div className="col-span-1 p-1 bg-slate-100 text-center font-black">DF</div>
            <div className="col-span-6 p-1 text-rose-600 font-black text-center uppercase flex items-center justify-center text-[9px]">
              ANNULE ET REMPLACE LA PRECEDENTE
            </div>
            <div className="col-span-3 p-1 font-bold text-right text-[8px]">
              {todayDate} {todayTime}
            </div>
          </div>
          <div className="grid grid-cols-12 divide-x divide-black border-t border-black min-h-[50px]">
            <div className="col-span-2 p-1.5 font-black uppercase flex items-center bg-slate-50">Entreprise :</div>
            <div className={`col-span-8 p-2 font-black italic uppercase flex items-center justify-center text-center text-rose-600 leading-none ${getAdaptiveTextClass(editData.entreprise, 'header')}`}>
              {editData.entreprise}
            </div>
            <div className="col-span-2 p-1.5 bg-slate-900 text-white flex flex-col justify-center text-center">
               <div className="text-[6px] font-bold uppercase opacity-60">SECTEUR</div>
               <div className="font-black text-[8px] uppercase">{editData.secteur || '—'}</div>
            </div>
          </div>
        </div>

        <div className="border-x border-b border-black grid grid-cols-12 divide-x divide-black mb-3 items-stretch">
          <div className="col-span-4 grid grid-cols-4 divide-x divide-black text-[8px] font-black uppercase">
            <div className="bg-slate-50 flex items-center justify-center">DU</div>
            <div className="flex items-center justify-center">{editData.days[0]?.date.split(' ').slice(0, 2).join(' ')}</div>
            <div className="bg-slate-50 flex items-center justify-center">AU</div>
            <div className="flex items-center justify-center">{editData.days[editData.days.length-1]?.date.split(' ').slice(0, 2).join(' ')}</div>
          </div>
          <div className="col-span-6 flex items-center justify-center py-2 bg-white">
            <span className="text-indigo-600 font-black text-2xl uppercase tracking-tighter italic">
              {currentDayFormatted}
            </span>
          </div>
          <div className="col-span-2 flex items-center justify-center bg-slate-50 p-1">
             <div className="w-full h-full border border-dashed border-slate-300 rounded flex items-center justify-center grayscale opacity-50">
                <TreeDeciduous size={18} />
             </div>
          </div>
        </div>

        <div className="border border-black mb-3 overflow-hidden">
          <div className="grid grid-cols-12 divide-x divide-black items-stretch bg-white">
            <div className="col-span-2 p-2 bg-slate-50 font-black uppercase flex items-center justify-center text-[10px]">Chambres</div>
            <div className="col-span-10 flex flex-wrap divide-x divide-black h-full">
              {(currentDay.hebergement && currentDay.hebergement.length > 0) ? (
                currentDay.hebergement.map((h, i) => (
                  <div key={i} className="px-4 py-2 flex items-center gap-2">
                    <span className="font-black text-sm">{h.nbChambres || '0'}</span>
                    <span className="font-bold text-[9px] uppercase text-slate-500">{h.typeChambre || '—'}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 italic text-slate-300">Aucun hébergement renseigné</div>
              )}
            </div>
          </div>
        </div>

        <div className="border border-black grid grid-cols-2 divide-x divide-black mb-3 bg-white">
          <div className="p-1.5 space-y-0.5">
            <div className="text-[8px] font-black uppercase text-slate-400 border-b border-slate-100 mb-1">Contact client</div>
            <div className="text-[8px]">NOM: <span className="font-bold uppercase">{editData.contactClient?.nom || '—'}</span></div>
            <div className="text-[8px]">TÉLÉPHONE: <span className="font-bold text-indigo-700">{editData.contactClient?.tel || '—'}</span></div>
            <div className="text-[8px]">MAIL: <span className="italic font-bold text-indigo-700 underline underline-offset-1 text-[7px]">{editData.contactClient?.email || '—'}</span></div>
          </div>
          <div className="p-1.5 space-y-0.5">
            <div className="text-[8px] font-black uppercase text-slate-400 border-b border-slate-100 mb-1">Resp sur place</div>
            <div className="text-[8px]">NOM: <span className="font-bold uppercase">{editData.responsableSurPlace?.nom || '—'}</span></div>
            <div className="text-[8px]">TÉLÉPHONE: <span className="font-bold text-indigo-700">{editData.responsableSurPlace?.tel || '—'}</span></div>
            <div className="text-[8px]">MAIL: <span className="italic font-bold text-indigo-700 underline underline-offset-1 text-[7px]">{editData.responsableSurPlace?.email || '—'}</span></div>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          <div className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-3 text-[9px] font-black text-rose-500 uppercase px-1">Arrivée RESPONSABLE</div>
            <div className="col-span-7 border-b border-black text-center font-black uppercase h-5 leading-relaxed bg-slate-50/50">{findArrival('RESPONSABLE')?.nom || ''}</div>
            <div className="col-span-2 bg-yellow-100 p-1 text-center font-black text-xs flex items-center justify-center h-5 border border-black shadow-sm">{findArrival('RESPONSABLE')?.horaires || ''}</div>
          </div>
          <div className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-3 text-[9px] font-black text-emerald-600 uppercase px-1">Arrivée PARTICIPANTS</div>
            <div className="col-span-7 border-b border-black text-center font-black uppercase h-5 leading-relaxed bg-slate-50/50">{findArrival('PARTICIPANTS')?.nom || ''}</div>
            <div className="col-span-2 bg-yellow-100 p-1 text-center font-black text-xs flex items-center justify-center h-5 border border-black shadow-sm">{findArrival('PARTICIPANTS')?.horaires || ''}</div>
          </div>
        </div>

        <table className="w-full border-collapse border border-black mb-3">
          <thead>
            <tr className="bg-emerald-50 h-6">
              <th className="border border-black w-[12%]"></th>
              {columns.map((c, i) => (
                <th key={i} className={`border border-black font-black uppercase text-[8px] text-center ${c.label === 'Départ' ? 'bg-slate-200' : ''}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="h-8">
              <td className="border border-black bg-slate-100 font-black uppercase text-center text-[8px]">Nom / N°</td>
              {columns.map((c, i) => {
                const p = getPrestationForColumn(currentDay, c.keys);
                const isSpec = p?.nom?.includes('+') || p?.nom?.includes('Gourmande');
                return (
                  <td key={i} className={`border border-black text-center font-bold px-1 ${isSpec ? 'text-rose-500' : 'text-black'} ${getAdaptiveTextClass(p?.nom)}`}>
                    {p?.nom || ''}
                  </td>
                );
              })}
            </tr>
            <tr className="h-8">
              <td className="border border-black bg-slate-100 font-black uppercase text-center text-[8px]">PAX</td>
              {columns.map((c, i) => (
                <td key={i} className="border border-black text-center font-black text-sm">{getPrestationForColumn(currentDay, c.keys)?.pax || ''}</td>
              ))}
            </tr>
            <tr className="h-8">
              <td className="border border-black bg-slate-100 font-black uppercase text-center text-[8px]">HORAIRES</td>
              {columns.map((c, i) => (
                <td key={i} className="border border-black text-center font-black text-xs">{getPrestationForColumn(currentDay, c.keys)?.horaires || ''}</td>
              ))}
            </tr>
            <tr className="h-8">
              <td className="border border-black bg-slate-100 font-black uppercase text-center text-[8px]">LIEU</td>
              {columns.map((c, i) => {
                const p = getPrestationForColumn(currentDay, c.keys);
                const isDejOrDin = c.label === 'DEJEUNER' || c.label === 'DINER';
                return (
                  <td key={i} className={`border border-black text-center font-black uppercase ${isDejOrDin ? 'bg-yellow-100' : 'bg-yellow-50'} ${getAdaptiveTextClass(p?.lieu)}`}>
                    {isDejOrDin ? `SALLE / ${p?.lieu || ''}` : p?.lieu || ''}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 divide-x divide-black border border-black mb-3 bg-white">
          {['dejeunerMenu', 'dinerMenu'].map((mKey) => {
            const menu = currentDay[mKey as 'dejeunerMenu' | 'dinerMenu'];
            const label = mKey === 'dejeunerMenu' ? 'DEJEUNER' : 'DINER';
            const empty = isMenuEmpty(menu);
            return (
              <div key={mKey} className={`flex flex-col relative min-h-[300px] h-auto ${empty ? 'bg-slate-50 opacity-40 grayscale' : ''}`}>
                <div className="bg-emerald-700 text-white text-center font-black uppercase py-0.5 text-xs tracking-widest">{label}</div>
                <div className="grid grid-cols-2 divide-x divide-black border-b border-black h-10 overflow-hidden">
                  <div className="p-1 flex flex-col justify-center">
                    <span className="text-[6px] font-bold uppercase text-slate-400 leading-none mb-0.5">NOM MENU</span>
                    <span className={`font-black uppercase line-clamp-1 text-black leading-tight ${getAdaptiveTextClass(menu?.menuName, 'title')}`}>{menu?.menuName || ''}</span>
                  </div>
                  <div className="bg-slate-50"></div>
                </div>
                <div className="flex flex-col divide-y divide-black text-[11px] font-black text-center">
                  <div className="flex min-h-[50px]">
                    <div className="w-1/4 bg-slate-100 font-black flex items-center justify-center text-[7px] uppercase border-r border-black">ENTRÉE</div>
                    <div className={`flex-1 p-2 flex items-center justify-center text-center px-4 leading-tight bg-yellow-400 font-black ${getAdaptiveTextClass(menu?.entree, 'menu')}`}>{menu?.entree}</div>
                  </div>
                  <div className="flex min-h-[70px]">
                    <div className="w-1/4 bg-slate-100 font-black flex items-center justify-center text-[7px] uppercase border-r border-black">PLAT</div>
                    <div className={`flex-1 p-2 flex items-center justify-center text-center px-4 leading-tight bg-yellow-400 font-black ${getAdaptiveTextClass(menu?.plat, 'menu')}`}>{menu?.plat}</div>
                  </div>
                  <div className="flex min-h-[50px]">
                    <div className="w-1/4 bg-slate-100 font-black flex items-center justify-center text-[7px] uppercase border-r border-black">DESSERT</div>
                    <div className={`flex-1 p-2 flex items-center justify-center text-center px-4 leading-tight bg-yellow-400 font-black ${getAdaptiveTextClass(menu?.dessert, 'menu')}`}>{menu?.dessert}</div>
                  </div>
                  <div className="flex flex-col bg-slate-50 h-auto overflow-visible">
                      <div className="text-[7px] font-black uppercase text-indigo-700 bg-indigo-50/50 py-0.5 border-b border-black tracking-widest">Régime alimentaire spécifique</div>
                      <div className="flex-1 flex flex-col divide-y divide-black/10 overflow-visible">
                          {(menu?.allergies || []).map((a, i) => (
                            <div key={i} className="grid grid-cols-12 divide-x divide-black text-[8px] h-6 items-center">
                              <div className="col-span-6 px-2 font-black text-left uppercase">{a.name}</div>
                              <div className="col-span-1 text-center font-black bg-white">{a.nb}</div>
                              <div className="col-span-5 px-2 font-bold italic text-slate-500 truncate">{a.restriction || 'pas précisé'}</div>
                            </div>
                          ))}
                          {(!menu?.allergies || menu.allergies.length === 0) && <span className="text-[7px] italic text-slate-300 py-2">Aucun régime</span>}
                      </div>
                  </div>
                </div>
                <div className="border-t border-black grid grid-cols-2 divide-x divide-black h-10 mt-auto bg-white">
                  <div className="p-1 flex flex-col justify-center">
                    <span className="text-rose-600 font-black text-[7px] uppercase">Vin ?</span>
                    <div className="text-[8px] font-bold">Nb : {menu?.vinNb || '—'}</div>
                  </div>
                  <div className="p-1 flex flex-col justify-center">
                    <span className="text-rose-600 font-black text-[7px] uppercase">Soft ?</span>
                    <div className="text-[8px] font-bold">Nb : {menu?.softNb || '—'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border border-black mb-3 min-h-[40px] flex flex-col bg-white overflow-hidden">
          <div className="bg-slate-100 text-[8px] font-black p-0.5 border-b border-black text-center uppercase tracking-widest">Activités / Team Building / Infos Spécifiques</div>
          <div className="p-1.5 text-[9px] italic flex-1 font-medium text-slate-700">
            {currentDay.teamBuilding?.enabled && (
              <div className="flex gap-2 mb-1">
                <span className="font-black bg-indigo-600 text-white px-1 py-0.5 rounded text-[7px] uppercase tracking-widest">Team Building</span>
                <span className="font-black text-indigo-800">{currentDay.teamBuilding.description}</span>
              </div>
            )}
            <p className="whitespace-pre-wrap">{editData.commentairesEquipe}</p>
          </div>
        </div>

        <div className="border border-black mb-3">
          <div className="bg-slate-900 text-white text-[9px] font-black p-0.5 text-center uppercase tracking-widest">DISPOSITION DES SALLES</div>
          <table className="w-full text-[8px] border-collapse bg-white">
            <thead>
              <tr className="bg-emerald-50 border-b border-black h-5 font-black text-center">
                <th className="border-r border-black w-1/4 uppercase">Salles</th>
                <th className="border-r border-black w-[10%] uppercase">Pax</th>
                <th className="border-r border-black flex-1 uppercase">Format (U, Théâtre, Classe, Conférence)</th>
                <th className="w-[15%] uppercase">Matériel</th>
              </tr>
            </thead>
            <tbody>
              {(currentDay.sallesDisposition || []).map((s, i) => (
                <tr key={i} className="min-h-[20px] border-b border-black last:border-b-0">
                  <td className="border-r border-black px-1.5 font-black uppercase">{s.salle}</td>
                  <td className="border-r border-black text-center font-black">{s.pax}</td>
                  <td className="border-r border-black px-1.5 font-medium">{s.format}</td>
                  <td className="px-1.5 italic">{s.materiel || ''}</td>
                </tr>
              ))}
              {(!currentDay.sallesDisposition || currentDay.sallesDisposition.length === 0) && (
                <tr className="h-5"><td colSpan={4} className="text-center italic text-slate-300">Aucune salle configurée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-2 border-rose-500 bg-white">
          <div className="bg-rose-50 text-rose-600 text-[8px] font-black p-0.5 text-center uppercase border-b border-rose-500">PRISE EN CHARGE DES EXTRAS</div>
          <div className="grid grid-cols-6 divide-x divide-rose-500 text-[8px] h-8 items-center text-center">
            <div className="bg-white font-black uppercase text-rose-600">BAR</div>
            <div className="bg-slate-50 font-bold italic">{editData.extras?.bar || 'Société'}</div>
            <div className="bg-white font-black uppercase text-rose-600">Restaurant</div>
            <div className="bg-slate-50 font-bold italic">{editData.extras?.restaurant || 'Société'}</div>
            <div className="bg-white font-black uppercase text-rose-600">Transfert Leader</div>
            <div className="bg-slate-50 font-black text-rose-700">{editData.extras?.transfert || 'NON'}</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SchedulePreview;
