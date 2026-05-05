import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY as string
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askAssistant(query: string, context: string, history: ChatMessage[] = []) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an expert in the field of neuro-atypical children, in the following context : ‘You are a specialist in supporting neuro-atypical children, and you must answer questions from a parent of an autistic child to help them support their child effectively within the autism spectrum.’
    Your answers must be based on the text provided and must not contradict it. You may suggest other avenues for consideration.
    Your answer must be limited to a maximum of 200 words.
    Toutes les réponses doivent être en français.
    
    CONTEXT:
    ${context}
  `;

  // Format history for Gemini API
  const contents = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Add the current query
  contents.push({
    role: 'user',
    parts: [{ text: query }]
  });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
