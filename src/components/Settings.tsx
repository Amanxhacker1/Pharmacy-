import React, { useState } from 'react';
import { BusinessProfile } from '../types';
import { 
  Building2, 
  Save, 
  Download, 
  Upload, 
  RefreshCcw, 
  Info, 
  CheckCircle,
  FileCode
} from 'lucide-react';

interface SettingsProps {
  profile: BusinessProfile;
  onUpdateProfile: (newProfile: BusinessProfile) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
}

export default function Settings({
  profile,
  onUpdateProfile,
  onExportData,
  onImportData,
  onResetData
}: SettingsProps) {
  // Local Profile Field States
  const [name, setName] = useState(profile.name);
  const [address, setAddress] = useState(profile.address);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [gstin, setGstin] = useState(profile.gstin);
  const [drugLicenseNo, setDrugLicenseNo] = useState(profile.drugLicenseNo);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Submit Profile Changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gstin: gstin.toUpperCase().trim(),
      drugLicenseNo: drugLicenseNo.toUpperCase().trim()
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" id="settings-tab">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Business Profile settings */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="text-blue-800" size={20} />
            <h3 className="font-bold text-slate-950 text-base">Pharmacy Company Details</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pharmacy / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone No *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Physical Address *
              </label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email ID
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company GSTIN *
                </label>
                <input
                  type="text"
                  required
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-600 uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Drug License Number
                </label>
                <input
                  type="text"
                  value={drugLicenseNo}
                  onChange={(e) => setDrugLicenseNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-600 uppercase"
                />
              </div>
            </div>

            {/* Save Success Banner */}
            {saveSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle size={16} />
                Business details saved successfully! The layout header and invoices will adjust immediately.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-blue-800 hover:bg-blue-900 active:bg-blue-950 text-white font-bold px-5 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Save size={14} />
                Save Business Profile
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Data backups / Restore */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileCode className="text-teal-600" size={20} />
              <h3 className="font-bold text-slate-950 text-base">ERP Data Security</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Marg ERP style software focuses on offline reliability. Your pharmaceutical database, stock history, and invoice reports are stored directly in your local browser storage. Use these tools to back up and secure your database.
            </p>

            <div className="space-y-2.5 pt-2">
              {/* Export Backup JSON */}
              <button
                onClick={onExportData}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Export database as JSON"
              >
                <Download size={14} />
                Export Database Backup (.json)
              </button>

              {/* Import Backup JSON */}
              <div className="relative">
                <label className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <Upload size={14} />
                  Import Database Backup (.json)
                  <input
                    type="file"
                    accept=".json"
                    onChange={onImportData}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-2 text-slate-400">
              <Info className="shrink-0 mt-0.5 text-slate-400" size={14} />
              <span className="text-[10px] leading-relaxed">
                Importing backups will replace all active stock and invoices. Take a backup export before replacing!
              </span>
            </div>

            {/* Reset to Sample Data */}
            <button
              onClick={() => {
                if (confirm("Are you sure you want to reset the database to original sample medicines? This clears all existing manual billing registers.")) {
                  onResetData();
                }
              }}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCcw size={14} />
              Reset App to Initial Sample Data
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
