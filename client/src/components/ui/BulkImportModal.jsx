import { useState, useRef, useCallback } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import Button from './Button';
import { bulkImportApi } from '../../api/bulkImport.api';
import toast from 'react-hot-toast';

const STEPS = {
  UPLOAD: 'upload',
  IMPORTING: 'importing',
  RESULTS: 'results',
};

const ENTITY_CONFIG = {
  students: {
    label: 'Students',
    description: 'Import student records including names, admission numbers, class assignments, and contact information.',
    requiredFields: 'firstName, lastName, admissionNo, gender, dateOfBirth',
  },
  teachers: {
    label: 'Teachers',
    description: 'Import teacher profiles including names, employee IDs, departments, and contact details.',
    requiredFields: 'firstName, lastName, employeeId',
  },
  classes: {
    label: 'Classes',
    description: 'Import class definitions with academic year mapping and optional class teacher assignment.',
    requiredFields: 'name, academicYear',
  },
  sections: {
    label: 'Sections',
    description: 'Import sections within existing classes.',
    requiredFields: 'name, className',
  },
  subjects: {
    label: 'Subjects',
    description: 'Import subjects with codes, types, and period configurations.',
    requiredFields: 'name, code',
  },
};

export default function BulkImportModal({ isOpen, onClose, entityType, onSuccess }) {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedErrors, setExpandedErrors] = useState(new Set());
  const fileInputRef = useRef(null);

  const config = ENTITY_CONFIG[entityType] || ENTITY_CONFIG.students;

  const reset = useCallback(() => {
    setStep(STEPS.UPLOAD);
    setFile(null);
    setDragOver(false);
    setDownloading(false);
    setImporting(false);
    setResults(null);
    setExpandedErrors(new Set());
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      await bulkImportApi.downloadTemplate(entityType);
      toast.success('Template downloaded!');
    } catch (e) {
      toast.error(e?.message || 'Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      const ext = droppedFile.name.toLowerCase().split('.').pop();
      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        setFile(droppedFile);
      } else {
        toast.error('Please upload an Excel (.xlsx) or CSV (.csv) file');
      }
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    setStep(STEPS.IMPORTING);
    setImporting(true);

    try {
      const response = await bulkImportApi.importFile(entityType, file);
      setResults(response.data);
      setStep(STEPS.RESULTS);

      if (response.data?.created > 0) {
        toast.success(`${response.data.created} ${config.label.toLowerCase()} imported successfully!`);
        onSuccess?.();
      } else if (response.data?.errors?.length > 0) {
        toast.error('Import completed with errors. No records were created.');
      }
    } catch (e) {
      toast.error(e?.message || 'Import failed');
      setStep(STEPS.UPLOAD);
    } finally {
      setImporting(false);
    }
  };

  const toggleErrorRow = (row) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 rounded-xl">
              <FileSpreadsheet size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Bulk Import {config.label}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Upload Excel or CSV files</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {/* Step: Upload */}
          {step === STEPS.UPLOAD && (
            <div className="space-y-5">
              {/* Description */}
              <p className="text-sm text-gray-400">{config.description}</p>

              {/* Download template */}
              <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-600/15 rounded-lg mt-0.5">
                    <Download size={16} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-200">Step 1: Download Template</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Download the Excel template, fill it with your data, then upload it below. The template includes sample rows and an instructions sheet.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleDownloadTemplate}
                      loading={downloading}
                    >
                      <Download size={14} className="mr-1.5" />
                      Download {config.label} Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Upload zone */}
              <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-xl">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-indigo-600/15 rounded-lg mt-0.5">
                    <Upload size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">Step 2: Upload File</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Required fields: <span className="text-gray-300 font-mono">{config.requiredFields}</span>
                    </p>
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                    dragOver
                      ? 'border-indigo-500 bg-indigo-600/10'
                      : file
                        ? 'border-emerald-500/50 bg-emerald-600/5'
                        : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {file ? (
                    <div className="space-y-2">
                      <FileSpreadsheet size={32} className="mx-auto text-emerald-400" />
                      <p className="text-sm font-medium text-gray-200">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={32} className="mx-auto text-gray-500" />
                      <p className="text-sm text-gray-300">
                        Drag & drop your file here, or <span className="text-indigo-400 underline">browse</span>
                      </p>
                      <p className="text-xs text-gray-500">Supports .xlsx, .xls, .csv (max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleImport} disabled={!file}>
                  <Upload size={14} className="mr-1.5" />
                  Import {config.label}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {step === STEPS.IMPORTING && (
            <div className="flex flex-col items-center py-12 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-200">Importing {config.label}...</p>
                <p className="text-xs text-gray-400 mt-1">Processing your file, please wait</p>
              </div>
            </div>
          )}

          {/* Step: Results */}
          {step === STEPS.RESULTS && results && (
            <div className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-emerald-600/10 border border-emerald-600/20 rounded-xl text-center">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-1" />
                  <p className="text-2xl font-bold text-emerald-400">{results.created}</p>
                  <p className="text-xs text-gray-400">Created</p>
                </div>
                <div className="p-4 bg-amber-600/10 border border-amber-600/20 rounded-xl text-center">
                  <AlertTriangle size={24} className="mx-auto text-amber-400 mb-1" />
                  <p className="text-2xl font-bold text-amber-400">{results.skipped}</p>
                  <p className="text-xs text-gray-400">Skipped</p>
                </div>
                <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-xl text-center">
                  <XCircle size={24} className="mx-auto text-red-400 mb-1" />
                  <p className="text-2xl font-bold text-red-400">{results.errors.length}</p>
                  <p className="text-xs text-gray-400">Errors</p>
                </div>
              </div>

              {/* Error details */}
              {results.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-300">Error Details</h3>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {results.errors.map((errItem, idx) => (
                      <div key={idx} className="bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleErrorRow(errItem.row)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-700/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-red-600/20 text-red-400 rounded text-xs font-bold">
                              {errItem.row}
                            </span>
                            <span className="text-sm text-gray-300">
                              Row {errItem.row} — {errItem.errors.length} error{errItem.errors.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          {expandedErrors.has(errItem.row)
                            ? <ChevronUp size={14} className="text-gray-500" />
                            : <ChevronDown size={14} className="text-gray-500" />
                          }
                        </button>
                        {expandedErrors.has(errItem.row) && (
                          <div className="px-3 pb-2 pt-0.5 border-t border-gray-700/50">
                            {errItem.errors.map((e, eIdx) => (
                              <div key={eIdx} className="flex items-start gap-2 py-1">
                                <span className="text-xs font-mono text-amber-400 min-w-[80px]">{e.field}</span>
                                <span className="text-xs text-gray-400">{e.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={handleClose}>Close</Button>
                <Button variant="outline" onClick={reset}>
                  <Upload size={14} className="mr-1.5" />
                  Import More
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
