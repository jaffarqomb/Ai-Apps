import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Initialize Gemini SDK with User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for receipt images (base64 strings)
  app.use(express.json({ limit: "15mb" }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Receipt Scanner endpoint utilizing gemini-3.5-flash
  app.post("/api/scan-receipt", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: "Missing imageBase64 or mimeType representation" });
      }

      // Check if API key is provided
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY environment variable is missing on the server. Please add it in Settings > Secrets." 
        });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const imagePart = {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType,
        },
      };

      const textPart = {
        text: `Analyze this receipt or invoice image. Identify the merchant or store name, transaction date, category, total charge amount, tax amount, individual items bought with item price, payment method, and currency code. Be highly accurate. Convert numbers strictly to JSON values.
Categories choice options (choose the single best fit):
- Food & Dining
- Shopping & Retail
- Transportation & Auto
- Utilities & Bills
- Housing & Rent
- Entertainment & Leisure
- Healthcare & Medical
- Travel & Lodging
- Work & Professional
- Miscellaneous`,
      };

      // Query Gemini with structured output schemas
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              merchant: { type: Type.STRING, description: "Name of the vendor/merchant. Default: 'Unknown Store'" },
              amount: { type: Type.NUMBER, description: "Total checkout payment amount as a positive float value" },
              date: { type: Type.STRING, description: "The date of purchase in YYYY-MM-DD. Infer closest value. Default: current date" },
              category: { type: Type.STRING, description: "Chosen from standard list. Default: 'Miscellaneous'" },
              description: { type: Type.STRING, description: "Brief high-level summary of ingredients or items" },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name of the item" },
                    price: { type: Type.NUMBER, description: "Price per item" },
                  },
                  required: ["name", "price"],
                },
                description: "Array of line items if readable from description",
              },
              tax: { type: Type.NUMBER, description: "Tax charged on the bill if readable, else 0" },
              paymentMethod: { type: Type.STRING, description: "Card (Credit/Debit), Cash, Mobile Pay, or Unknown" },
              currency: { type: Type.STRING, description: "Three-letter code e.g. USD, EUR, etc. Default: USD" },
            },
            required: ["merchant", "amount", "date", "category", "description", "currency"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: "Empty response from Gemini AI scanning model." });
      }

      const jsonResult = JSON.parse(text.trim());
      res.json(jsonResult);
    } catch (error: any) {
      console.error("Receipt scanning error:", error);
      res.status(500).json({ 
        error: error?.message || "An exception occurred while scanning the receipt." 
      });
    }
  });

  // Serve static UI assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
