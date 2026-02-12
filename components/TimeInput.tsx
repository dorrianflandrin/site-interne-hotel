
import React from 'react';

interface TimeInputProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
}

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange, className = "" }) => {
  // On extrait HH et MM du format "HH:MM" ou "HHhMM"
  const parts = value.split(/[:h]/i);
  const hh = parts[0] || "";
  const mm = parts[1] || "";

  const handleHHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (parseInt(val) > 23) val = "23";
    onChange(`${val}:${mm.padStart(2, '0')}`);
  };

  const handleMMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (parseInt(val) > 59) val = "59";
    onChange(`${hh.padStart(2, '0')}:${val}`);
  };

  const onBlur = () => {
    // Normalisation finale au format 00:00
    const finalHH = hh.padStart(2, '0').slice(0, 2);
    const finalMM = mm.padStart(2, '0').slice(0, 2);
    onChange(`${finalHH}:${finalMM}`);
  };

  return (
    <div className={`flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm focus-within:border-emerald-500 transition-colors ${className}`}>
      <input
        type="text"
        value={hh}
        onChange={handleHHChange}
        onBlur={onBlur}
        placeholder="00"
        className="w-6 text-center outline-none bg-transparent font-bold text-slate-900"
      />
      <span className="font-black text-slate-400 mx-0.5">:</span>
      <input
        type="text"
        value={mm}
        onChange={handleMMChange}
        onBlur={onBlur}
        placeholder="00"
        className="w-6 text-center outline-none bg-transparent font-bold text-slate-900"
      />
    </div>
  );
};

export default TimeInput;
