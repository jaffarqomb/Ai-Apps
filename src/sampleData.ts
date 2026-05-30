import { Expense, CategoryBudget } from "./types";

export const DEFAULT_BUDGETS: CategoryBudget[] = [
  { category: "Food & Dining", limit: 600 },
  { category: "Shopping & Retail", limit: 400 },
  { category: "Transportation & Auto", limit: 300 },
  { category: "Utilities & Bills", limit: 500 },
  { category: "Housing & Rent", limit: 1500 },
  { category: "Entertainment & Leisure", limit: 250 },
  { category: "Healthcare & Medical", limit: 200 },
  { category: "Travel & Lodging", limit: 800 },
  { category: "Work & Professional", limit: 350 },
  { category: "Miscellaneous", limit: 150 },
];

export const SAMPLE_EXPENSES: Expense[] = [
  {
    id: "e1",
    merchant: "Organic Whole Foods",
    amount: 142.50,
    date: "2026-05-15",
    category: "Food & Dining",
    description: "Weekly grocery shopping including fresh produce, dairy, and pantry essentials.",
    currency: "USD",
    isScanned: true,
    paymentMethod: "Credit Card",
    tax: 11.40,
    items: [
      { name: "Fresh Organic Strawberries", price: 6.99 },
      { name: "Avocados (5 pack)", price: 5.49 },
      { name: "Grass-Fed Milk 1Gal", price: 4.89 },
      { name: "Sourdough Bread loaf", price: 5.99 },
      { name: "Salmon Fillets", price: 24.50 },
      { name: "Other Grocery Items Bundle", price: 94.64 }
    ]
  },
  {
    id: "e2",
    merchant: "Metropolitan Power & Light",
    amount: 185.00,
    date: "2026-05-10",
    category: "Utilities & Bills",
    description: "Monthly electricity invoice for secondary Spring season.",
    currency: "USD",
    isScanned: false,
    paymentMethod: "Bank Transfer",
    tax: 0
  },
  {
    id: "e3",
    merchant: "Uber Ride Options",
    amount: 32.80,
    date: "2026-05-24",
    category: "Transportation & Auto",
    description: "Uber ride from airport to home office.",
    currency: "USD",
    isScanned: true,
    paymentMethod: "Mobile Payment",
    tax: 2.50,
    items: [
      { name: "UberX Base Ride", price: 28.30 },
      { name: "Airport Access Fee", price: 4.50 }
    ]
  },
  {
    id: "e4",
    merchant: "Tech Gear Depot",
    amount: 329.99,
    date: "2026-05-18",
    category: "Work & Professional",
    description: "4K Ergonomic Monitor for home-office setup.",
    currency: "USD",
    isScanned: true,
    paymentMethod: "Credit Card",
    tax: 26.40,
    items: [
      { name: "4K UHD 27-inch Ergonomic Monitor", price: 329.99 }
    ]
  },
  {
    id: "e5",
    merchant: "Bistro Luigi",
    amount: 88.50,
    date: "2026-05-26",
    category: "Food & Dining",
    description: "Team dinner celebration with colleagues.",
    currency: "USD",
    isScanned: true,
    paymentMethod: "Debit Card",
    tax: 7.20,
    items: [
      { name: "Woodfired Pizza", price: 21.00 },
      { name: "Truffle Gnocchi", price: 24.00 },
      { name: "Appetizers Platter", price: 18.50 },
      { name: "Soft Drinks", price: 15.00 },
      { name: "Italian Espresso x2", price: 10.00 }
    ]
  },
  {
    id: "e6",
    merchant: "Starlight Cinema",
    amount: 45.00,
    date: "2026-05-12",
    category: "Entertainment & Leisure",
    description: "Movie tickets and concessions snack bundle.",
    currency: "USD",
    isScanned: false,
    paymentMethod: "Credit Card",
    tax: 3.50
  },
  {
    id: "e7",
    merchant: "Apex Rental Apartments",
    amount: 1500.00,
    date: "2026-05-01",
    category: "Housing & Rent",
    description: "Monthly apartment leasing fee.",
    currency: "USD",
    isScanned: false,
    paymentMethod: "Bank Transfer"
  },
  {
    id: "e8",
    merchant: "Cornerstone Rx",
    amount: 45.30,
    date: "2026-05-08",
    category: "Healthcare & Medical",
    description: "Prescriptions and seasonal allergy medications.",
    currency: "USD",
    isScanned: true,
    paymentMethod: "Credit Card",
    tax: 1.80,
    items: [
      { name: "Antihistamine Regular x30", price: 22.50 },
      { name: "Multivitamin Gummies", price: 21.00 },
      { name: "Sales Tax", price: 1.80 }
    ]
  },
  {
    id: "e9",
    merchant: "Corner Cafe & Co",
    amount: 12.75,
    date: "2026-05-29",
    category: "Food & Dining",
    description: "Morning coffee and pastry snack.",
    currency: "USD",
    isScanned: true,
    paymentMethod: "Mobile Payment",
    tax: 0.85,
    items: [
      { name: "Large Oat Milk Latte", price: 6.25 },
      { name: "Almond Croissant", price: 5.65 }
    ]
  },
  {
    id: "e10",
    merchant: "Apparel Express",
    amount: 112.00,
    date: "2026-05-20",
    category: "Shopping & Retail",
    description: "Business-casual wardrobe additions.",
    currency: "USD",
    isScanned: false,
    paymentMethod: "Credit Card"
  }
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  SGD: "S$",
};
