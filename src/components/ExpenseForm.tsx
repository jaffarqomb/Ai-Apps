import React, { useState, useEffect } from "react";
import { Plus, Trash, Check, X, Calculator } from "lucide-react";
import { Expense, ExpenseItem } from "../types";

interface ExpenseFormProps {
  categories: string[];
  editExpense: Expense | null;
  onSave: (expense: Omit<Expense, "id"> & { id?: string }) => void;
  onCancel: () => void;
}

export default function ExpenseForm({ categories, editExpense, onSave, onCancel }: ExpenseFormProps) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tax, setTax] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editExpense) {
      setMerchant(editExpense.merchant);
      setAmount(editExpense.amount);
      setDate(editExpense.date);
      setCategory(editExpense.category);
      setDescription(editExpense.description || "");
      setTax(editExpense.tax || 0);
      setPaymentMethod(editExpense.paymentMethod || "Credit Card");
      setCurrency(editExpense.currency || "USD");
      setItems(editExpense.items || []);
    } else {
      // Default configurations
      setMerchant("");
      setAmount(0);
      setDate(new Date().toISOString().split("T")[0]);
      setCategory(categories[0] || "Food & Dining");
      setDescription("");
      setTax(0);
      setPaymentMethod("Credit Card");
      setCurrency("USD");
      setItems([]);
    }
    setError(null);
  }, [editExpense, categories]);

  const handleAddItem = () => {
    setItems([...items, { name: "", price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    
    // Auto recalculates amount based on items sum
    const itemsTotal = updated.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    setAmount(parseFloat((itemsTotal + Number(tax)).toFixed(2)));
  };

  const handleItemChange = (index: number, field: keyof ExpenseItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);

    // Auto calculates total amount
    const itemsTotal = updated.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    setAmount(parseFloat((itemsTotal + Number(tax)).toFixed(2)));
  };

  const handleRecalculateAmount = () => {
    if (items.length === 0) return;
    const itemsTotal = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    setAmount(parseFloat((itemsTotal + Number(tax)).toFixed(2)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim()) {
      setError("Please specify a merchant or vendor or location.");
      return;
    }
    if (amount <= 0) {
      setError("Please insert a positive amount total.");
      return;
    }
    if (!date) {
      setError("Please input a valid date.");
      return;
    }

    onSave({
      id: editExpense?.id,
      merchant: merchant.trim(),
      amount: parseFloat(amount.toFixed(2)),
      date,
      category,
      description: description.trim(),
      tax: parseFloat(tax.toFixed(2)) || 0,
      paymentMethod,
      currency,
      items: items.length > 0 ? items.filter(it => it.name.trim() !== "") : undefined,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm max-w-2xl mx-auto" id="manual-expense-form-root">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
        <h3 className="text-base font-semibold text-gray-800">
          {editExpense ? "Modify Transaction Details" : "Manually log a financial transaction"}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Cancel"
          id="btn-close-form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-4 text-xs font-semibold p-3 bg-red-50 text-red-700 border border-red-155 rounded-xl flex items-center gap-2">
          <span>Warning:</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Merchant / Vendor</label>
            <input
              type="text"
              required
              placeholder="e.g. Starbucks, Amazon"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
              id="form-input-merchant"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Amount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 font-medium"
                id="form-input-amount"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Receipt Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
              id="form-input-date"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ledger Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-white"
              id="form-select-category"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-white"
              id="form-select-paymethod"
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Mobile Payment">Mobile Payment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estimated Tax ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                value={tax || ""}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                id="form-input-tax"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description / Notes</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add general details or explanations..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 h-16"
            id="form-input-description"
          />
        </div>

        {/* Manual Items Breakdown Form */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Itemized Breakdown (Optional)</span>
            <div className="flex gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleRecalculateAmount}
                  className="text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-55 hover:bg-indigo-100/50 px-2 py-1 rounded-lg border border-indigo-200/20 transition-all flex items-center gap-1 cursor-pointer"
                  title="Sum all item prices to update Total Total Amount"
                >
                  <Calculator className="w-3 h-3" />
                  Auto-sum total
                </button>
              )}
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
                id="form-add-lineitem"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item Line
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-gray-400 italic p-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-150">
              No individual items listed. Click "Add Item Line" to specify a purchase item list.
            </p>
          ) : (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-center bg-gray-50 p-2 rounded-xl border border-gray-150 animate-fade-in">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Milk, Keyboard"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, "name", e.target.value)}
                    className="flex-3 bg-white px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 font-medium text-gray-800"
                  />
                  <div className="flex-1 relative flex items-center">
                    <span className="text-xs text-gray-400 mr-1">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.price || ""}
                      onChange={(e) => handleItemChange(index, "price", parseFloat(e.target.value) || 0)}
                      className="w-full bg-white px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 font-semibold text-gray-800 text-right"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                    id={`form-remove-lineitem-${index}`}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 bg-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
            id="btn-form-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-sm flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
            id="btn-form-save"
          >
            <Check className="w-4 h-4" />
            {editExpense ? "Save Modifications" : "Record Transaction"}
          </button>
        </div>
      </form>
    </div>
  );
}
