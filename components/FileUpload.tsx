
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, FileWarning, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-3xl p-12 transition-all duration-200
        flex flex-col items-center justify-center text-center cursor-pointer
        ${isDragging ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'}
      `}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        className="hidden"
        accept=".xlsx, .xls, .csv, image/*"
        onChange={handleFileInput}
      />
      
      <div className="flex gap-4 mb-6">
        <div className="bg-green-100 p-6 rounded-full text-green-600">
          <FileSpreadsheet size={48} strokeWidth={1.5} />
        </div>
        <div className="bg-indigo-50 p-6 rounded-full text-indigo-600 hidden md:block">
          <ImageIcon size={48} strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-2">Téléchargez votre Fiche Presta</h3>
      <p className="text-slate-500 mb-6 max-w-xs mx-auto">
        Glissez-déposez votre fichier <strong>Excel</strong> ou une image de la fiche.
      </p>

      <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
        <div className="h-px w-8 bg-slate-200"></div>
        <span>Formats recommandés</span>
        <div className="h-px w-8 bg-slate-200"></div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <span className="px-3 py-1 bg-green-100 rounded-md border border-green-200 text-green-700 font-mono text-xs font-bold">XLSX</span>
        <span className="px-3 py-1 bg-green-100 rounded-md border border-green-200 text-green-700 font-mono text-xs font-bold">XLS</span>
        <span className="px-3 py-1 bg-slate-100 rounded-md border border-slate-200 text-slate-600 font-mono text-xs">PNG / JPG</span>
      </div>
    </div>
  );
};

export default FileUpload;
