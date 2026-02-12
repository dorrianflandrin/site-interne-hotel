
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedEventData } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MAGIC_FILL_PROMPT = `Tu es l'assistant de rédaction du Domaine Lyon Saint-Joseph.
Ta mission est d'interpréter des notes brutes pour remplir une fiche prestation structurée.

RÈGLES :
1. Extrais les dates, entreprises, effectifs (PAX) et lieux.
2. Si une heure est mentionnée ("déjeuner à 13h"), place-la dans le bon créneau.
3. Si des allergies sont citées, liste-les.
4. Réponds UNIQUEMENT en JSON selon le schéma fourni.`;

export const smartFormatPrestation = async (rawNotes: string): Promise<Partial<ExtractedEventData>> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: `${MAGIC_FILL_PROMPT}\n\nNotes de l'utilisateur :\n${rawNotes}` }] }],
    config: { 
      responseMimeType: "application/json",
      // On utilise un schéma simplifié ici, le but est de donner une structure de base à l'UI
    }
  });
  return JSON.parse(response.text || '{}');
};

export const extractFichePrestaDataFromImage = async (base64Image: string): Promise<ExtractedEventData> => {
    // ... existant ...
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: "Analyse cette fiche de prestation et extrais toutes les données structurées." }, { inlineData: { mimeType: "image/png", data: base64Image.split(',')[1] || base64Image } }] }],
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
};

export const extractFichePrestaDataFromText = async (textData: string): Promise<ExtractedEventData> => {
    // ... existant ...
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: "Analyse ces données CSV de fiche prestation et structure-les en JSON." }, { text: textData }] }],
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
};
