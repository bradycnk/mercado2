import { GoogleGenAI } from "@google/genai";

// --- ATENCION ---
// COLOCA TU API KEY DE GEMINI AQUI
const apiKey = process.env.API_KEY || ''; 

export const generateProductDescription = async (productTitle: string, category: string): Promise<string> => {
  if (!apiKey) return "Error: API Key de Gemini no configurada. Coloca la key en services/geminiService.ts";

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Escribe una descripción de venta corta, atractiva y profesional para un producto llamado "${productTitle}" que está en la categoría "${category}". Usa máximo 50 palabras.`,
    });
    return response.text || "No se pudo generar la descripción.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generando descripción con IA.";
  }
};