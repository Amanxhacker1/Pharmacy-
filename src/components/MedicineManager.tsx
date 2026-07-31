import React, { useState, useMemo, useRef } from 'react';
import { Medicine } from '../types';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Package, 
  ArrowUpDown, 
  Tag, 
  Beaker, 
  Layers, 
  X,
  FileCheck,
  Upload,
  Download,
  Check
} from 'lucide-react';

interface MedicineManagerProps {
  medicines: Medicine[];
  onAddMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  onUpdateMedicine: (medicine: Medicine) => void;
  onDeleteMedicine: (id: string) => void;
  onBulkAddMedicines?: (newMedsList: Omit<Medicine, 'id'>[]) => void;
}

export default function MedicineManager({
  medicines,
  onAddMedicine,
  onUpdateMedicine,
  onDeleteMedicine,
  onBulkAddMedicines
}: MedicineManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterNearExpiry, setFilterNearExpiry] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'expiry'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Form Field States
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState(''); // YYYY-MM
  const [packing, setPacking] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('15');
  const [gstRate, setGstRate] = useState('5'); // default 5%
  const [shelfNo, setShelfNo] = useState('');

  // Excel Import/Export States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreviewList, setImportPreviewList] = useState<Omit<Medicine, 'id'>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Download currently loaded stocks as an Excel file
  const handleExportExcel = () => {
    if (medicines.length === 0) {
      alert("No medicines available to export.");
      return;
    }

    const exportData = medicines.map((med, index) => ({
      'S.No': index + 1,
      'Medicine Brand Name': med.name,
      'Formula / Salt Composition': med.formula,
      'Batch Number': med.batchNo,
      'Expiry Date (YYYY-MM)': med.expiryDate,
      'Packing (Unit)': med.packing,
      'Manufacturer / Company': med.manufacturer,
      'Buy Price (Cost)': med.buyPrice,
      'MRP (Selling Price)': med.sellingPrice,
      'Wholesale Price': med.wholesalePrice,
      'Stock Qty': med.stock,
      'Min Stock Reorder Alert': med.minStockAlert,
      'GST Rate (%)': med.gstRate,
      'Shelf / Rack No': med.shelfNo || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicine Stock');

    // Auto-adjust column widths
    const maxProps = [10, 30, 30, 15, 20, 15, 25, 12, 12, 15, 12, 18, 12, 15];
    worksheet['!cols'] = maxProps.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, `Pharma_Medicines_Stock_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Helper: Download a standard clean template with sample data
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'Medicine Brand Name': 'Calpol 650mg Tablet',
        'Formula / Salt Composition': 'Paracetamol 650mg IP',
        'Batch Number': 'B-CAL902',
        'Expiry Date (YYYY-MM)': '2027-12',
        'Packing (Unit)': '15 Tabs',
        'Manufacturer / Company': 'GSK Pharmaceuticals',
        'Buy Price (Cost)': 1.50,
        'MRP (Selling Price)': 2.50,
        'Wholesale Price': 1.80,
        'Stock Qty': 100,
        'Min Stock Reorder Alert': 20,
        'GST Rate (%)': 5,
        'Shelf / Rack No': 'Rack A-1'
      },
      {
        'Medicine Brand Name': 'Augmentin 625 Duo',
        'Formula / Salt Composition': 'Amoxycillin 500mg + Potassium Clavulanate 125mg',
        'Batch Number': 'B-AUG881',
        'Expiry Date (YYYY-MM)': '2026-10',
        'Packing (Unit)': '10 Tabs',
        'Manufacturer / Company': 'GlaxoSmithKline',
        'Buy Price (Cost)': 120.00,
        'MRP (Selling Price)': 201.20,
        'Wholesale Price': 140.00,
        'Stock Qty': 50,
        'Min Stock Reorder Alert': 10,
        'GST Rate (%)': 12,
        'Shelf / Rack No': 'Rack B-4'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicine Stock Template');

    const widths = [30, 40, 15, 20, 15, 25, 15, 18, 15, 12, 20, 12, 15];
    worksheet['!cols'] = widths.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, 'Medicine_Import_Template.xlsx');
  };

  // Helper: Parse uploaded Excel/CSV file
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (!rawData || rawData.length === 0) {
          alert("The Excel sheet seems empty or could not be parsed.");
          return;
        }

        const parsedList: Omit<Medicine, 'id'>[] = [];
        const errorLogs: string[] = [];

        rawData.forEach((row, idx) => {
          const rowNum = idx + 2; // spreadsheet is 1-indexed and has header row
          
          // Find matching values regardless of exact column casing/spaces
          const getValue = (synonyms: string[], defaultVal: any = '') => {
            for (const key of Object.keys(row)) {
              const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (synonyms.some(syn => normalizedKey.includes(syn.toLowerCase().replace(/[^a-z0-9]/g, '')))) {
                return row[key];
              }
            }
            return defaultVal;
          };

          const mName = getValue(['brandname', 'medicinename', 'name', 'dawa', 'brand'], '').toString().trim();
          const mFormula = getValue(['formula', 'salt', 'composition', 'saltcomposition'], '').toString().trim();
          const mBatch = getValue(['batchno', 'batch', 'batchnumber'], '').toString().trim();
          
          // Expiry date parse helper
          let mExpiry = getValue(['expirydate', 'expiry', 'expiryyyyymm'], '').toString().trim();
          if (mExpiry) {
            if (/^\d{4}-\d{2}$/.test(mExpiry)) {
              // YYYY-MM
            } else if (/^\d{4}-\d{1,2}-\d{1,2}/.test(mExpiry)) {
              mExpiry = mExpiry.substring(0, 7); // extract YYYY-MM
            } else if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(mExpiry)) {
              // US Date format MM/DD/YYYY
              const parts = mExpiry.split('/');
              let year = parts[2];
              let month = parts[0].padStart(2, '0');
              if (year.length === 2) year = '20' + year;
              mExpiry = `${year}-${month}`;
            } else if (/^[A-Za-z]+-\d{4}/.test(mExpiry)) {
              // MMM-YYYY (e.g. Dec-2026)
              const parts = mExpiry.split('-');
              const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
              const monthIdx = months.findIndex(m => parts[0].toLowerCase().startsWith(m));
              if (monthIdx !== -1) {
                const monthStr = (monthIdx + 1).toString().padStart(2, '0');
                mExpiry = `${parts[1]}-${monthStr}`;
              }
            } else if (/^\d{5}$/.test(mExpiry)) {
              // Excel serialized date
              try {
                const excelEpoch = new Date(1899, 11, 30);
                const days = parseInt(mExpiry, 10);
                const d = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
                const year = d.getFullYear();
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                mExpiry = `${year}-${month}`;
              } catch (e) {}
            }
          }

          const mPacking = getValue(['packing', 'pack', 'unit'], '10 Tabs').toString().trim();
          const mManufacturer = getValue(['manufacturer', 'company', 'mfg', 'mfgco'], 'Generic').toString().trim();
          
          const mBuyPrice = parseFloat(getValue(['buyprice', 'cost', 'purchaseprice', 'buy'], '0')) || 0;
          const mSellingPrice = parseFloat(getValue(['sellingprice', 'mrp', 'retailprice', 'sell'], '0')) || 0;
          const mWholesalePrice = parseFloat(getValue(['wholesaleprice', 'wholesale', 'wsprice'], '0')) || mSellingPrice;
          
          const mStock = parseInt(getValue(['stockqty', 'stock', 'qty', 'quantity'], '0')) || 0;
          const mMinStockAlert = parseInt(getValue(['minstock', 'alert', 'reorder'], '10')) || 10;
          const mGstRate = parseFloat(getValue(['gstrate', 'gst', 'tax', 'gstpercentage'], '5')) || 5;
          const mShelfNo = getValue(['shelfno', 'rackno', 'shelf', 'rack'], '').toString().trim() || undefined;

          if (!mName) {
            errorLogs.push(`Row ${rowNum}: Medicine Name (Brand) is missing.`);
            return;
          }

          parsedList.push({
            name: mName,
            formula: mFormula || 'Generic salt',
            batchNo: mBatch || 'BATCH-UNK',
            expiryDate: mExpiry || '2028-12',
            packing: mPacking,
            manufacturer: mManufacturer,
            buyPrice: mBuyPrice,
            sellingPrice: mSellingPrice,
            wholesalePrice: mWholesalePrice,
            stock: mStock,
            minStockAlert: mMinStockAlert,
            gstRate: mGstRate,
            shelfNo: mShelfNo
          });
        });

        if (parsedList.length === 0) {
          alert("Could not parse any valid medicine rows. Please check file headers.");
          return;
        }

        setImportPreviewList(parsedList);
        setImportErrors(errorLogs);
        setIsImportModalOpen(true);
      } catch (err) {
        console.error(err);
        alert("Error reading Excel file. Make sure it is a valid .xlsx or .xls spreadsheet.");
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input so same file can be uploaded again
    if (e.target) e.target.value = '';
  };

  // Confirm Excel import and close modals
  const handleConfirmImport = () => {
    if (importPreviewList.length > 0 && onBulkAddMedicines) {
      onBulkAddMedicines(importPreviewList);
      alert(`Success! Successfully imported ${importPreviewList.length} medicines into stock database.`);
      setIsImportModalOpen(false);
      setImportPreviewList([]);
      setImportErrors([]);
    } else {
      alert("No data to import or importer function not ready.");
    }
  };

  // Date threshold for expiry tracking (2026-07-30 is base system time)
  const currentDate = new Date('2026-07-30');

  // Open Add Form
  const openAddForm = () => {
    setEditingMedicine(null);
    setName('');
    setFormula('');
    setBatchNo('');
    setExpiryDate('');
    setPacking('10 Tabs');
    setManufacturer('');
    setBuyPrice('');
    setSellingPrice('');
    setWholesalePrice('');
    setStock('');
    setMinStockAlert('15');
    setGstRate('5');
    setShelfNo('');
    setIsFormOpen(true);
  };

  // Open Edit Form
  const openEditForm = (med: Medicine) => {
    setEditingMedicine(med);
    setName(med.name);
    setFormula(med.formula);
    setBatchNo(med.batchNo);
    setExpiryDate(med.expiryDate);
    setPacking(med.packing);
    setManufacturer(med.manufacturer);
    setBuyPrice(med.buyPrice.toString());
    setSellingPrice(med.sellingPrice.toString());
    setWholesalePrice(med.wholesalePrice.toString());
    setStock(med.stock.toString());
    setMinStockAlert(med.minStockAlert.toString());
    setGstRate(med.gstRate.toString());
    setShelfNo(med.shelfNo || '');
    setIsFormOpen(true);
  };

  // Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !formula.trim() || !batchNo.trim() || !expiryDate.trim()) {
      alert("Please fill in Name, Formula, Batch, and Expiry fields.");
      return;
    }

    const payload = {
      name: name.trim(),
      formula: formula.trim(),
      batchNo: batchNo.trim().toUpperCase(),
      expiryDate: expiryDate.trim(),
      packing: packing.trim() || "10 Tabs",
      manufacturer: manufacturer.trim() || "Generic",
      buyPrice: parseFloat(buyPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      wholesalePrice: parseFloat(wholesalePrice) || 0,
      stock: parseInt(stock) || 0,
      minStockAlert: parseInt(minStockAlert) || 10,
      gstRate: parseFloat(gstRate) || 5,
      shelfNo: shelfNo.trim() || undefined
    };

    if (editingMedicine) {
      onUpdateMedicine({
        ...payload,
        id: editingMedicine.id
      });
    } else {
      onAddMedicine(payload);
    }

    setIsFormOpen(false);
  };

  // Toggle Sorting
  const toggleSort = (type: 'name' | 'stock' | 'expiry') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('asc');
    }
  };

  // Filter and Sort Logic
  const filteredMedicines = useMemo(() => {
    return medicines
      .filter((med) => {
        // Search filter (Match name or formula)
        const matchSearch = 
          med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          med.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
          med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());

        // Low stock filter
        const matchLowStock = !filterLowStock || med.stock <= med.minStockAlert;

        // Expiry check
        let matchNearExpiry = true;
        if (filterNearExpiry && med.expiryDate) {
          const [year, month] = med.expiryDate.split('-').map(Number);
          const expDateObj = new Date(year, month - 1, 1);
          const diffTime = expDateObj.getTime() - currentDate.getTime();
          const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.4);
          matchNearExpiry = diffMonths <= 6; // Expiry within 6 months (including already expired)
        } else if (filterNearExpiry) {
          matchNearExpiry = false;
        }

        return matchSearch && matchLowStock && matchNearExpiry;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];

        if (sortBy === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortBy === 'expiry') {
          valA = a.expiryDate;
          valB = b.expiryDate;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [medicines, searchTerm, filterLowStock, filterNearExpiry, sortBy, sortOrder, currentDate]);

  // Quick helper to check if a medicine is near expiry or expired
  const getExpiryStatus = (expiryStr: string) => {
    if (!expiryStr) return { label: 'Unknown', color: 'text-slate-500' };
    const [year, month] = expiryStr.split('-').map(Number);
    const expDate = new Date(year, month - 1, 1);
    const diffTime = expDate.getTime() - currentDate.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.4);

    if (diffMonths < 0) {
      return { label: 'EXPIRED', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    } else if (diffMonths <= 3) {
      return { label: 'Expiring Soon (3M)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else if (diffMonths <= 6) {
      return { label: 'Near Expiry (6M)', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
    }
    return null;
  };

  return (
    <div className="space-y-6" id="stock-tab">
      {/* Search and Action Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search medicine by Brand Name, Salt composition/Formula, or Company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm placeholder-slate-400"
            id="med-search-input"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Low Stock Toggle */}
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              filterLowStock 
                ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-xs' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle size={14} className={filterLowStock ? 'text-rose-600' : 'text-slate-400'} />
            Low Stock Only
          </button>

          {/* Near Expiry Toggle */}
          <button
            onClick={() => setFilterNearExpiry(!filterNearExpiry)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              filterNearExpiry 
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle size={14} className={filterNearExpiry ? 'text-amber-600' : 'text-slate-400'} />
            Near Expiry
          </button>

          {/* Hidden File Input for Excel Import */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx,.xls,.csv" 
            className="hidden" 
          />

          {/* Import Excel Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            id="import-excel-btn"
            title="Upload medicines list from Excel / CSV"
          >
            <Upload size={16} />
            Upload Excel
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            id="export-excel-btn"
            title="Download medicines stock report as Excel"
          >
            <Download size={16} />
            Download Excel
          </button>

          {/* Add Product Button */}
          <button
            onClick={openAddForm}
            className="bg-blue-800 hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            id="add-medicine-btn"
          >
            <Plus size={16} />
            Add New Item
          </button>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[200px]">
                  <button 
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1 hover:text-slate-800 cursor-pointer"
                  >
                    Medicine / Salt composition
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3 px-4">Mfg / Batch</th>
                <th className="py-3 px-4">Pack</th>
                <th className="py-3 px-4">Buy Price</th>
                <th className="py-3 px-4">Sell Price (MRP)</th>
                <th className="py-3 px-4">Wholesale Price</th>
                <th className="py-3 px-4">
                  <button 
                    onClick={() => toggleSort('stock')}
                    className="flex items-center gap-1 hover:text-slate-800 cursor-pointer"
                  >
                    Stock Qty
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button 
                    onClick={() => toggleSort('expiry')}
                    className="flex items-center gap-1 hover:text-slate-800 cursor-pointer"
                  >
                    Expiry
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No medicines found. Change filter parameters or add a new medicine!
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med) => {
                  const expiryStatus = getExpiryStatus(med.expiryDate);
                  const isLowStock = med.stock <= med.minStockAlert;

                  return (
                    <tr 
                      key={med.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isLowStock ? 'bg-rose-50/10' : ''
                      }`}
                    >
                      {/* Medicine Info */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{med.name}</span>
                            {med.shelfNo && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                Rack: {med.shelfNo}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                            <Beaker size={11} className="text-slate-400" />
                            {med.formula}
                          </div>
                        </div>
                      </td>

                      {/* Manufacturer & Batch */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-700 block">{med.manufacturer}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Batch: {med.batchNo}</span>
                      </td>

                      {/* Packing */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {med.packing}
                      </td>

                      {/* Prices */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        ₹{med.buyPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{med.sellingPrice.toFixed(2)}
                        <span className="text-[10px] text-teal-600 font-medium block">GST {med.gstRate}%</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-800">
                        ₹{med.wholesalePrice.toFixed(2)}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${
                            isLowStock ? 'text-rose-600' : 'text-slate-800'
                          }`}>
                            {med.stock}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <AlertTriangle size={10} />
                              Reorder
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Min level: {med.minStockAlert}</span>
                      </td>

                      {/* Expiry status */}
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-semibold text-slate-700 block font-mono">
                          {med.expiryDate || 'N/A'}
                        </span>
                        {expiryStatus && (
                          <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-sm block mt-1 w-max ${expiryStatus.color}`}>
                            {expiryStatus.label}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditForm(med)}
                            className="p-1.5 hover:bg-blue-50 text-blue-700 hover:text-blue-900 rounded transition-colors cursor-pointer"
                            title="Edit Stock Details"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${med.name}?`)) {
                                onDeleteMedicine(med.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Slide-over Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Package className="text-blue-800" size={20} />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingMedicine ? `Edit: ${editingMedicine.name}` : 'Add New Medicine Stock'}
                </h3>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Row 1: Brand name & salt composition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Medicine Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 650 (Dolo)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Formula / Salt Composition *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol IP 650mg"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Row 2: Batch, Expiry, Pack, Mfg */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL24109"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="month"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Packing (Unit)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Tabs, 100ml"
                    value={packing}
                    onChange={(e) => setPacking(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cipla Ltd"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Row 3: Pricing & Taxation */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Buy Price (Cost) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(e.target.value)}
                      className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Retail Price (MRP) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Wholesale Price *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    GST Rate % (Default 5%)
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="0">0% (Exempted)</option>
                    <option value="5">5% (Surgical/Medicines)</option>
                    <option value="12">12% (Devices)</option>
                    <option value="18">18% (Cosmetics/Allied)</option>
                    <option value="28">28% (Luxuries)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Stocks, Alerts & Rack Shelf Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Quantity in units"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Min Stock Reorder Alert
                  </label>
                  <input
                    type="number"
                    placeholder="Alert threshold"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Shelf/Rack Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-3, Drawer 2"
                    value={shelfNo}
                    onChange={(e) => setShelfNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Bottom buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-800 hover:bg-blue-900 text-white font-bold px-5 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <FileCheck size={16} />
                  {editingMedicine ? 'Update Database' : 'Add to Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Preview & Confirm Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck className="text-emerald-700" size={20} />
                <h3 className="text-lg font-bold text-slate-900">
                  Excel Import Stock Preview
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreviewList([]);
                  setImportErrors([]);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Ready to Import: <span className="text-emerald-700 text-base font-black">{importPreviewList.length} Items</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Please review the parsed rows before confirming. Duplicate names will be added as new batches/items in the catalog.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-100 transition-all cursor-pointer whitespace-nowrap"
                  title="Download correct format template"
                >
                  <Download size={13} />
                  Download Sample Excel
                </button>
              </div>

              {/* Error logs if any */}
              {importErrors.length > 0 && (
                <div className="bg-rose-50 text-rose-800 p-3.5 rounded-lg border border-rose-200 text-xs space-y-1 max-h-32 overflow-y-auto">
                  <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-rose-700">
                    <AlertTriangle size={12} />
                    Import Warnings ({importErrors.length})
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-200/60 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                        <th className="py-2.5 px-4">No.</th>
                        <th className="py-2.5 px-4">Medicine Name</th>
                        <th className="py-2.5 px-4">Composition</th>
                        <th className="py-2.5 px-4">Batch / Exp</th>
                        <th className="py-2.5 px-4">Pack</th>
                        <th className="py-2.5 px-4">Buy / Sell</th>
                        <th className="py-2.5 px-4">Wholesale</th>
                        <th className="py-2.5 px-4 text-center">Stock</th>
                        <th className="py-2.5 px-4">Shelf No</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {importPreviewList.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-mono text-slate-400">{index + 1}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{item.name}</td>
                          <td className="py-2.5 px-4 text-slate-500 max-w-[150px] truncate" title={item.formula}>{item.formula}</td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className="font-mono bg-slate-100 text-slate-700 px-1 rounded text-[10px] mr-1">{item.batchNo}</span>
                            <span className="font-mono text-slate-500">{item.expiryDate}</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{item.packing}</td>
                          <td className="py-2.5 px-4 font-semibold whitespace-nowrap">
                            <span className="text-slate-400">₹{item.buyPrice.toFixed(2)}</span> / <span className="text-slate-800 font-bold">₹{item.sellingPrice.toFixed(2)}</span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-indigo-700">₹{item.wholesalePrice.toFixed(2)}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-800 text-center">{item.stock}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">{item.shelfNo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreviewList([]);
                  setImportErrors([]);
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Check size={16} />
                Save & Import {importPreviewList.length} Items
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
