import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Medicine, Invoice, InvoiceItem } from '../types';
import { 
  Plus, 
  Trash2, 
  IndianRupee, 
  User, 
  Smartphone, 
  Percent, 
  AlertCircle, 
  Check, 
  Search, 
  ToggleLeft, 
  ToggleRight, 
  Save, 
  Printer, 
  ReceiptIndianRupee
} from 'lucide-react';

interface BillingSystemProps {
  medicines: Medicine[];
  invoices: Invoice[];
  onSaveInvoice: (invoice: Invoice) => void;
  onSelectInvoiceToPrint: (invoice: Invoice) => void;
}

export default function BillingSystem({
  medicines,
  invoices,
  onSaveInvoice,
  onSelectInvoiceToPrint
}: BillingSystemProps) {
  // Mode selection: Wholesale or Retail
  const [billingType, setBillingType] = useState<'Retail' | 'Wholesale'>('Retail');
  
  // Invoice Header States
  const [invoiceNo, setInvoiceNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerGSTIN, setCustomerGSTIN] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Credit'>('Cash');
  const [notes, setNotes] = useState('');

  // Item Search & Select States
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  
  // Quantity and discounts for the currently selected medicine before adding to bill
  const [qty, setQty] = useState<number>(1);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customPrice, setCustomPrice] = useState<string>('');

  // Items added to the current active invoice
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Refs for focusing inputs quickly
  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate invoice number based on latest invoices
  useEffect(() => {
    const prefix = billingType === 'Wholesale' ? 'WS-2026-' : 'RT-2026-';
    const count = invoices.filter(inv => inv.billingType === billingType).length + 1;
    const paddedCount = count.toString().padStart(4, '0');
    setInvoiceNo(`${prefix}${paddedCount}`);
  }, [billingType, invoices]);

  // Handle billing type toggle to reset/adjust active prices of items
  const handleBillingTypeChange = (type: 'Retail' | 'Wholesale') => {
    setBillingType(type);
    setSelectedMedicine(null);
    setSearchQuery('');
    setItems([]); // Clear draft items on mode swap to prevent tax/price contamination
  };

  // Medicine Search Dropdown List
  const searchedMedicines = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return medicines.filter(med => 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.formula.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [medicines, searchQuery]);

  // Handle select medicine from dropdown
  const handleSelectMedicine = (med: Medicine) => {
    setSelectedMedicine(med);
    setSearchQuery(med.name);
    setIsDropdownOpen(false);
    
    // Auto-populate price based on billing mode
    const defaultPrice = billingType === 'Retail' ? med.sellingPrice : med.wholesalePrice;
    setCustomPrice(defaultPrice.toString());
    setQty(1);
    setDiscountPercent(0);

    // Auto focus quantity input
    setTimeout(() => {
      qtyInputRef.current?.focus();
    }, 50);
  };

  // Calculate detailed item metrics (Base price, GST amount, Discount, Total)
  // Retail is Inclusive of GST, Wholesale is Exclusive of GST (standard Marg ERP style)
  const calculateItemMetrics = (med: Medicine, quantity: number, priceValue: number, discPercent: number) => {
    const rawSubtotal = priceValue * quantity;
    const discountAmt = rawSubtotal * (discPercent / 100);
    const subtotalAfterDiscount = rawSubtotal - discountAmt;

    let basePricePerUnit = 0;
    let gstAmt = 0;
    let totalLineVal = 0;

    if (billingType === 'Retail') {
      // Inclusive of GST
      // MRP = Base + GST
      // Base = MRP / (1 + gstRate/100)
      const discountedMRP = priceValue - (priceValue * (discPercent / 100));
      const baseUnit = discountedMRP / (1 + med.gstRate / 100);
      basePricePerUnit = baseUnit;
      gstAmt = (discountedMRP - baseUnit) * quantity;
      totalLineVal = discountedMRP * quantity;
    } else {
      // Wholesale: Exclusive of GST
      // Total = (Price - Disc) + GST
      const discountedBase = priceValue - (priceValue * (discPercent / 100));
      basePricePerUnit = discountedBase;
      gstAmt = (discountedBase * (med.gstRate / 100)) * quantity;
      totalLineVal = (discountedBase * quantity) + gstAmt;
    }

    return {
      basePrice: basePricePerUnit,
      gstAmount: gstAmt,
      discountAmount: discountAmt,
      total: totalLineVal
    };
  };

  // Add Item to Bill List
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine) return;

    if (qty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    // Check if item already exists in bill
    const existingIndex = items.findIndex(item => item.medicineId === selectedMedicine.id);
    const inputPrice = parseFloat(customPrice) || 0;

    if (existingIndex > -1) {
      // Update existing item
      const updatedItems = [...items];
      const existingItem = updatedItems[existingIndex];
      const newQty = existingItem.qty + qty;

      // Validate stock levels
      if (newQty > selectedMedicine.stock) {
        alert(`Warning: Requested quantity (${newQty}) exceeds available stock (${selectedMedicine.stock}) for ${selectedMedicine.name}`);
      }

      const metrics = calculateItemMetrics(selectedMedicine, newQty, inputPrice, discountPercent);
      
      updatedItems[existingIndex] = {
        ...existingItem,
        qty: newQty,
        price: inputPrice,
        discountPercent: discountPercent,
        gstAmount: metrics.gstAmount,
        discountAmount: metrics.discountAmount,
        total: metrics.total
      };
      setItems(updatedItems);
    } else {
      // Add fresh line item
      if (qty > selectedMedicine.stock) {
        alert(`Warning: Requested quantity (${qty}) exceeds available stock (${selectedMedicine.stock})`);
      }

      const metrics = calculateItemMetrics(selectedMedicine, qty, inputPrice, discountPercent);

      const newItem: InvoiceItem = {
        medicineId: selectedMedicine.id,
        name: selectedMedicine.name,
        formula: selectedMedicine.formula,
        batchNo: selectedMedicine.batchNo,
        expiryDate: selectedMedicine.expiryDate,
        packing: selectedMedicine.packing,
        qty: qty,
        price: inputPrice,
        gstRate: selectedMedicine.gstRate,
        discountPercent: discountPercent,
        gstAmount: metrics.gstAmount,
        discountAmount: metrics.discountAmount,
        total: metrics.total
      };
      setItems([...items, newItem]);
    }

    // Reset Item Fields for next search
    setSelectedMedicine(null);
    setSearchQuery('');
    setCustomPrice('');
    setQty(1);
    setDiscountPercent(0);
    searchInputRef.current?.focus();
  };

  // Remove Item from Bill List
  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  // Dynamically compute invoice-wide footer totals
  const invoiceTotals = useMemo(() => {
    let subTotal = 0; // Cumulative pre-tax, pre-discount lines depending on modes
    let totalGST = 0;
    let totalDiscount = 0;
    let grandTotal = 0;

    items.forEach(item => {
      grandTotal += item.total;
      totalGST += item.gstAmount;
      totalDiscount += item.discountAmount;
      
      if (billingType === 'Retail') {
        // Retail inclusive subtotal
        subTotal += (item.price * item.qty);
      } else {
        // Wholesale exclusive subtotal
        subTotal += (item.price * item.qty);
      }
    });

    return {
      subTotal,
      totalGST,
      totalDiscount,
      grandTotal
    };
  }, [items, billingType]);

  // Save the invoice to database & clear
  const handleSaveInvoice = (printAfterSave: boolean) => {
    if (!customerName.trim()) {
      alert("Please enter Customer / Patient Name.");
      return;
    }

    if (items.length === 0) {
      alert("Cannot generate an empty invoice. Add some medicines first!");
      return;
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNo,
      date: new Date().toISOString().split('T')[0],
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      customerGSTIN: billingType === 'Wholesale' ? customerGSTIN.toUpperCase().trim() : undefined,
      billingType,
      paymentMode,
      items,
      subTotal: invoiceTotals.subTotal,
      totalGST: invoiceTotals.totalGST,
      totalDiscount: invoiceTotals.totalDiscount,
      grandTotal: invoiceTotals.grandTotal,
      notes: notes.trim() || undefined
    };

    // Save
    onSaveInvoice(newInvoice);

    // If print chosen
    if (printAfterSave) {
      onSelectInvoiceToPrint(newInvoice);
    } else {
      alert(`Invoice ${invoiceNo} generated successfully!`);
    }

    // Reset Billing UI
    setCustomerName('');
    setCustomerMobile('');
    setCustomerGSTIN('');
    setNotes('');
    setItems([]);
    setSelectedMedicine(null);
    setSearchQuery('');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="billing-workspace">
      {/* Primary Bill Items & Entry (Col-span 2) */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Invoice Header Settings */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ReceiptIndianRupee className="text-blue-800" size={20} />
              <h3 className="font-bold text-slate-900 text-base">Invoicing Workstation</h3>
            </div>
            
            {/* Wholesale vs Retail Toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${billingType === 'Retail' ? 'text-blue-800' : 'text-slate-400'}`}>Retail Mode</span>
              <button
                onClick={() => handleBillingTypeChange(billingType === 'Retail' ? 'Wholesale' : 'Retail')}
                className="text-blue-800 hover:text-blue-900 focus:outline-hidden cursor-pointer"
                id="billing-mode-toggle"
              >
                {billingType === 'Retail' ? (
                  <ToggleLeft size={34} className="text-slate-400" />
                ) : (
                  <ToggleRight size={34} className="text-blue-800" />
                )}
              </button>
              <span className={`text-xs font-bold ${billingType === 'Wholesale' ? 'text-indigo-800' : 'text-slate-400'}`}>Wholesale Mode</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Number</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-800 bg-slate-50 focus:ring-1 focus:ring-blue-600"
                id="invoice-no-input"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {billingType === 'Wholesale' ? 'Buyer / Party Name *' : 'Patient / Customer Name *'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400"><User size={14} /></span>
                <input
                  type="text"
                  placeholder={billingType === 'Wholesale' ? "e.g. Apollo Pharmacy" : "e.g. Rahul Kumar"}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-600 font-semibold"
                  id="customer-name-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Mobile</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400"><Smartphone size={14} /></span>
                <input
                  type="tel"
                  placeholder="10 digit Mobile"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-600"
                  id="customer-mobile-input"
                />
              </div>
            </div>
            {billingType === 'Wholesale' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Buyer GSTIN</label>
                <input
                  type="text"
                  placeholder="15-digit GSTIN"
                  value={customerGSTIN}
                  onChange={(e) => setCustomerGSTIN(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono text-slate-800 uppercase focus:ring-1 focus:ring-blue-600"
                  id="customer-gstin-input"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e: any) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-600"
                >
                  <option value="Cash">Cash (Standard)</option>
                  <option value="UPI">UPI / GPay / Paytm</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Credit">Credit / Udhaar</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Item Interactive Search Bar */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <form onSubmit={handleAddItem} className="space-y-4">
            <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-2">Search & Add Medicine to Bill (F2)</span>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Dropdown search container (Col-span 5) */}
              <div className="md:col-span-5 relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Medicine Search</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400"><Search size={14} /></span>
                  <input
                    type="text"
                    ref={searchInputRef}
                    placeholder="Type brand name or salt formula..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-600 font-semibold"
                    id="med-billing-search"
                  />
                </div>

                {/* Dropdown Suggestions */}
                {isDropdownOpen && searchQuery.trim() && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-30 divide-y divide-slate-100">
                    {searchedMedicines.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center font-medium">No pharmacy match found</div>
                    ) : (
                      searchedMedicines.map((med) => {
                        const isOut = med.stock <= 0;
                        const defaultPrice = billingType === 'Retail' ? med.sellingPrice : med.wholesalePrice;
                        return (
                          <div
                            key={med.id}
                            onClick={() => !isOut && handleSelectMedicine(med)}
                            className={`p-3 text-left transition-colors flex items-center justify-between cursor-pointer ${
                              isOut ? 'opacity-40 bg-slate-50 cursor-not-allowed' : 'hover:bg-blue-50/50'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 text-sm truncate block">{med.name}</span>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono shrink-0">{med.packing}</span>
                              </div>
                              <span className="text-xs text-slate-500 font-medium truncate block mt-0.5 font-mono">Composition: {med.formula}</span>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                                <span>Batch: {med.batchNo}</span>
                                <span>|</span>
                                <span>Exp: {med.expiryDate}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-slate-900 block">₹{defaultPrice.toFixed(2)}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full block mt-1 ${
                                isOut ? 'bg-rose-100 text-rose-800' : med.stock <= med.minStockAlert ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                              }`}>
                                {isOut ? 'No Stock' : `Stock: ${med.stock}`}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Price (Col-span 2) */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Price (₹) {billingType === 'Retail' ? 'MRP' : 'WS'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Price"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-800 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Quantity (Col-span 2) */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                <input
                  type="number"
                  ref={qtyInputRef}
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                  placeholder="Qty"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-1 focus:ring-blue-600"
                  id="billing-qty-input"
                />
              </div>

              {/* Discount % (Col-span 1) */}
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Disc%</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono text-slate-800 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Add Button (Col-span 2) */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={!selectedMedicine}
                  className={`w-full py-2 font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    selectedMedicine 
                      ? 'bg-blue-800 hover:bg-blue-900 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                  id="add-item-to-bill-btn"
                >
                  <Plus size={14} />
                  Add Item
                </button>
              </div>
            </div>
            
            {/* Display Selected Item Specs */}
            {selectedMedicine && (
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/60 flex flex-wrap gap-4 text-xs">
                <div><span className="text-slate-400 font-medium">Batch:</span> <span className="font-bold text-slate-700 font-mono">{selectedMedicine.batchNo}</span></div>
                <div><span className="text-slate-400 font-medium">Expiry:</span> <span className="font-bold text-slate-700 font-mono">{selectedMedicine.expiryDate}</span></div>
                <div><span className="text-slate-400 font-medium">GST Rate:</span> <span className="font-bold text-slate-700 font-mono">{selectedMedicine.gstRate}% (Includes SGST + CGST)</span></div>
                <div><span className="text-slate-400 font-medium">Current Stock:</span> <span className="font-bold text-teal-700 font-mono">{selectedMedicine.stock} units</span></div>
                <div><span className="text-slate-400 font-medium">Salt / Composition:</span> <span className="font-bold text-slate-700 italic">{selectedMedicine.formula}</span></div>
              </div>
            )}
          </form>
        </div>

        {/* Invoice Draft Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Items Draft</span>
            <span className="text-xs bg-slate-200/80 text-slate-700 font-bold px-2.5 py-1 rounded font-mono">
              Lines Added: {items.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Medicine Brand Name / Salt Formula</th>
                  <th className="py-2.5 px-4">Batch / Exp</th>
                  <th className="py-2.5 px-4 text-right">Price</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Disc%</th>
                  <th className="py-2.5 px-4 text-right">GST%</th>
                  <th className="py-2.5 px-4 text-right">Total (INR)</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No medicines in bill yet. Type above to search & add medicines.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block text-sm">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium font-mono truncate block mt-0.5">{item.formula}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-600">
                        <span className="block font-bold">B: {item.batchNo}</span>
                        <span className="block mt-0.5">E: {item.expiryDate}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">
                        {item.qty}
                        <span className="text-[9px] text-slate-400 block font-normal font-mono">{item.packing}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {item.discountPercent}%
                        {item.discountAmount > 0 && <span className="text-[9px] text-rose-500 block">-₹{item.discountAmount.toFixed(1)}</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {item.gstRate}%
                        <span className="text-[9px] text-teal-600 block">₹{item.gstAmount.toFixed(1)}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{item.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Checkout Sidebar Panel (Col-span 1) */}
      <div className="space-y-6">
        {/* Bill Calculations & Save Panel */}
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">POS Bill Calculation</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              billingType === 'Retail' ? 'bg-blue-500/20 text-blue-300' : 'bg-indigo-500/20 text-indigo-300'
            }`}>
              {billingType} Invoice
            </span>
          </div>

          <div className="space-y-3 text-sm">
            {/* Raw Subtotal */}
            <div className="flex items-center justify-between text-slate-400">
              <span>Gross Total:</span>
              <span className="font-mono font-medium text-slate-200">
                ₹{invoiceTotals.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Total Discount */}
            <div className="flex items-center justify-between text-slate-400">
              <span>Discount Allowed:</span>
              <span className="font-mono font-semibold text-rose-400">
                -₹{invoiceTotals.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Total CGST/SGST Breakdown */}
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                GST (Incl. CGST+SGST):
              </span>
              <span className="font-mono font-semibold text-teal-400">
                +₹{invoiceTotals.totalGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* CGST / SGST split-box */}
            {invoiceTotals.totalGST > 0 && (
              <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>CGST Split (2.5%):</span>
                  <span>₹{(invoiceTotals.totalGST / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST Split (2.5%):</span>
                  <span>₹{(invoiceTotals.totalGST / 2).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="border-t border-slate-800 my-4 pt-4" />

            {/* GRAND TOTAL */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-300">Net Payable Amount:</span>
              <span className="text-2xl font-black text-teal-400 font-mono flex items-center">
                <IndianRupee size={20} />
                {invoiceTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Terms or Notes */}
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-400 font-semibold uppercase">Invoice Remarks / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Prescribed by Dr. Mehta"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              id="invoice-notes-input"
            />
          </div>

          {/* Credit Account Warning in case payment is credit */}
          {billingType === 'Wholesale' && (
            <div className="space-y-2">
              <label className="block text-[11px] text-slate-400 font-semibold uppercase">Wholesale Credit Terms</label>
              <select
                value={paymentMode}
                onChange={(e: any) => setPaymentMode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 bg-white/5"
              >
                <option value="Cash">Cash Sale</option>
                <option value="UPI">UPI Digital Payment</option>
                <option value="Card">Card Swipe Payment</option>
                <option value="Credit">Debit Credit Term (Udhaar)</option>
              </select>
            </div>
          )}

          {/* Checkout Action triggers */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => handleSaveInvoice(true)}
              className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-slate-950 font-extrabold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              id="save-and-print-invoice-btn"
            >
              <Printer size={16} />
              Save & Print Bill (F8)
            </button>
            <button
              onClick={() => handleSaveInvoice(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700/80 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              id="save-invoice-only-btn"
            >
              <Save size={14} />
              Save Record Only (F10)
            </button>
          </div>
        </div>

        {/* Low Stock Warning Panel if items are selected */}
        {selectedMedicine && selectedMedicine.stock <= selectedMedicine.minStockAlert && (
          <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div className="text-xs">
              <span className="font-bold block">Critically Low Stock</span>
              Only {selectedMedicine.stock} units of {selectedMedicine.name} remain in stock. Please coordinate reorder in Medicine Manager.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
