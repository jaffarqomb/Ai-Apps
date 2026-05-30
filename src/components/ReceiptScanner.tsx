import React, { useState, useRef } from "react";
import { Camera, Upload, Sparkles, Check, AlertCircle, Loader2, RefreshCw, Plus, Trash } from "lucide-react";
import { Expense, ReceiptScanResult, ExpenseItem } from "../types";

interface ReceiptScannerProps {
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  categories: string[];
}

export default function ReceiptScanner({ onAddExpense, categories }: ReceiptScannerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Scanned Fields for Review
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);

  // Form Editing State
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Miscellaneous");
  const [description, setDescription] = useState("");
  const [tax, setTax] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Unknown");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<ExpenseItem[]>([]);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, or WEBP).");
      return;
    }
    setError(null);
    setImageType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setScanResult(null); // Reset review form
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Camera Logic
  const startCamera = async () => {
    setError(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error(err);
      setError("Could not access camera. Please confirm camera permissions.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setSelectedImage(dataUrl);
        setImageType("image/jpeg");
        stopCamera();
      }
    }
  };

  const triggerScan = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: imageType || "image/jpeg",
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to scan receipt.");
      }

      const parsed: ReceiptScanResult = await response.json();
      setScanResult(parsed);
      
      // Load values into local editing state
      setMerchant(parsed.merchant || "Unknown Store");
      setAmount(parsed.amount || 0);
      setDate(parsed.date || new Date().toISOString().split("T")[0]);
      setCategory(categories.includes(parsed.category) ? parsed.category : "Miscellaneous");
      setDescription(parsed.description || "");
      setTax(parsed.tax || 0);
      setPaymentMethod(parsed.paymentMethod || "Unknown");
      setCurrency(parsed.currency || "USD");
      setItems(parsed.items || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during scanning. Make sure your server-side API is fully accessible.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveScanned = () => {
    if (!merchant || amount <= 0 || !date) {
      setError("Please provide a valid Merchant, Amount greater than zero, and Date.");
      return;
    }

    onAddExpense({
      merchant,
      amount,
      date,
      category,
      description,
      tax,
      paymentMethod,
      currency,
      items: items.length > 0 ? items : undefined,
      isScanned: true,
    });

    // Reset All State
    setSelectedImage(null);
    setScanResult(null);
    setError(null);
  };

  // Helper callbacks to edit list items manually during translation check
  const handleItemChange = (index: number, field: keyof ExpenseItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
    
    // Recalculate total if requested based on item sum
    const totalSum = updated.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    setAmount(parseFloat((totalSum + Number(tax)).toFixed(2)));
  };

  const handleAddItem = () => {
    setItems([...items, { name: "New Item", price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    const totalSum = updated.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    setAmount(parseFloat((totalSum + Number(tax)).toFixed(2)));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6" id="receipt-scanner-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI Receipt Scanner
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Capture or upload a receipt. Gemini AI will instantly parse merchant, date, line items, and final totals.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-2.5 text-sm border border-red-100" id="scan-error-log">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Scanner Status:</span> {error}
          </div>
        </div>
      )}

      {/* Grid layout depending on active state */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image Source File Upload/Camera */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-4">
            {!selectedImage && !showCamera && (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-colors min-h-[300px] cursor-pointer ${
                  dragActive ? "border-indigo-500 bg-indigo-50/20" : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                }`}
                onClick={() => document.getElementById("receipt-file-picker")?.click()}
                id="receipt-drop-zone"
              >
                <div className="p-4 bg-white shadow-xs rounded-full border border-gray-100 mb-4 text-gray-400">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-medium text-gray-800">Drag & drop your receipt, or click to browse</p>
                <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG, WEBP files up to 10MB</p>
                <input
                  type="file"
                  id="receipt-file-picker"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {showCamera && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center min-h-[300px]" id="camera-stream-box">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                  <button
                    onClick={capturePhoto}
                    className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    id="btn-camera-capture"
                  >
                    <Check className="w-4 h-4" />
                    Take Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2.5 bg-gray-900/80 hover:bg-gray-900 text-white font-medium rounded-xl text-sm transition-all cursor-pointer"
                    id="btn-camera-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selectedImage && !showCamera && (
              <div className="relative border border-gray-200 rounded-2xl bg-gray-100/50 aspect-[3/4] max-h-[420px] overflow-hidden flex items-center justify-center" id="receipt-preview-box">
                <img src={selectedImage} alt="Receipt preview" className="max-w-full max-h-full object-contain" />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                  title="Remove Image"
                  id="btn-remove-preview-img"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex gap-3">
              {!showCamera && (
                <button
                  onClick={startCamera}
                  className="flex-1 px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  id="btn-toggle-camera"
                >
                  <Camera className="w-4 h-4" />
                  Use Camera
                </button>
              )}
              {selectedImage && !isScanning && !scanResult && (
                <button
                  onClick={triggerScan}
                  className="flex-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  id="btn-trigger-ai-scan"
                >
                  <Sparkles className="w-4 h-4" />
                  Scan with Gemini AI
                </button>
              )}
              {isScanning && (
                <button
                  disabled
                  className="flex-2 px-5 py-2.5 bg-indigo-50 text-indigo-800 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 border border-indigo-100 transition-colors cursor-pointer"
                  id="btn-scan-disabled-spinner"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-650" />
                  Analyzing Receipt...
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4 italic text-center">
            Tip: For best accuracy, make sure the receipt is flat and text is clearly readable in good lighting.
          </p>
        </div>

        {/* Right Column: Extracted Values Verification From Gemini OR Loading Placeholder */}
        <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-8 pt-6 lg:pt-0">
          {!isScanning && !scanResult ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4" id="placeholder-waiting-scan">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100/30">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">Review Form Empty</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-1">
                Upload your receipt and click <strong className="font-semibold text-indigo-600">Scan with Gemini AI</strong>. The parsed parameters will populate here for quick approval.
              </p>
            </div>
          ) : isScanning ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center" id="scanning-loading-view">
              <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-55 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                <Sparkles className="w-6 h-6 text-indigo-600 animate-bounce" />
              </div>
              <h3 className="text-base font-semibold text-indigo-900">Processing with Gemini 3.5 Flash</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-2">
                Running optical character recognition (OCR) and intelligent field categorizations. This usually takes 2-4 seconds.
              </p>
            </div>
          ) : (
            /* Review & Finalize Form */
            <div className="space-y-5" id="scan-review-form-block">
              <div className="flex items-center justify-between border-b border-gray-105 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  <h3 className="text-base font-semibold text-gray-800">Scan Complete! Review Fields</h3>
                </div>
                <button
                  onClick={triggerScan}
                  className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  id="btn-re-run-scan"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-scan
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Merchant</label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    id="edit-scanned-merchant"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-400">{currency === "USD" ? "$" : currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount || ""}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      id="edit-scanned-amount"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    id="edit-scanned-date"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-white"
                    id="edit-scanned-category"
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
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="Cash, Credit, etc."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    id="edit-scanned-paymethod"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tax Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tax || ""}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      id="edit-scanned-tax"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Memo / Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 h-16"
                  placeholder="Additional notes about purchase..."
                  id="edit-scanned-description"
                />
              </div>

              {/* Individual Line Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Line Items Breakdown</label>
                  <button
                    onClick={handleAddItem}
                    className="text-xs text-indigo-650 hover:text-indigo-755 font-medium flex items-center gap-1 cursor-pointer"
                    id="btn-scanned-add-item"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-gray-500 italic p-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    No individual line items processed. You can add them manually above.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1" id="scanned-items-edit-list">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, "name", e.target.value)}
                          placeholder="Item Name"
                          className="flex-3 bg-transparent text-xs border-b border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none py-0.5 px-1 font-medium text-gray-800"
                        />
                        <div className="flex-1 relative flex items-center">
                          <span className="text-xs text-gray-400 mr-1">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price || ""}
                            onChange={(e) => handleItemChange(index, "price", parseFloat(e.target.value) || 0)}
                            placeholder="Price"
                            className="w-full bg-transparent text-xs border-b border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none py-0.5 text-right font-medium text-gray-800"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          id={`btn-remove-scanned-item-${index}`}
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Currency defaults to USD</span>
                <button
                  onClick={handleSaveScanned}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  id="btn-confirm-save-scanned"
                >
                  <Check className="w-4 h-4" />
                  Save Scanned Expense
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Embedded canvas & camera fallback mechanism */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
