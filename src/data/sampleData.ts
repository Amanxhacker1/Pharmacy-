import { Medicine, Invoice, BusinessProfile } from '../types';

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  name: "Pharmacy",
  address: "102, Plaza Market, Near Civil Hospital, New Delhi, India",
  phone: "+91 98765 43210",
  email: "amanxgithub@gmail.com",
  gstin: "07AAAAA1111A1Z1",
  drugLicenseNo: "DL-20392 / West-2026"
};

export const SAMPLE_MEDICINES: Medicine[] = [
  {
    id: "med-1",
    name: "Paracetamol 650 (Dolo)",
    formula: "Paracetamol IP 650mg",
    batchNo: "DL24109",
    expiryDate: "2027-10",
    packing: "15 Tabs",
    manufacturer: "Micro Labs Ltd",
    buyPrice: 18.50,
    sellingPrice: 30.00,
    wholesalePrice: 22.00,
    stock: 120,
    minStockAlert: 20,
    gstRate: 5,
    shelfNo: "A-3"
  },
  {
    id: "med-2",
    name: "Amoxyclav 625 (Augmentin)",
    formula: "Amoxicillin Trihydrate 500mg + Clavulanic Acid 125mg",
    batchNo: "AUG5532",
    expiryDate: "2026-12",
    packing: "10 Tabs",
    manufacturer: "GlaxoSmithKline",
    buyPrice: 110.00,
    sellingPrice: 168.00,
    wholesalePrice: 130.00,
    stock: 45,
    minStockAlert: 15,
    gstRate: 5,
    shelfNo: "B-1"
  },
  {
    id: "med-3",
    name: "Pantocid 40",
    formula: "Pantoprazole Sodium 40mg",
    batchNo: "PNT9922",
    expiryDate: "2027-04",
    packing: "15 Tabs",
    manufacturer: "Sun Pharma",
    buyPrice: 65.00,
    sellingPrice: 115.00,
    wholesalePrice: 85.00,
    stock: 14,
    minStockAlert: 20, // Low stock indicator
    gstRate: 5,
    shelfNo: "A-2"
  },
  {
    id: "med-4",
    name: "CoughSil Syrup",
    formula: "Dextromethorphan HBr 10mg + Chlorpheniramine Maleate 2mg",
    batchNo: "CSL401",
    expiryDate: "2027-02",
    packing: "100ml Bottle",
    manufacturer: "Cipla Ltd",
    buyPrice: 42.00,
    sellingPrice: 85.00,
    wholesalePrice: 55.00,
    stock: 60,
    minStockAlert: 10,
    gstRate: 5,
    shelfNo: "C-4"
  },
  {
    id: "med-5",
    name: "Azithral 500",
    formula: "Azithromycin Dihydrate 500mg",
    batchNo: "AZT332",
    expiryDate: "2026-09",
    packing: "5 Tabs",
    manufacturer: "Alembic Pharmaceuticals",
    buyPrice: 60.00,
    sellingPrice: 119.00,
    wholesalePrice: 78.00,
    stock: 8,
    minStockAlert: 10, // Low stock indicator
    gstRate: 5,
    shelfNo: "B-2"
  },
  {
    id: "med-6",
    name: "Montair LC",
    formula: "Montelukast Sodium 10mg + Levocetirizine HCl 5mg",
    batchNo: "MLC908",
    expiryDate: "2027-11",
    packing: "10 Tabs",
    manufacturer: "Cipla Ltd",
    buyPrice: 95.00,
    sellingPrice: 172.00,
    wholesalePrice: 125.00,
    stock: 85,
    minStockAlert: 15,
    gstRate: 5,
    shelfNo: "A-1"
  },
  {
    id: "med-7",
    name: "Telma 40",
    formula: "Telmisartan 40mg",
    batchNo: "TLM887",
    expiryDate: "2027-06",
    packing: "15 Tabs",
    manufacturer: "Glenmark Pharmaceuticals",
    buyPrice: 38.00,
    sellingPrice: 92.00,
    wholesalePrice: 52.00,
    stock: 150,
    minStockAlert: 30,
    gstRate: 5,
    shelfNo: "D-1"
  },
  {
    id: "med-8",
    name: "Atorva 10",
    formula: "Atorvastatin Calcium 10mg",
    batchNo: "ATV112",
    expiryDate: "2026-05", // Expiring soon or expired relative to 2026-07-30
    packing: "15 Tabs",
    manufacturer: "Zydus Cadila",
    buyPrice: 28.00,
    sellingPrice: 72.00,
    wholesalePrice: 42.00,
    stock: 40,
    minStockAlert: 15,
    gstRate: 5,
    shelfNo: "D-2"
  }
];

export const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "inv-2026-001",
    invoiceNo: "MP-2026-001",
    date: "2026-07-28",
    customerName: "Rakesh Sharma Medicals",
    customerMobile: "9812345678",
    customerGSTIN: "07RSHMS2026M1ZA",
    billingType: "Wholesale",
    paymentMode: "Credit",
    items: [
      {
        medicineId: "med-1",
        name: "Paracetamol 650 (Dolo)",
        formula: "Paracetamol IP 650mg",
        batchNo: "DL24109",
        expiryDate: "2027-10",
        packing: "15 Tabs",
        qty: 10,
        price: 22.00,
        gstRate: 5,
        discountPercent: 5,
        gstAmount: 10.45,
        discountAmount: 11.00,
        total: 219.45
      },
      {
        medicineId: "med-2",
        name: "Amoxyclav 625 (Augmentin)",
        formula: "Amoxicillin Trihydrate 500mg + Clavulanic Acid 125mg",
        batchNo: "AUG5532",
        expiryDate: "2026-12",
        packing: "10 Tabs",
        qty: 5,
        price: 130.00,
        gstRate: 5,
        discountPercent: 10,
        gstAmount: 29.25,
        discountAmount: 65.00,
        total: 614.25
      }
    ],
    subTotal: 870.00,
    totalGST: 39.70,
    totalDiscount: 76.00,
    grandTotal: 833.70,
    notes: "Trade credit. Due in 15 days."
  },
  {
    id: "inv-2026-002",
    invoiceNo: "MP-2026-002",
    date: "2026-07-29",
    customerName: "Rahul Kumar",
    customerMobile: "8877665544",
    billingType: "Retail",
    paymentMode: "UPI",
    items: [
      {
        medicineId: "med-4",
        name: "CoughSil Syrup",
        formula: "Dextromethorphan HBr 10mg + Chlorpheniramine Maleate 2mg",
        batchNo: "CSL401",
        expiryDate: "2027-02",
        packing: "100ml Bottle",
        qty: 2,
        price: 85.00,
        gstRate: 5,
        discountPercent: 0,
        gstAmount: 8.50,
        discountAmount: 0.00,
        total: 178.50
      },
      {
        medicineId: "med-1",
        name: "Paracetamol 650 (Dolo)",
        formula: "Paracetamol IP 650mg",
        batchNo: "DL24109",
        expiryDate: "2027-10",
        packing: "15 Tabs",
        qty: 1,
        price: 30.00,
        gstRate: 5,
        discountPercent: 0,
        gstAmount: 1.50,
        discountAmount: 0.00,
        total: 31.50
      }
    ],
    subTotal: 200.00,
    totalGST: 10.00,
    totalDiscount: 0.00,
    grandTotal: 210.00,
    notes: "Patient prescription attached."
  }
];
