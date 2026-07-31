import React, { useEffect, useMemo } from 'react';
import { Invoice, BusinessProfile } from '../types';
import { Printer, X, ShieldAlert, CheckCircle } from 'lucide-react';

interface InvoicePrintViewProps {
  invoice: Invoice | null;
  businessProfile: BusinessProfile;
  onClose: () => void;
}

export default function InvoicePrintView({
  invoice,
  businessProfile,
  onClose
}: InvoicePrintViewProps) {
  if (!invoice) return null;

  // Real-time calculation of tax totals for print receipt
  const taxesDetails = useMemo(() => {
    let cgstTotal = invoice.totalGST / 2;
    let sgstTotal = invoice.totalGST / 2;
    return {
      cgstTotal,
      sgstTotal
    };
  }, [invoice]);

  // Number to Words converter (simple Indian Rupees version) for professional billing compliance
  const priceToWords = (num: number) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const numToWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + numToWords(n % 100);
      if (n < 100000) return numToWords(Math.floor(n / 1000)) + 'Thousand ' + numToWords(n % 1000);
      if (n < 10000000) return numToWords(Math.floor(n / 100000)) + 'Lakh ' + numToWords(n % 100000);
      return '';
    };

    const rounded = Math.round(num);
    if (rounded === 0) return 'Zero Rupees Only';
    return numToWords(rounded) + 'Rupees Only';
  };

  // Automated print window trigger helper
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-50 p-2 overflow-y-auto print:p-0 print:bg-white print:absolute print:inset-0">
      {/* Outer print container */}
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[95vh] overflow-y-auto flex flex-col print:shadow-none print:border-none print:max-h-none print:rounded-none">
        
        {/* Print controls bar - hidden in print mode! */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">GST Tax Bill Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Printer size={14} />
              Print Invoice (Ctrl+P)
            </button>
            <button
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <X size={14} />
              Close
            </button>
          </div>
        </div>

        {/* INVOICE CONTENT AREA (Beautiful structured design with high print-css precision) */}
        <div className="p-8 md:p-10 text-slate-800 space-y-6 print:p-4 print:text-black" id="printable-area">
          {/* Main Title & Address Block */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-slate-500 font-extrabold uppercase tracking-widest text-[10px] block mb-1">
                {invoice.billingType === 'Wholesale' ? 'TAX INVOICE (WHOLESALE)' : 'RETAIL CASH MEMO'}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 print:text-black">
                {businessProfile.name}
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 max-w-md font-medium leading-relaxed">
                {businessProfile.address}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2 font-mono">
                <span>Ph: {businessProfile.phone}</span>
                <span>|</span>
                <span>Email: {businessProfile.email}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs font-mono space-y-1.5 min-w-[240px] md:text-right print:bg-white print:border-slate-300">
              <div className="flex justify-between md:justify-end md:gap-4">
                <span className="text-slate-400 font-semibold uppercase">GSTIN:</span>
                <span className="font-bold text-slate-800">{businessProfile.gstin}</span>
              </div>
              <div className="flex justify-between md:justify-end md:gap-4">
                <span className="text-slate-400 font-semibold uppercase">Drug Lic No:</span>
                <span className="font-bold text-slate-800">{businessProfile.drugLicenseNo}</span>
              </div>
              <div className="flex justify-between md:justify-end md:gap-4 border-t border-slate-200 pt-1.5 mt-1.5">
                <span className="text-slate-400 font-semibold uppercase">Invoice Date:</span>
                <span className="font-bold text-slate-900">{invoice.date}</span>
              </div>
            </div>
          </div>

          {/* Billing metadata grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-5">
            {/* Invoice Meta */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Billing Particulars</span>
              <div className="grid grid-cols-2 gap-y-1.5 font-mono">
                <span className="text-slate-500">Invoice No:</span>
                <span className="font-bold text-slate-950 text-sm">{invoice.invoiceNo}</span>

                <span className="text-slate-500">Payment Term:</span>
                <span className="font-bold text-slate-800 uppercase">{invoice.paymentMode}</span>

                <span className="text-slate-500">Bill Type:</span>
                <span className="font-bold text-slate-800">{invoice.billingType} Trade</span>
              </div>
            </div>

            {/* Buyer Meta */}
            <div className="space-y-2 md:border-l md:pl-6 border-slate-200">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Billed To (Party Details)</span>
              <div className="grid grid-cols-1 gap-1">
                <span className="font-bold text-sm text-slate-900">{invoice.customerName}</span>
                {invoice.customerMobile && <span className="font-mono text-slate-500">Mobile: +91 {invoice.customerMobile}</span>}
                {invoice.customerGSTIN && (
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-indigo-900 w-max mt-1 print:bg-white print:border print:border-slate-300">
                    GSTIN: {invoice.customerGSTIN}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="space-y-2">
            <table className="w-full text-left text-xs border border-slate-300 print:border-slate-400">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300 uppercase tracking-wider print:bg-white">
                  <th className="py-2.5 px-3 border-r border-slate-200">S.N.</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Medicine Name / Salt Formula</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Packing</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Batch No</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Expiry</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-200">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-200">Qty</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-200">Disc%</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-200">GST%</th>
                  <th className="py-2.5 px-3 text-right">Net Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium font-mono">
                {invoice.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/20">
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center">{index + 1}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-sans">
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-[10px] text-slate-500 italic block mt-0.5">{item.formula}</span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700">{item.packing}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-800">{item.batchNo}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600">{item.expiryDate}</td>
                    <td className="py-2.5 px-3 text-right border-r border-slate-200">₹{item.price.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right border-r border-slate-200 font-bold text-slate-900">{item.qty}</td>
                    <td className="py-2.5 px-3 text-right border-r border-slate-200 text-rose-600">{item.discountPercent > 0 ? `${item.discountPercent}%` : '0%'}</td>
                    <td className="py-2.5 px-3 text-right border-r border-slate-200 text-teal-700">{item.gstRate}%</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-950">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer calculation breakdown & Tax splits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left box: T&C + Words representation */}
            <div className="space-y-4">
              <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200/50 print:bg-white print:border-slate-300">
                <span className="font-bold text-slate-700 uppercase tracking-wider block text-[9px] mb-1">Standard Pharmacy Declarations</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Medicines once sold cannot be returned or exchanged.</li>
                  <li>Verify brand, batch, and expiry before taking delivery.</li>
                  <li>Prescription is mandatory for Schedule H / H1 drugs.</li>
                  <li>Store medicines in a cool, dry place.</li>
                </ul>
              </div>

              <div className="text-xs font-medium">
                <span className="text-slate-400 uppercase tracking-wider text-[9px] block mb-1">Total in Words</span>
                <span className="font-bold text-slate-900 font-sans italic">{priceToWords(invoice.grandTotal)}</span>
              </div>
            </div>

            {/* Right box: Net totals, discount totals, GST aggregates */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 text-xs font-mono space-y-2.5 print:bg-white print:border-slate-300">
              <div className="flex justify-between text-slate-500">
                <span>Gross Value Subtotal:</span>
                <span className="font-bold text-slate-800">₹{invoice.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Trade Discounts Allowed:</span>
                <span className="font-bold text-rose-600">-₹{invoice.totalDiscount.toFixed(2)}</span>
              </div>
              
              {/* SGST / CGST specific splitted items */}
              <div className="border-t border-dashed border-slate-300 my-1 pt-1.5 space-y-1 text-slate-500 text-[11px]">
                <div className="flex justify-between pl-3">
                  <span>Central CGST (2.5% of taxable base):</span>
                  <span>+₹{taxesDetails.cgstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pl-3">
                  <span>State SGST (2.5% of taxable base):</span>
                  <span>+₹{taxesDetails.sgstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-1.5">
                  <span>Cumulative GST (5% Default):</span>
                  <span>₹{invoice.totalGST.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-end">
                <span className="text-sm font-bold text-slate-950 font-sans uppercase">NET PAYABLE AMOUNT:</span>
                <span className="text-xl font-black text-slate-950">₹{invoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signature placeholders */}
          <div className="pt-12 flex justify-between items-center text-xs text-slate-600">
            <div className="text-center">
              <div className="w-40 border-b border-slate-300 mb-2"></div>
              <span>Customer / Receiver's Signature</span>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-800 mb-10">for {businessProfile.name}</div>
              <div className="w-40 border-b border-slate-300 mb-2 mx-auto"></div>
              <span>Authorized Signatory / Pharmacist</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
