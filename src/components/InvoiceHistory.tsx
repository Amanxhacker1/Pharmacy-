import React, { useState, useMemo } from 'react';
import { Invoice } from '../types';
import { 
  Search, 
  Eye, 
  Printer, 
  Trash2, 
  Calendar, 
  Tag, 
  FileText, 
  IndianRupee, 
  X,
  TrendingDown
} from 'lucide-react';

interface InvoiceHistoryProps {
  invoices: Invoice[];
  onDeleteInvoice: (id: string) => void;
  onSelectInvoiceToPrint: (invoice: Invoice) => void;
}

export default function InvoiceHistory({
  invoices,
  onDeleteInvoice,
  onSelectInvoiceToPrint
}: InvoiceHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [billingTypeFilter, setBillingTypeFilter] = useState<'All' | 'Retail' | 'Wholesale'>('All');
  const [paymentModeFilter, setPaymentModeFilter] = useState<'All' | 'Cash' | 'UPI' | 'Card' | 'Credit'>('All');
  
  // Selected Invoice for showing local detail modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const matchSearch = 
          inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.customerMobile.includes(searchTerm);

        const matchType = billingTypeFilter === 'All' || inv.billingType === billingTypeFilter;
        const matchPayMode = paymentModeFilter === 'All' || inv.paymentMode === paymentModeFilter;

        return matchSearch && matchType && matchPayMode;
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Newest first
  }, [invoices, searchTerm, billingTypeFilter, paymentModeFilter]);

  return (
    <div className="space-y-6" id="history-tab">
      {/* Filters Dashboard */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-lg w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search invoice by Number, Customer Name or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm placeholder-slate-400"
            id="invoice-history-search"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          {/* Billing Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type:</span>
            <select
              value={billingTypeFilter}
              onChange={(e: any) => setBillingTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="All">All Invoices</option>
              <option value="Retail">Retail Only</option>
              <option value="Wholesale">Wholesale Only</option>
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment:</span>
            <select
              value={paymentModeFilter}
              onChange={(e: any) => setPaymentModeFilter(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="All">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Credit">Credit (Udhaar)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name / Mobile</th>
                <th className="py-3 px-4">Billing Type</th>
                <th className="py-3 px-4">Payment mode</th>
                <th className="py-3 px-4 text-right">Medicines count</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No matching generated invoices found in local archives.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Invoice Number */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{inv.invoiceNo}</span>
                      {inv.customerGSTIN && (
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 mt-0.5 inline-block font-mono font-bold">
                          GSTIN: {inv.customerGSTIN}
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {inv.date}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{inv.customerName}</span>
                      <span className="text-xs text-slate-400 block mt-0.5">{inv.customerMobile || 'No contact'}</span>
                    </td>

                    {/* Type tag */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        inv.billingType === 'Retail' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {inv.billingType}
                      </span>
                    </td>

                    {/* Pay Mode */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        inv.paymentMode === 'Credit' 
                          ? 'bg-rose-50 text-rose-700 font-bold border border-rose-100' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {inv.paymentMode}
                      </span>
                    </td>

                    {/* Qty Count */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-600">
                      {inv.items.reduce((acc, it) => acc + it.qty, 0)} units ({inv.items.length} meds)
                    </td>

                    {/* Grand Total */}
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono">
                      ₹{inv.grandTotal.toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Action */}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded transition-colors cursor-pointer"
                          title="View Invoice Details"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Print Action */}
                        <button
                          onClick={() => onSelectInvoiceToPrint(inv)}
                          className="p-1.5 hover:bg-blue-50 text-blue-700 hover:text-blue-950 rounded transition-colors cursor-pointer"
                          title="Print/Download GST Bill"
                        >
                          <Printer size={16} />
                        </button>

                        {/* Delete Action */}
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to void/delete Invoice ${inv.invoiceNo}? This cannot be undone.`)) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded transition-colors cursor-pointer"
                          title="Void Bill"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Item Details Dialog Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-800" size={20} />
                <h3 className="font-bold text-slate-950">
                  Bill Detail: {selectedInvoice.invoiceNo}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200/50">
                <div>
                  <span className="text-slate-400 block font-medium">Customer/Patient Name</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5">{selectedInvoice.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Mobile Number</span>
                  <span className="font-bold text-slate-800 block mt-0.5 font-mono">{selectedInvoice.customerMobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Invoice Date / Type</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {selectedInvoice.date} ({selectedInvoice.billingType})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Payment Mode</span>
                  <span className="font-bold text-slate-800 block mt-0.5 uppercase tracking-wider">{selectedInvoice.paymentMode}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Itemized Medicines Breakdown</span>
                <div className="border border-slate-150 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-600">
                        <th className="py-2.5 px-3">Medicine Brand</th>
                        <th className="py-2.5 px-3">Formula / Salt</th>
                        <th className="py-2.5 px-3">Batch / Exp</th>
                        <th className="py-2.5 px-3 text-right">Price (₹)</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Disc%</th>
                        <th className="py-2.5 px-3 text-right">GST%</th>
                        <th className="py-2.5 px-3 text-right">Grand Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{item.name}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono italic">{item.formula}</td>
                          <td className="py-2.5 px-3 font-mono text-[10px]">
                            B: {item.batchNo} | E: {item.expiryDate}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">₹{item.price.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-700">{item.qty} {item.packing}</td>
                          <td className="py-2.5 px-3 text-right text-rose-600 font-mono">
                            {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-teal-600 font-mono">{item.gstRate}%</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax Splitting Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/50 text-xs space-y-2">
                  <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Tax & Discounts Box</span>
                  <div className="flex justify-between text-slate-600">
                    <span>Aggregate GST collected (CGST + SGST):</span>
                    <span className="font-bold text-teal-700 font-mono">₹{selectedInvoice.totalGST.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-mono pl-3 text-[11px]">
                    <span>- Central GST (CGST 2.5%):</span>
                    <span>₹{(selectedInvoice.totalGST / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-mono pl-3 text-[11px]">
                    <span>- State GST (SGST 2.5%):</span>
                    <span>₹{(selectedInvoice.totalGST / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-2">
                    <span>Trade Discount allowed:</span>
                    <span className="font-bold text-rose-600 font-mono">₹{selectedInvoice.totalDiscount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-blue-900 text-white p-4 rounded-lg flex flex-col justify-between">
                  <div className="flex justify-between text-sm text-blue-200">
                    <span>Payment terms:</span>
                    <span className="font-bold uppercase tracking-wider text-xs">{selectedInvoice.paymentMode}</span>
                  </div>
                  <div className="mt-4 flex justify-between items-end border-t border-blue-800 pt-3">
                    <span className="text-sm font-semibold">Net Received Amount:</span>
                    <span className="text-2xl font-black font-mono text-teal-300">
                      ₹{selectedInvoice.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="bg-slate-50 p-3 rounded-lg text-xs italic text-slate-600 border-l-4 border-slate-300">
                  <span className="font-bold text-slate-700 block not-italic uppercase tracking-wider text-[10px] mb-1">Remarks:</span>
                  "{selectedInvoice.notes}"
                </div>
              )}
            </div>

            {/* Print Footer Action */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectInvoiceToPrint(selectedInvoice);
                  setSelectedInvoice(null);
                }}
                className="bg-blue-800 hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Printer size={14} />
                Open GST Print Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
