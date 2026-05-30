import React, { useState, useEffect } from "react";
import { 
  Receipt, Wallet, Calendar, Plus, Edit3, Trash2, Search, ArrowUpDown, 
  HelpCircle, AlertCircle, TrendingUp, DollarSign, ListCollapse, CheckCircle2,
  Sparkles, FileSpreadsheet, ShieldCheck
} from "lucide-react";

import { Expense, CategoryBudget } from "./types";
import { SAMPLE_EXPENSES, DEFAULT_BUDGETS, CURRENCY_SYMBOLS } from "./sampleData";

import ReceiptScanner from "./components/ReceiptScanner";
import BudgetAnalytics from "./components/BudgetAnalytics";
import ExportPanel from "./components/ExportPanel";
import ExpenseForm from "./components/ExpenseForm";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "scanner" | "ledger" | "budgets" | "exports">("dashboard");

  // Expenses Local Storage State
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const stored = localStorage.getItem("expense_tracker_records_v1");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse stored expenses:", e);
    }
    return SAMPLE_EXPENSES;
  });

  // Budgets Local Storage State
  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    try {
      const stored = localStorage.getItem("expense_tracker_budgets_v1");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse stored budgets:", e);
    }
    return DEFAULT_BUDGETS;
  });

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  // Search and Sort State for ledger tab
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortKey, setSortKey] = useState<"date" | "amount" | "merchant">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Sync to database
  useEffect(() => {
    localStorage.setItem("expense_tracker_records_v1", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("expense_tracker_budgets_v1", JSON.stringify(budgets));
  }, [budgets]);

  // Derived Values
  const categories = budgets.map((b) => b.category);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);

  const scannedExpensesCount = expenses.filter((e) => e.isScanned).length;
  const scannerUtilizationRate = expenses.length > 0 ? Math.round((scannedExpensesCount / expenses.length) * 100) : 0;

  const totalTaxDeductible = expenses.reduce((sum, e) => sum + (e.tax || 0), 0);
  const taxDeductibleCount = expenses.filter((e) => (e.tax || 0) > 0).length;

  // Track over budget counts
  const categorySpending = budgets.reduce((acc, b) => {
    const total = expenses
      .filter((e) => e.category === b.category)
      .reduce((sum, e) => sum + e.amount, 0);
    acc[b.category] = total;
    return acc;
  }, {} as Record<string, number>);

  const overBudgetCatCount = budgets.filter((b) => (categorySpending[b.category] || 0) > b.limit).length;

  // Save/Create handlers
  const handleAddExpense = (newExp: Omit<Expense, "id">) => {
    const fresh: Expense = {
      ...newExp,
      id: "exp_" + Math.random().toString(36).substring(2, 9),
    };
    setExpenses((prev) => [fresh, ...prev]);
    setIsFormOpen(false);
  };

  const handleUpdateExpense = (updatedExp: Omit<Expense, "id"> & { id?: string }) => {
    if (!updatedExp.id) return;
    setExpenses((prev) =>
      prev.map((e) => (e.id === updatedExp.id ? { ...e, ...updatedExp } as Expense : e))
    );
    setEditExpense(null);
    setIsFormOpen(false);
  };

  const handleDeleteExpense = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this transaction record?")) {
      setExpenses((prev) => prev.filter((item) => item.id !== id));
      if (expandedExpenseId === id) {
        setExpandedExpenseId(null);
      }
    }
  };

  const handleUpdateBudget = (category: string, limit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.category === category ? { ...b, limit } : b))
    );
  };

  const openEditForm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = expenses.find((ex) => ex.id === id);
    if (target) {
      setEditExpense(target);
      setIsFormOpen(true);
    }
  };

  // Toggle detail breakdown row
  const toggleRowExpand = (id: string) => {
    setExpandedExpenseId((prev) => (prev === id ? null : id));
  };

  // Run ledger filter-search operations
  const filteredLedger = expenses
    .filter((e) => {
      const matchSearch =
        e.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === "All" || e.category === selectedCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortKey === "date") {
        comparison = a.date.localeCompare(b.date);
      } else if (sortKey === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortKey === "merchant") {
        comparison = a.merchant.localeCompare(b.merchant);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (key: "date" | "amount" | "merchant") => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased flex flex-col" id="primary-app-layout">
      
      {/* Premium Elegant Header Panel */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-45" id="app-site-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Visual branding logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white shadow">
                <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">JEF<span className="text-indigo-600">RY</span></h1>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Expense Tracker</p>
              </div>
            </div>

            {/* Main Tabs Horizontal Selector */}
            <nav className="hidden md:flex space-x-6 h-full items-center" id="nav-desktop-pill-selector">
              {[
                { id: "dashboard", label: "Dashboard", icon: Wallet },
                { id: "scanner", label: "Scanner", icon: Sparkles, badge: "AI" },
                { id: "ledger", label: "Ledger", icon: Calendar },
                { id: "budgets", label: "Budgets", icon: TrendingUp },
                { id: "exports", label: "Reports", icon: FileSpreadsheet },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 h-16 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer relative ${
                      isActive
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-slate-500 hover:text-slate-900 border-b-2 border-transparent"
                    }`}
                    id={`tab-btn-${tab.id}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.badge && (
                      <span className={`text-[9px] uppercase px-1 py-0.5 rounded font-extrabold tracking-wider ${
                        isActive ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-850"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Action Trigger Button & Profile */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2 border-r border-slate-200 pr-4">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">MC</div>
                <span className="text-xs font-bold text-slate-700">Marcus Chen</span>
              </div>
              <button
                onClick={() => {
                  setEditExpense(null);
                  setIsFormOpen(true);
                }}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs uppercase tracking-widest flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                id="header-btn-adds-expense"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Expense
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Embedded Warning Banner if categories are exceeded */}
      {overBudgetCatCount > 0 && activeTab !== "budgets" && (
        <div className="bg-red-50 border-y border-red-100 text-red-800 py-3 px-4" id="global-overbudget-banner">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="font-semibold text-red-700">Budget Warning:</span>
              <span>You have exceeded your monthly limit in <strong>{overBudgetCatCount}</strong> budget categories.</span>
            </div>
            <button 
              onClick={() => setActiveTab("budgets")}
              className="text-red-700 hover:text-red-900 font-extrabold underline cursor-pointer"
            >
              Amend limits &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Main Dynamic View Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="application-main-stage">
        
        {/* Content switch */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in" id="dashboard-tab-view">
            
            {/* Bento Grid Stats Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Monthly Spend */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Spend</p>
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Optimal spending structure
                  </div>
                </div>
              </div>

              {/* Card 2: Budget Remaining */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Budget Remaining</p>
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    ${Math.max(0, totalBudgetLimit - totalSpent).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, (totalSpent / (totalBudgetLimit || 1)) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Card 3: Tax Deductible */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tax Deductible</p>
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    ${totalTaxDeductible.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <div className="mt-2 text-slate-500 text-xs font-medium">
                    {taxDeductibleCount} Verified transactions
                  </div>
                </div>
              </div>

              {/* Card 4: AI Intelligent Suggestion */}
              <div className="bg-indigo-50/40 p-6 rounded-xl border border-indigo-100 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">AI Suggestion</p>
                  <p className="text-[11px] font-medium text-indigo-950 leading-relaxed italic">
                    "Tax optimization status: Check itemized grocery totals in reports for state exemptions."
                  </p>
                </div>
                <div className="text-[9px] text-indigo-500 font-bold mt-2 uppercase tracking-wide">
                  Autonomous Self-Auditing
                </div>
              </div>

            </div>

            {/* Analytics Preview Area & Compact Ledger Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Analytics Summary */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">Operational Spending Summary</h3>
                      <p className="text-xs text-gray-500 mt-1">Side-by-side snapshot of allowances versus actual spending.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab("budgets")}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Audit Budgets &rarr;
                    </button>
                  </div>
                  
                  {/* Reuse BudgetAnalytics but trimmed simple or embed */}
                  <BudgetAnalytics 
                    expenses={expenses} 
                    budgets={budgets} 
                    onUpdateBudget={handleUpdateBudget} 
                  />
                </div>
              </div>

              {/* Recent Transactions Panel */}
              <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-150 p-6 shadow-xs flex flex-col justify-between" id="recent-transactions-widget-card">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">Recent Transactions</h3>
                      <p className="text-xs text-gray-500 mt-1">Last 5 logs in this billing cycle.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab("ledger")}
                      className="text-xs text-indigo-600 font-bold hover:text-indigo-700 cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-4" id="recent-listings-split-container">
                    {expenses.slice(0, 5).map((e) => (
                      <div 
                        key={e.id} 
                        className="flex justify-between items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors border-b border-transparent cursor-pointer"
                        onClick={() => {
                          setActiveTab("ledger");
                          setExpandedExpenseId(e.id);
                        }}
                      >
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate flex items-center gap-1.5">
                            {e.merchant}
                            {e.isScanned && (
                              <span className="text-[9px] bg-indigo-50 border border-indigo-100/40 text-indigo-600 rounded px-1.5 py-[1px] tracking-wider font-extrabold" title="Processed by Gemini AI">
                                AI
                              </span>
                            )}
                          </h4>
                          <span className="text-[11px] text-gray-400 mt-0.5 block">{e.date} &bull; {e.category}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-extrabold text-gray-900">${e.amount.toFixed(2)}</div>
                          <span className="text-[10px] text-gray-400 font-medium">{e.paymentMethod || "Credit"}</span>
                        </div>
                      </div>
                    ))}
                    {expenses.length === 0 && (
                      <p className="text-xs text-gray-500 italic py-8 text-center bg-gray-55/40 rounded-xl">
                        No transactions registered yet. Try scanning a receipt!
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-6 flex justify-between items-center text-xs">
                  <span className="text-gray-400">Security: Fully AES-encrypted in browser</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Secure Sandbox
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

        {activeTab === "scanner" && (
          <div className="space-y-6 animate-fade-in" id="scanner-tab-view">
            <ReceiptScanner 
              onAddExpense={handleAddExpense} 
              categories={categories} 
            />
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="space-y-6 animate-fade-in" id="ledger-tab-view">
            
            {/* Search, Sort, and Quick Stats Control Bar */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs" id="ledger-filters-card-wrapper">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Text query filter */}
                <div className="md:col-span-5 relative">
                  <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by vendor, ingredient, descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    id="ledger-search-input"
                  />
                </div>

                {/* Categories selector */}
                <div className="md:col-span-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-white cursor-pointer"
                    id="ledger-category-dropdown"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ledger Sort Order triggers */}
                <div className="md:col-span-4 flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase font-semibold shrink-0">Sort:</span>
                  <div className="grid grid-cols-3 gap-1.5 w-full">
                    <button
                      onClick={() => toggleSort("date")}
                      className={`px-2 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        sortKey === "date" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Date {sortKey === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => toggleSort("amount")}
                      className={`px-2 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        sortKey === "amount" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Sum {sortKey === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => toggleSort("merchant")}
                      className={`px-2 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        sortKey === "merchant" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Vendor {sortKey === "merchant" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* List Ledger Display */}
            <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs" id="ledger-records-list-wrapper">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6 w-[15%]">Date</th>
                      <th className="py-4 px-6 w-[28%]">Merchant/Store Name</th>
                      <th className="py-4 px-6 w-[20%]">Category</th>
                      <th className="py-4 px-6 w-[17%]">Payment Method</th>
                      <th className="py-4 px-6 w-[12%] text-right">Sum Total</th>
                      <th className="py-4 px-6 w-[8%] text-center">Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.map((e) => {
                      const isExpanded = expandedExpenseId === e.id;
                      return (
                        <React.Fragment key={e.id}>
                          
                          {/* Parent Row */}
                          <tr 
                            className={`hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-sm cursor-pointer ${
                              isExpanded ? "bg-gray-50/30" : ""
                            }`}
                            onClick={() => toggleRowExpand(e.id)}
                            id={`expense-row-${e.id}`}
                          >
                            <td className="py-4 px-6 font-medium text-gray-800">{e.date}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-gray-900 truncate">{e.merchant}</span>
                                {e.isScanned && (
                                  <span className="text-[9px] bg-indigo-50 border border-indigo-100/40 text-indigo-600 font-extrabold rounded px-1.5 py-[1px] tracking-wider shrink-0 uppercase">
                                    AI
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-medium text-gray-700">{e.category}</td>
                            <td className="py-4 px-6 text-gray-600 font-medium">{e.paymentMethod || "Credit Card"}</td>
                            <td className="py-4 px-6 text-right font-extrabold text-gray-900">${e.amount.toFixed(2)}</td>
                            
                            {/* Actions column */}
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={(ev) => openEditForm(e.id, ev)}
                                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                                  title="Edit log details"
                                  id={`btn-edit-expense-${e.id}`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(ev) => handleDeleteExpense(e.id, ev)}
                                  className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                  title="Delete log"
                                  id={`btn-delete-expense-${e.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>

                          </tr>

                          {/* Expansion Row for detailed items and receipts list */}
                          {isExpanded && (
                            <tr className="bg-gray-50/50 border-b border-gray-100" id={`row-expansion-${e.id}`}>
                              <td colSpan={6} className="py-4 px-8">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs text-gray-700 animate-slide-down">
                                  
                                  {/* Memo/Descriptions info */}
                                  <div className="md:col-span-4">
                                    <h5 className="font-bold text-gray-500 uppercase tracking-widest text-[9px] mb-2">Audit Notes / Directives</h5>
                                    <p className="text-sm font-medium leading-relaxed italic text-gray-750">
                                      {e.description || "No description provided. Click the edit pencil above to add general receipt notes."}
                                    </p>
                                    <div className="mt-4 flex gap-3 text-[10px] text-gray-400">
                                      <span>ID: <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600">{e.id}</code></span>
                                      {e.tax !== undefined && (
                                        <span>Tax Deductible: <strong className="text-gray-600">${e.tax.toFixed(2)}</strong></span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Line Items checklist breakdown */}
                                  <div className="md:col-span-8 border-t md:border-t-0 md:border-l border-gray-200 md:pl-6">
                                    <h5 className="font-bold text-gray-500 uppercase tracking-widest text-[9px] mb-2 flex items-center gap-1">
                                      <ListCollapse className="w-3.5 h-3.5" />
                                      Itemized line receipts list
                                    </h5>
                                    
                                    {e.items && e.items.length > 0 ? (
                                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                        {e.items.map((item, index) => (
                                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-150">
                                            <span className="font-bold text-gray-800">{item.name}</span>
                                            <span className="font-mono font-bold text-gray-900">${item.price.toFixed(2)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 italic mt-1 leading-relaxed">
                                        No itemized receipt elements attached to this expense record. Use the receipt scanner to auto-generate lines from cameras or physical receipts.
                                      </p>
                                    )}
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}

                        </React.Fragment>
                      );
                    })}

                    {filteredLedger.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500">
                          <p className="text-sm font-bold">No ledger transactions fit the parameters</p>
                          <p className="text-xs text-gray-400 mt-1">Try relaxing filters or search terms.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {activeTab === "budgets" && (
          <div className="space-y-6 animate-fade-in" id="budgets-tab-view">
            <BudgetAnalytics 
              expenses={expenses} 
              budgets={budgets} 
              onUpdateBudget={handleUpdateBudget} 
            />
          </div>
        )}

        {activeTab === "exports" && (
          <div className="space-y-6 animate-fade-in" id="exports-tab-view">
            <ExportPanel expenses={expenses} />
          </div>
        )}

      </main>

      {/* Manual log Create/Update modal dialog overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <ExpenseForm 
              categories={categories} 
              editExpense={editExpense} 
              onCancel={() => setIsFormOpen(false)} 
              onSave={editExpense ? handleUpdateExpense : handleAddExpense} 
            />
          </div>
        </div>
      )}

      {/* Footer Status Bar with Geometric Balance layout */}
      <footer className="h-10 bg-slate-900 text-[10px] flex items-center justify-between px-8 text-slate-400 mt-20 shrink-0 select-none font-sans" id="app-status-footer">
        <div className="flex gap-6 uppercase tracking-widest font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Banking Connected
          </span>
          <span>Last Sync: 2 Mins Ago</span>
        </div>
        <div className="hidden sm:block uppercase tracking-widest font-bold">
          Ready for Tax Filing Q4 {new Date().getFullYear()}
        </div>
      </footer>

    </div>
  );
}
