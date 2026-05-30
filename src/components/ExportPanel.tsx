import React, { useState } from "react";
import { Download, FileSpreadsheet, FileJson, Copy, Check, Printer, FileText, Filter, Calendar, Tag } from "lucide-react";
import { Expense } from "../types";

interface ExportPanelProps {
  expenses: Expense[];
}

export default function ExportPanel({ expenses }: ExportPanelProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPayMethod, setSelectedPayMethod] = useState("All");
  const [copied, setCopied] = useState(false);

  // Derive filter selectors
  const categories = ["All", ...Array.from(new Set(expenses.map((e) => e.category)))];
  const paymentMethods = ["All", ...Array.from(new Set(expenses.map((e) => e.paymentMethod || "Unknown")))];

  // Apply filter parameters
  const filteredExpenses = expenses.filter((e) => {
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    if (selectedCategory !== "All" && e.category !== selectedCategory) return false;
    if (selectedPayMethod !== "All" && (e.paymentMethod || "Unknown") !== selectedPayMethod) return false;
    return true;
  });

  // Calculate totals for reporting
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTax = filteredExpenses.reduce((sum, e) => sum + (e.tax || 0), 0);
  
  // Expenses aggregated by category
  const categorySummary = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  // Export CSV format helper
  const exportToCSV = () => {
    const headers = ["ID", "Merchant", "Amount", "Date", "Category", "Description", "Payment Method", "Tax", "Currency", "Has Itemized Breakdown"];
    const rows = filteredExpenses.map((e) => [
      e.id,
      `"${e.merchant.replace(/"/g, '""')}"`,
      e.amount,
      e.date,
      `"${e.category}"`,
      `"${(e.description || "").replace(/"/g, '""')}"`,
      `"${e.paymentMethod || "Unknown"}"`,
      e.tax || 0,
      e.currency,
      e.items && e.items.length > 0 ? "Yes" : "No"
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financial_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON format helper
  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredExpenses, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `financial_report_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Plain-text ledger generator for copying
  const generateLedgerText = () => {
    const divider = "====================================================================\n";
    let report = "";
    report += "                      FINANCIAL REPORT SUMMARY                      \n";
    report += "                      Generated on: " + new Date().toLocaleDateString() + "\n";
    report += divider;
    report += `Period Covered:    ${startDate || "Start of Record"} to ${endDate || "End of Record"}\n`;
    report += `Total Transactions: ${filteredExpenses.length}\n`;
    report += `Total Expenditure: $${totalAmount.toFixed(2)}\n`;
    report += `Total Taxes Paid:  $${totalTax.toFixed(2)}\n`;
    report += divider;
    report += "CATEGORY BREAKDOWN:\n";
    Object.entries(categorySummary).forEach(([cat, spent]) => {
      const pct = totalAmount > 0 ? ((spent / totalAmount) * 100).toFixed(1) : "0";
      report += ` - ${cat.padEnd(25)}: $${spent.toFixed(2).padStart(9)} (${pct}%)\n`;
    });
    report += divider;
    report += "TRANSACTION JOURNAL:\n";
    report += `${"Date".padEnd(12)} ${"Merchant".padEnd(25)} ${"Category".padEnd(16)} ${"Amount".padStart(10)}\n`;
    report += "--------------------------------------------------------------------\n";
    filteredExpenses.forEach((e) => {
      report += `${e.date.padEnd(12)} ${e.merchant.substring(0, 24).padEnd(25)} ${e.category.substring(0, 15).padEnd(16)} $${e.amount.toFixed(2).padStart(9)}\n`;
      if (e.items && e.items.length > 0) {
        e.items.forEach((item) => {
          report += `   * ${item.name.substring(0, 35).padEnd(36)}  $${item.price.toFixed(2).padStart(8)}\n`;
        });
      }
    });
    report += divider;
    report += "                      END OF FINANCIAL STATEMENT                    \n";
    return report;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateLedgerText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; font-size: 13px; line-height: 1.4; padding: 20px;">${generateLedgerText()}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6" id="export-panel-parent">
      
      {/* Search Filters Row */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs" id="reporting-filters-box">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          Filter Report Parameters
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 cursor-pointer"
              id="report-filter-start-date"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Until Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 cursor-pointer"
              id="report-filter-end-date"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              Category Filter
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-white cursor-pointer"
              id="report-filter-category"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              Payment Method
            </label>
            <select
              value={selectedPayMethod}
              onChange={(e) => setSelectedPayMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-white cursor-pointer"
              id="report-filter-payment"
            >
              {paymentMethods.map((pm) => (
                <option key={pm} value={pm}>
                  {pm === "All" ? "All Methods" : pm}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Quick Metrics */}
          <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs" id="quick-reporting-status-card">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Report Summary Status</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Filtered Transactions:</span>
                <span className="font-bold text-gray-900">{filteredExpenses.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Total Spending sum:</span>
                <span className="font-bold text-gray-900">${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium font-mono">Deductible Taxes:</span>
                <span className="font-bold text-emerald-600">${totalTax.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Export Actions Panel */}
          <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs space-y-3" id="export-actions-card">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Export formats</h4>
            
            <button
              onClick={exportToCSV}
              disabled={filteredExpenses.length === 0}
              className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              id="btn-export-to-csv"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Spreadsheet (CSV)
            </button>

            <button
              onClick={exportToJSON}
              disabled={filteredExpenses.length === 0}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              id="btn-export-to-json"
            >
              <FileJson className="w-4 h-4" />
              Download Database Backup (JSON)
            </button>

            <button
              onClick={handleCopy}
              disabled={filteredExpenses.length === 0}
              className="w-full px-4 py-2.5 border border-gray-250 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              id="btn-export-copy-ledger"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 animate-scale-in" />
                  Ledger Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Ledger to Clipboard
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={filteredExpenses.length === 0}
              className="w-full px-4 py-2.5 border border-gray-250 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              id="btn-export-print"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF ledger
            </button>
          </div>

        </div>

        {/* Right column: Interactive Ledger Preview */}
        <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden p-6 relative flex flex-col h-[400px] min-h-[400px]">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Live Ledger Ledger Report Preview
            </span>
            <span className="text-[10px] bg-indigo-55 border border-indigo-150 text-indigo-605 rounded px-2 py-0.5 font-bold uppercase">
              Draft
            </span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-gray-150 rounded-xl" id="empty-ledger-view">
              <p className="text-sm font-semibold text-gray-750">No expenses fit the selected filters</p>
              <p className="text-xs text-gray-550 mt-1 max-w-xs">Try selecting a broader date range or changing your categories selector filters.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-white border border-gray-150 rounded-xl p-4 shadow-inner" id="ledger-text-box">
              <pre className="text-[11px] md:text-xs font-mono text-gray-800 leading-relaxed whitespace-pre font-medium">
                {generateLedgerText()}
              </pre>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
