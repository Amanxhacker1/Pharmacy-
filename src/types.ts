export interface Medicine {
  id: string;
  name: string;
  formula: string; // Salt composition
  batchNo: string;
  expiryDate: string; // YYYY-MM format
  packing: string; // e.g. "10 Tabs", "15 Caps", "100ml Syrup"
  manufacturer: string;
  buyPrice: number;
  sellingPrice: number; // Retail price
  wholesalePrice: number; // Wholesale price
  stock: number;
  minStockAlert: number;
  gstRate: number; // e.g. 5, 12, 18 (default 5)
  shelfNo?: string; // Rack location
}

export interface InvoiceItem {
  medicineId: string;
  name: string;
  formula: string;
  batchNo: string;
  expiryDate: string;
  packing: string;
  qty: number;
  price: number; // Wholesale or retail depending on invoice type
  gstRate: number;
  discountPercent: number;
  gstAmount: number;
  discountAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerMobile: string;
  customerGSTIN?: string;
  billingType: 'Retail' | 'Wholesale';
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Credit';
  items: InvoiceItem[];
  subTotal: number;
  totalGST: number;
  totalDiscount: number;
  grandTotal: number;
  notes?: string;
}

export interface BusinessProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  drugLicenseNo: string;
}
