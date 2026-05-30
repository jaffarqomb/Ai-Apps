import React, { useState } from "react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import { AlertTriangle, Edit2, Check, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { Expense, CategoryBudget } from "../types";
import { CURRENCY_SYMBOLS } from "../sampleData";

interface BudgetAnalyticsProps {
  expenses: Expense[];
  budgets: CategoryBudget[];
  onUpdateBudget: (category: string, limit: number) => void;
}

export default function BudgetAnalytics({ expenses, budgets, onUpdateBudget }: BudgetAnalyticsProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempEditValue, setTempEditValue] = useState<string>("");

  // Filter expenses for current month (or all in our sample dataset to keep charts rich)
  // Let's filter expenditures by category
  const categorySpending = budgets.reduce((acc, b) => {
    const totalSpent = expenses
      .filter((e) => e.category === b.category)
      .reduce((sum, e) => sum + e.amount, 0);
    acc[b.category] = parseFloat(totalSpent.toFixed(2));
    return acc;
  }, {} as Record<string, number>);

  const totalSpentAll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);

  // Build chart-ready arrays
  // 1. Budget vs Spending Side by Side data
  const comparisonData = budgets.map((b) => ({
    name: b.category,
    "Budget Limit": b.limit,
    "Spent Amount": categorySpending[b.category] || 0,
  }));

  // 2. Spending breakdown data (Pie Chart)
  const pieData = budgets
    .map((b) => ({
      name: b.category,
      value: categorySpending[b.category] || 0,
    }))
    .filter((item) => item.value > 0);

  // Color constants for high quality theme
  const COLORS = [
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#ec4899", // Pink
    "#8b5cf6", // Violet
    "#ef4444", // Red
    "#06b6d4", // Cyan
    "#6b7280", // Gray
    "#14b8a6", // Teal
    "#f97316", // Orange
  ];

  const handleStartEdit = (cat: string, currentLimit: number) => {
    setEditingCategory(cat);
    setTempEditValue(currentLimit.toString());
  };

  const handleSaveEdit = (cat: string) => {
    const newLimit = parseFloat(tempEditValue);
    if (!isNaN(newLimit) && newLimit >= 0) {
      onUpdateBudget(cat, newLimit);
    }
    setEditingCategory(null);
  };

  return (
    <div className="space-y-8" id="budget-analytics-panel">
      
      {/* Cards Row: Total Budget Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Spending vs Overall Budget */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs flex flex-col justify-between" id="card-total-budget-utilization">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Budget Allocation</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">${totalSpentAll.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-xs font-medium text-gray-500">of ${totalBudgetLimit.toLocaleString("en-US", { maximumFractionDigits: 0 })} spent</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500 font-medium">Monthly Progress ({Math.round((totalSpentAll / totalBudgetLimit) * 100) || 0}%)</span>
              <span className={`font-semibold ${totalSpentAll > totalBudgetLimit ? "text-red-550" : "text-indigo-600"}`}>
                {totalSpentAll > totalBudgetLimit ? "Overspent" : `$${(totalBudgetLimit - totalSpentAll).toFixed(2)} remaining`}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${totalSpentAll > totalBudgetLimit ? "bg-red-500" : "bg-indigo-600"}`}
                style={{ width: `${Math.min((totalSpentAll / totalBudgetLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Highest Spend Category Card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs flex flex-col justify-between" id="card-top-spend-category">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Top Spending Category</h3>
            {pieData.length > 0 ? (
              (() => {
                const top = [...pieData].sort((a, b) => b.value - a.value)[0];
                const topBudget = budgets.find((b) => b.category === top.name)?.limit || 1;
                return (
                  <>
                    <h4 className="text-2xl font-bold text-gray-900">{top.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Spent <strong className="text-gray-700">${top.value.toFixed(2)}</strong> ({Math.round((top.value / topBudget) * 100)}% of limit)
                    </p>
                  </>
                );
              })()
            ) : (
              <>
                <h4 className="text-lg font-semibold text-gray-400">No transactions recorded</h4>
                <p className="text-xs text-gray-500 mt-1">Add expenses to see detailed category metrics.</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/30 mt-4">
            <TrendingUp className="w-4 h-4" />
            <span>Reflects all current month expenses</span>
          </div>
        </div>

        {/* Alarms / Alert status card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs flex flex-col justify-between animate-fade-in" id="card-budget-health-alerts">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Budget Health</h3>
            {(() => {
              const overspentList = budgets.filter((b) => (categorySpending[b.category] || 0) > b.limit);
              const warningList = budgets.filter((b) => {
                const spent = categorySpending[b.category] || 0;
                return spent >= b.limit * 0.8 && spent <= b.limit;
              });

              if (overspentList.length === 0 && warningList.length === 0) {
                return (
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-emerald-600 flex items-center gap-1.5">
                      All Budgets Healthy
                    </h4>
                    <p className="text-xs text-gray-500">Every single category is comfortably within its monthly spending limit.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-1">
                  {overspentList.length > 0 && (
                    <div className="flex items-center gap-1 text-red-650 text-sm font-semibold">
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{overspentList.length} overspent categories!</span>
                    </div>
                  )}
                  {warningList.length > 0 && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm font-semibold mt-1">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{warningList.length} categories near threshold (80%)</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Adjust your targets or pause discretionary expenses.</p>
                </div>
              );
            })()}
          </div>
          <p className="text-[11px] text-gray-400 italic">Re-calculated instantly with every transaction upload.</p>
        </div>

      </div>

      {/* Split Charts Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pie: Breakdown chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs" id="pie-breakdown-visualization">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Expense Category Breakdown</h3>
          <p className="text-xs text-gray-500 mb-6">Percentage share of total spending across categories.</p>
          
          <div className="h-[280px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, "Spent"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", color: "#4b5563" }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">
                No spending data. Upload receipts to populate category share.
              </div>
            )}
          </div>
        </div>

        {/* Bar: Comparison Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs" id="bar-comparison-visualization">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Budget Target vs Category Spending</h3>
          <p className="text-xs text-gray-500 mb-6">Compare spending against monthly limits side by side.</p>
          
          <div className="h-[280px]" id="bar-comparison-rechart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "#6b7280", fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: "#6b7280", fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: any) => [`$${value}`, "Amount"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Budget Limit" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="Spent Amount" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Editable Category Budgets Grid */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs" id="category-budgets-adjustment-grid">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Assign Category Budgets</h3>
            <p className="text-xs text-gray-500 mt-1">Configure personalized monthly savings targets per spending category.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 text-gray-500">
            {budgets.length} Categories Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {budgets.map((b) => {
            const spent = categorySpending[b.category] || 0;
            const pct = Math.min((spent / b.limit) * 100, 100);
            const isEditing = editingCategory === b.category;
            
            let colorClass = "bg-emerald-500";
            let textClass = "text-emerald-700 bg-emerald-50 border-emerald-100";
            if (spent > b.limit) {
              colorClass = "bg-red-500 animate-pulse";
              textClass = "text-red-700 bg-red-50 border-red-100";
            } else if (spent >= b.limit * 0.8) {
              colorClass = "bg-amber-500";
              textClass = "text-amber-700 bg-amber-50 border-amber-100";
            }

            return (
              <div key={b.category} className="p-3 bg-gray-50 hover:bg-gray-100/50 rounded-xl transition-all border border-gray-100">
                <div className="flex items-center justify-between font-medium text-sm text-gray-800 mb-2">
                  <span className="font-semibold text-gray-900">{b.category}</span>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 animate-fade-in">
                      <span className="text-xs text-gray-400">$</span>
                      <input
                        type="number"
                        className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-indigo-600 font-semibold"
                        value={tempEditValue}
                        onChange={(e) => setTempEditValue(e.target.value)}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(b.category)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                        title="Save Limit"
                        id={`btn-save-limit-${b.category}`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group/edit text-gray-600 font-semibold text-xs">
                      <span>Spent: <strong className="text-gray-900 font-bold">${spent.toFixed(2)}</strong> of ${b.limit}</span>
                      <button
                        onClick={() => handleStartEdit(b.category, b.limit)}
                        className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
                        title="Edit Limit"
                        id={`btn-edit-limit-${b.category}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200/50 rounded-full h-2 mb-1.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-gray-400">Usage: {Math.round((spent / b.limit) * 100) || 0}%</span>
                  {spent > b.limit ? (
                    <span className="text-red-500 font-bold flex items-center gap-0.5">Over budget by ${(spent - b.limit).toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-400">Remaining: ${(b.limit - spent).toFixed(2)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
