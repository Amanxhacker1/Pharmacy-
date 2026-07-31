import React, { useState, useEffect } from 'react';
import { Medicine, Invoice, BusinessProfile } from './types';
import { 
  DEFAULT_BUSINESS_PROFILE, 
  SAMPLE_MEDICINES, 
  SAMPLE_INVOICES 
} from './data/sampleData';

// Component Imports
import DashboardOverview from './components/DashboardOverview';
import MedicineManager from './components/MedicineManager';
import BillingSystem from './components/BillingSystem';
import InvoiceHistory from './components/InvoiceHistory';
import InvoicePrintView from './components/InvoicePrintView';
import Settings from './components/Settings';

// Icons
import { 
  LayoutDashboard, 
  ShoppingCart, 
  PackageSearch, 
  History, 
  Settings as SettingsIcon, 
  Building2, 
  HeartHandshake, 
  Clock
} from 'lucide-react';

export default function App() {
  // --- Core Persistent States ---
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Printing Overlay state
  const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState<Invoice | null>(null);

  // --- Initial Hydration from Local Storage ---
  useEffect(() => {
    // 1. Medicines
    const savedMedicines = localStorage.getItem('pharma_medicines');
    if (savedMedicines) {
      try {
        setMedicines(JSON.parse(savedMedicines));
      } catch (e) {
        setMedicines(SAMPLE_MEDICINES);
      }
    } else {
      setMedicines(SAMPLE_MEDICINES);
      localStorage.setItem('pharma_medicines', JSON.stringify(SAMPLE_MEDICINES));
    }

    // 2. Invoices
    const savedInvoices = localStorage.getItem('pharma_invoices');
    if (savedInvoices) {
      try {
        setInvoices(JSON.parse(savedInvoices));
      } catch (e) {
        setInvoices(SAMPLE_INVOICES);
      }
    } else {
      setInvoices(SAMPLE_INVOICES);
      localStorage.setItem('pharma_invoices', JSON.stringify(SAMPLE_INVOICES));
    }

    // 3. Business Profile
    const savedProfile = localStorage.getItem('pharma_business_profile');
    if (savedProfile) {
      try {
        setBusinessProfile(JSON.parse(savedProfile));
      } catch (e) {
        setBusinessProfile(DEFAULT_BUSINESS_PROFILE);
      }
    } else {
      setBusinessProfile(DEFAULT_BUSINESS_PROFILE);
      localStorage.setItem('pharma_business_profile', JSON.stringify(DEFAULT_BUSINESS_PROFILE));
    }
  }, []);

  // --- State Persistence Syncing ---
  const saveMedicinesToStorage = (updatedList: Medicine[]) => {
    setMedicines(updatedList);
    localStorage.setItem('pharma_medicines', JSON.stringify(updatedList));
  };

  const saveInvoicesToStorage = (updatedInvoices: Invoice[]) => {
    setInvoices(updatedInvoices);
    localStorage.setItem('pharma_invoices', JSON.stringify(updatedInvoices));
  };

  const saveProfileToStorage = (updatedProfile: BusinessProfile) => {
    setBusinessProfile(updatedProfile);
    localStorage.setItem('pharma_business_profile', JSON.stringify(updatedProfile));
  };

  // --- Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 to start dynamic checkout / billing
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('billing');
      }
      // F3 to go to stock catalog management
      if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('medicines');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Medicine Handlers ---
  const handleAddMedicine = (newMed: Omit<Medicine, 'id'>) => {
    const medicineItem: Medicine = {
      ...newMed,
      id: `med-${Date.now()}`
    };
    const updated = [medicineItem, ...medicines];
    saveMedicinesToStorage(updated);
  };

  const handleBulkAddMedicines = (newMedsList: Omit<Medicine, 'id'>[]) => {
    const batched: Medicine[] = newMedsList.map((m, index) => ({
      ...m,
      id: `med-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`
    }));
    const updated = [...batched, ...medicines];
    saveMedicinesToStorage(updated);
  };

  const handleUpdateMedicine = (updatedMed: Medicine) => {
    const updated = medicines.map(med => med.id === updatedMed.id ? updatedMed : med);
    saveMedicinesToStorage(updated);
  };

  const handleDeleteMedicine = (id: string) => {
    const updated = medicines.filter(med => med.id !== id);
    saveMedicinesToStorage(updated);
  };

  // --- Invoice & Stock Deduction Handlers ---
  const handleSaveInvoice = (newInvoice: Invoice) => {
    // 1. Save invoice to historical log
    const updatedInvoices = [newInvoice, ...invoices];
    saveInvoicesToStorage(updatedInvoices);

    // 2. Reduce medicine stocks based on quantities sold
    const updatedMedicines = medicines.map(med => {
      const soldItem = newInvoice.items.find(item => item.medicineId === med.id);
      if (soldItem) {
        return {
          ...med,
          stock: Math.max(0, med.stock - soldItem.qty) // deduct stock, don't go below 0
        };
      }
      return med;
    });

    saveMedicinesToStorage(updatedMedicines);
  };

  const handleDeleteInvoice = (id: string) => {
    const invoiceToVoid = invoices.find(inv => inv.id === id);
    
    // Optional: Revert stock levels if invoice is voided
    if (invoiceToVoid) {
      const updatedMedicines = medicines.map(med => {
        const voidedItem = invoiceToVoid.items.find(item => item.medicineId === med.id);
        if (voidedItem) {
          return {
            ...med,
            stock: med.stock + voidedItem.qty // return stock
          };
        }
        return med;
      });
      saveMedicinesToStorage(updatedMedicines);
    }

    const updatedInvoices = invoices.filter(inv => inv.id !== id);
    saveInvoicesToStorage(updatedInvoices);
  };

  // --- Export / Import Backup Handlers ---
  const handleExportData = () => {
    const backupObj = {
      medicines,
      invoices,
      businessProfile,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aman_pharma_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.medicines && parsed.invoices && parsed.businessProfile) {
          saveMedicinesToStorage(parsed.medicines);
          saveInvoicesToStorage(parsed.invoices);
          saveProfileToStorage(parsed.businessProfile);
          alert("ERP Database imported successfully! Real-time stats are updated.");
        } else {
          alert("Invalid backup file structure. Please upload a genuine Aman Pharma backup file.");
        }
      } catch (err) {
        alert("Error parsing JSON file. Ensure the file isn't corrupted.");
      }
    };
    fileReader.readAsText(files[0]);
  };

  const handleResetData = () => {
    saveMedicinesToStorage(SAMPLE_MEDICINES);
    saveInvoicesToStorage(SAMPLE_INVOICES);
    saveProfileToStorage(DEFAULT_BUSINESS_PROFILE);
    alert("Database successfully reset to default sample medicines!");
  };

  return (
    <div className="h-screen w-full bg-slate-100 flex flex-col font-sans text-slate-800 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      
      {/* Top Navigation / Header */}
      <header className="h-14 bg-indigo-900 text-white flex items-center justify-between px-6 shadow-md shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded shrink-0">
            <svg className="w-5 h-5 text-indigo-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </div>
          <h1 className="text-sm md:text-base font-bold tracking-tight uppercase flex items-center gap-2">
            {businessProfile.name}
            <span className="text-[10px] font-normal text-indigo-200 bg-indigo-800/80 px-2 py-0.5 rounded ml-1">v9.0.4 Premium</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex bg-indigo-800 rounded-md p-1 border border-indigo-700 text-xs">
            <button className="px-2.5 py-0.5 bg-white text-indigo-900 rounded font-bold shadow-xs">RETAIL</button>
            <button className="px-2.5 py-0.5 text-indigo-100 font-bold">WHOLESALE</button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-indigo-100">Operator: <span className="font-bold text-white">Ramesh Kumar</span></span>
            <div className="w-7 h-7 rounded-full bg-indigo-500 border border-indigo-400 flex items-center justify-center font-bold text-xs">RK</div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden print:block print:overflow-visible relative">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex w-64 bg-slate-800 text-slate-300 flex flex-col shrink-0 print:hidden shadow-lg border-r border-slate-700/50">
          <nav className="flex-1 py-4 space-y-1">
            <div className="px-5 mb-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Main Workstation</div>
            
            {/* Tab: Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left font-medium text-xs cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white border-r-4 border-indigo-400 font-bold'
                  : 'hover:bg-slate-700/60 hover:text-white text-slate-300'
              }`}
            >
              <LayoutDashboard size={16} className={activeTab === 'dashboard' ? 'text-white' : 'opacity-70'} />
              <span>Billing Dashboard</span>
            </button>

            {/* Tab: Billing */}
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left font-medium text-xs cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-indigo-600 text-white border-r-4 border-indigo-400 font-bold'
                  : 'hover:bg-slate-700/60 hover:text-white text-slate-300'
              }`}
            >
              <ShoppingCart size={16} className={activeTab === 'billing' ? 'text-white' : 'opacity-70'} />
              <span>Billing Console (F2)</span>
            </button>

            {/* Tab: Medicines */}
            <button
              onClick={() => setActiveTab('medicines')}
              className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left font-medium text-xs cursor-pointer ${
                activeTab === 'medicines'
                  ? 'bg-indigo-600 text-white border-r-4 border-indigo-400 font-bold'
                  : 'hover:bg-slate-700/60 hover:text-white text-slate-300'
              }`}
            >
              <PackageSearch size={16} className={activeTab === 'medicines' ? 'text-white' : 'opacity-70'} />
              <span>Stock Management (F3)</span>
            </button>

            {/* Tab: History */}
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left font-medium text-xs cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white border-r-4 border-indigo-400 font-bold'
                  : 'hover:bg-slate-700/60 hover:text-white text-slate-300'
              }`}
            >
              <History size={16} className={activeTab === 'history' ? 'text-white' : 'opacity-70'} />
              <span>Invoice Register</span>
            </button>

            {/* Tab: Settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left font-medium text-xs cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white border-r-4 border-indigo-400 font-bold'
                  : 'hover:bg-slate-700/60 hover:text-white text-slate-300'
              }`}
            >
              <SettingsIcon size={16} className={activeTab === 'settings' ? 'text-white' : 'opacity-70'} />
              <span>Ledger / Masters Settings</span>
            </button>
          </nav>

          {/* Disk space / Data backup health status */}
          <div className="p-4 bg-slate-900 border-t border-slate-700">
            <div className="flex justify-between items-center mb-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Local Database</span>
              <span className="text-teal-400">Stable</span>
            </div>
            <div className="w-full bg-slate-700 h-1 rounded-full">
              <div className="bg-teal-500 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
            <span className="text-[9px] text-slate-400 block mt-1.5">GSTIN: {businessProfile.gstin}</span>
          </div>
        </aside>

        {/* Mobile Navigation Bar (Fixed at Bottom for small devices) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around text-slate-400 z-40 px-2 print:hidden pb-safe">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${
              activeTab === 'dashboard' ? 'text-indigo-400 font-bold scale-105' : 'hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={18} className={activeTab === 'dashboard' ? 'text-indigo-400' : 'opacity-75'} />
            <span className="text-[9px] mt-1 tracking-tight">Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${
              activeTab === 'billing' ? 'text-indigo-400 font-bold scale-105' : 'hover:text-slate-200'
            }`}
          >
            <ShoppingCart size={18} className={activeTab === 'billing' ? 'text-indigo-400' : 'opacity-75'} />
            <span className="text-[9px] mt-1 tracking-tight">POS Bill</span>
          </button>

          <button
            onClick={() => setActiveTab('medicines')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${
              activeTab === 'medicines' ? 'text-indigo-400 font-bold scale-105' : 'hover:text-slate-200'
            }`}
          >
            <PackageSearch size={18} className={activeTab === 'medicines' ? 'text-indigo-400' : 'opacity-75'} />
            <span className="text-[9px] mt-1 tracking-tight">Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${
              activeTab === 'history' ? 'text-indigo-400 font-bold scale-105' : 'hover:text-slate-200'
            }`}
          >
            <History size={18} className={activeTab === 'history' ? 'text-indigo-400' : 'opacity-75'} />
            <span className="text-[9px] mt-1 tracking-tight">Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${
              activeTab === 'settings' ? 'text-indigo-400 font-bold scale-105' : 'hover:text-slate-200'
            }`}
          >
            <SettingsIcon size={18} className={activeTab === 'settings' ? 'text-indigo-400' : 'opacity-75'} />
            <span className="text-[9px] mt-1 tracking-tight">Settings</span>
          </button>
        </nav>

        {/* Right Side Dashboard Content */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-100 print:overflow-visible print:bg-white">
          <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6 print:p-0">
            {activeTab === 'dashboard' && (
              <DashboardOverview 
                medicines={medicines}
                invoices={invoices}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'medicines' && (
              <MedicineManager
                medicines={medicines}
                onAddMedicine={handleAddMedicine}
                onUpdateMedicine={handleUpdateMedicine}
                onDeleteMedicine={handleDeleteMedicine}
                onBulkAddMedicines={handleBulkAddMedicines}
              />
            )}

            {activeTab === 'billing' && (
              <BillingSystem
                medicines={medicines}
                invoices={invoices}
                onSaveInvoice={handleSaveInvoice}
                onSelectInvoiceToPrint={(inv) => setSelectedInvoiceToPrint(inv)}
              />
            )}

            {activeTab === 'history' && (
              <InvoiceHistory
                invoices={invoices}
                onDeleteInvoice={handleDeleteInvoice}
                onSelectInvoiceToPrint={(inv) => setSelectedInvoiceToPrint(inv)}
              />
            )}

            {activeTab === 'settings' && (
              <Settings
                profile={businessProfile}
                onUpdateProfile={saveProfileToStorage}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onResetData={handleResetData}
              />
            )}
          </main>

          {/* Bottom Status Bar */}
          <footer className="hidden md:flex h-7 bg-indigo-950 text-[10px] text-indigo-300 px-6 items-center justify-between border-t border-indigo-900 shrink-0 print:hidden">
            <div className="flex gap-4">
              <span>SYSTEM ONLINE: <span className="text-green-400 font-bold">STABLE</span></span>
              <span>DB: <span className="text-white font-bold">PHARMA_LOCAL_DB</span></span>
              <span>DL No: <span className="text-white font-bold">{businessProfile.drugLicenseNo}</span></span>
            </div>
            <div className="flex gap-4">
              <span>GSTIN: <span className="text-white font-bold">{businessProfile.gstin}</span></span>
              <span className="text-indigo-200">Developed by TechFlow Solutions &copy; 2026</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Printing Dialog Overlay */}
      {selectedInvoiceToPrint && (
        <InvoicePrintView 
          invoice={selectedInvoiceToPrint}
          businessProfile={businessProfile}
          onClose={() => setSelectedInvoiceToPrint(null)}
        />
      )}

    </div>
  );
}
