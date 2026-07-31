import React, { useMemo } from 'react';
import { Medicine, Invoice } from '../types';
import { 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  IndianRupee, 
  Activity, 
  ShoppingCart, 
  Layers, 
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardOverviewProps {
  medicines: Medicine[];
  invoices: Invoice[];
  onNavigate: (tab: string) => void;
}

export default function DashboardOverview({ medicines, invoices, onNavigate }: DashboardOverviewProps) {
  // Current time representation (System time is 2026-07-30)
  const currentDate = new Date('2026-07-30');

  // Stats Calculations
  const stats = useMemo(() => {
    let totalSales = 0;
    let retailSales = 0;
    let wholesaleSales = 0;
    let totalDiscountGiven = 0;
    let totalGSTCollected = 0;

    invoices.forEach(inv => {
      totalSales += inv.grandTotal;
      totalDiscountGiven += inv.totalDiscount;
      totalGSTCollected += inv.totalGST;
      if (inv.billingType === 'Retail') {
        retailSales += inv.grandTotal;
      } else {
        wholesaleSales += inv.grandTotal;
      }
    });

    // Stock valuations
    let totalStockQty = 0;
    let totalBuyValue = 0;
    let totalSellValue = 0;
    let lowStockCount = 0;
    let expiredCount = 0;
    let nearExpiryCount = 0; // Expiring in next 6 months

    medicines.forEach(med => {
      totalStockQty += med.stock;
      totalBuyValue += med.buyPrice * med.stock;
      totalSellValue += med.sellingPrice * med.stock;

      if (med.stock <= med.minStockAlert) {
        lowStockCount++;
      }

      // Check Expiry
      if (med.expiryDate) {
        const [year, month] = med.expiryDate.split('-').map(Number);
        const expiryDateObj = new Date(year, month - 1, 1);
        const diffTime = expiryDateObj.getTime() - currentDate.getTime();
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.4);

        if (diffMonths < 0) {
          expiredCount++;
        } else if (diffMonths <= 6) {
          nearExpiryCount++;
        }
      }
    });

    return {
      totalSales,
      retailSales,
      wholesaleSales,
      totalDiscountGiven,
      totalGSTCollected,
      totalStockQty,
      totalBuyValue,
      totalSellValue,
      lowStockCount,
      expiredCount,
      nearExpiryCount,
      estimatedProfit: totalSales - invoices.reduce((acc, inv) => {
        // Calculate original cost of items sold
        const costOfSoldItems = inv.items.reduce((itemAcc, item) => {
          const originalMed = medicines.find(m => m.id === item.medicineId);
          const buyPrice = originalMed ? originalMed.buyPrice : (item.price * 0.7); // Fallback
          return itemAcc + (buyPrice * item.qty);
        }, 0);
        return acc + costOfSoldItems;
      }, 0)
    };
  }, [medicines, invoices, currentDate]);

  // Daily Sales Trend for Last 7 days (Visual helper)
  const dailySales = useMemo(() => {
    const days: { [key: string]: number } = {};
    // Last 7 days placeholder
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days[dateStr] = 0;
    }

    invoices.forEach(inv => {
      if (days[inv.date] !== undefined) {
        days[inv.date] += inv.grandTotal;
      }
    });

    return Object.entries(days).map(([date, amount]) => {
      const dayName = new Date(date).toLocaleDateString('en-IN', { weekday: 'short' });
      return { date, dayName, amount };
    });
  }, [invoices, currentDate]);

  // Max Sales Day value for chart scaling
  const maxDaySales = Math.max(...dailySales.map(d => d.amount), 500);

  // Top Selling Products in Invoices
  const topMedicines = useMemo(() => {
    const counts: { [key: string]: { name: string; qty: number; total: number } } = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!counts[item.medicineId]) {
          counts[item.medicineId] = { name: item.name, qty: 0, total: 0 };
        }
        counts[item.medicineId].qty += item.qty;
        counts[item.medicineId].total += item.total;
      });
    });

    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4);
  }, [invoices]);

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-teal-950 text-white rounded-xl p-6 shadow-md border border-blue-800/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-6">
          <Activity size={320} className="text-teal-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-teal-500/20 text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-teal-500/30">
                Marg ERP 9 UI Workspace
              </span>
              <span className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                Active Session
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
              Pharma POS & Inventory System
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Professional Billing (Retail & Wholesale), batch-wise stock control, formula searching, and GST compliance reporting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('billing')}
              className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-slate-950 font-bold px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
              id="quick-billing-btn"
            >
              <ShoppingCart size={18} />
              New Bill (F2)
            </button>
            <button
              onClick={() => onNavigate('medicines')}
              className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-teal-300 border border-slate-700 font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer"
              id="quick-stock-btn"
            >
              <Package size={18} />
              Add Medicine
            </button>
          </div>
        </div>
      </div>

      {/* Modern High-End Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <IndianRupee size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider mb-0.5">Total Sales (GST Incl.)</span>
            <span className="text-2xl font-bold text-slate-900 block">₹{stats.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <div className="flex gap-2 mt-1 text-[11px]">
              <span className="text-blue-600 font-medium">Retail: ₹{Math.round(stats.retailSales)}</span>
              <span className="text-slate-400">|</span>
              <span className="text-indigo-600 font-medium">Wholesale: ₹{Math.round(stats.wholesaleSales)}</span>
            </div>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider mb-0.5">Estimated Profit</span>
            <span className="text-2xl font-bold text-teal-700 block">₹{stats.estimatedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[11px] text-slate-500 block mt-1">Based on Buy & Sell price spreads</span>
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider mb-0.5">Stock Valuation</span>
            <span className="text-2xl font-bold text-amber-800 block">₹{stats.totalSellValue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
            <div className="flex gap-2 mt-1 text-[11px]">
              <span className="text-amber-700 font-medium">Cost: ₹{Math.round(stats.totalBuyValue)}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">Qty: {stats.totalStockQty} items</span>
            </div>
          </div>
        </div>

        {/* Alerts Center */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider mb-0.5">Critical Alerts</span>
            <span className="text-2xl font-bold text-rose-700 block">
              {stats.lowStockCount + stats.expiredCount + stats.nearExpiryCount}
            </span>
            <div className="flex gap-2 mt-1 text-[11px]">
              <span className="text-rose-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate('medicines')}>
                Low Stock: {stats.lowStockCount}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-purple-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate('medicines')}>
                Expired: {stats.expiredCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphical Insights & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (Custom styled SVG/Divs for extreme reliability) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Sales Activity</h3>
              <p className="text-xs text-slate-500">Live 7-day revenue trend in Rupees</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded">
                GST Collected: ₹{stats.totalGSTCollected.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="h-64 flex flex-col justify-between">
            {/* Visual Bars */}
            <div className="flex-1 flex items-end justify-between px-2 gap-4">
              {dailySales.map((day) => {
                const heightPercent = maxDaySales > 0 ? (day.amount / maxDaySales) * 80 + 5 : 5;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-950 text-white text-[11px] px-2 py-1 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                      ₹{day.amount.toFixed(1)}
                    </div>
                    {/* Bar */}
                    <div 
                      style={{ height: `${heightPercent}%` }} 
                      className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-blue-700 to-teal-500 group-hover:from-blue-600 group-hover:to-teal-400 transition-all shadow-sm"
                    />
                    {/* Label */}
                    <span className="text-xs text-slate-600 font-medium mt-2">{day.dayName}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{day.date.split('-')[2]} Jul</span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Grid Line info */}
            <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between text-[11px] text-slate-400">
              <span>0 (INR)</span>
              <span>Daily Sales Volume Limit</span>
              <span>₹{maxDaySales.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Live Alerts & Expiry Radar */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Expiry & Stock Radar</h3>
            <p className="text-xs text-slate-500">Urgent operational alerts</p>
          </div>

          <div className="space-y-3">
            {/* Low Stock Alert Block */}
            <div className="p-3.5 bg-rose-50/50 rounded-lg border border-rose-100 flex items-start gap-3">
              <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <span className="text-xs font-bold text-rose-900 block">Low Stock Alert ({stats.lowStockCount} Medicines)</span>
                <p className="text-xs text-rose-700 mt-0.5">
                  These medicines have reached below minimum reorder level. Restock is required.
                </p>
                {stats.lowStockCount > 0 && (
                  <button 
                    onClick={() => onNavigate('medicines')}
                    className="text-[11px] text-rose-800 underline font-semibold mt-1.5 cursor-pointer block hover:text-rose-900"
                  >
                    Manage & Reorder Stock &rarr;
                  </button>
                )}
              </div>
            </div>

            {/* Expiry Alert Block */}
            <div className="p-3.5 bg-amber-50/50 rounded-lg border border-amber-100 flex items-start gap-3">
              <CalendarDays className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <span className="text-xs font-bold text-amber-900 block">Near Expiry Alert ({stats.nearExpiryCount} Items)</span>
                <p className="text-xs text-amber-700 mt-0.5">
                  Medicines expiring in the next 6 months. Consider wholesale liquidation discount.
                </p>
                {stats.nearExpiryCount > 0 && (
                  <button 
                    onClick={() => onNavigate('medicines')}
                    className="text-[11px] text-amber-800 underline font-semibold mt-1.5 cursor-pointer block hover:text-amber-900"
                  >
                    Check Expiry Log &rarr;
                  </button>
                )}
              </div>
            </div>

            {/* Expired block if exists */}
            {stats.expiredCount > 0 && (
              <div className="p-3.5 bg-purple-50 rounded-lg border border-purple-100 flex items-start gap-3">
                <AlertTriangle className="text-purple-600 shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <span className="text-xs font-bold text-purple-900 block">EXPIRED STOCKS ({stats.expiredCount} Items)</span>
                  <p className="text-xs text-purple-700 mt-0.5">
                    Critical: Some items are past their expiry dates and MUST be discarded immediately!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row - Top Selling Products & Short Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top selling medicines list */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-teal-600" size={18} />
            <h3 className="text-lg font-bold text-slate-900">Fast-Moving Medicines</h3>
          </div>
          
          {topMedicines.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No bills generated yet. Fast moving items will appear here.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topMedicines.map((item, index) => (
                <div key={item.name} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-slate-800 block">{item.name}</span>
                      <span className="text-[11px] text-slate-400">Sold: {item.qty} units</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800 block">₹{item.total.toFixed(2)}</span>
                    <span className="text-[10px] text-teal-600 font-medium">Revenue</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Business Settings Quick Info & Shortcuts */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Operator Quick Keyboard Guide</h3>
            <p className="text-xs text-slate-500 mb-4">
              Pharmacy billing environments rely on quick speed. Use these standard operational modes:
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-700 block">F2 / Billing Tab</span>
                <span className="text-slate-500">Initiate dynamic customer checkout</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-700 block">Retail Mode</span>
                <span className="text-slate-500">Direct MRP standard 5% tax billing</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-700 block">Wholesale Mode</span>
                <span className="text-slate-500">Bulk party billing with custom trade margins</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-700 block">Local Save Engine</span>
                <span className="text-slate-500">No clouds needed; fully offline persistent POS</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Powered by Marg UI Style Pack v9.0</span>
            <span>2026 Live Session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
