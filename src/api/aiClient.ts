// src/api/aiClient.ts
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const MODELS = [
  "gemini-2.0-flash", 
  "gemini-2.0-flash-lite", 
  "gemini-2.0-pro-exp",
  "gemini-1.5-flash"
];

export const requestAI = async (text: string, mode: "continue" | "complete" = "continue"): Promise<string> => {
  const key = API_KEY;
  
  // 1. IMPROVED PROMPT: Let AI decide length naturally
  let prompt = "";
  if (mode === "complete") {
    // For autocomplete, we still want it relatively short, but we can relax it slightly if needed.
    // Usually autocomplete IS short by definition.
    prompt = `Complete the sentence naturally. Output ONLY the new words. Do NOT repeat the input.\n\nInput: "${text}"`;
  } else {
    // For "Continue Writing", remove the length constraint.
    prompt = `Continue the following text naturally. Determine the appropriate length based on the context (it could be a few sentences or a paragraph). \n\nCRITICAL RULE: Output ONLY the new text. Do NOT repeat the input text provided below.\n\nInput Text:\n"${text}"`;
  }

  for (const model of MODELS) {
    try {
      let result = await fetchGenerateContent(model, key, prompt);
      
      // 2. SAFETY CLEANUP: If AI repeated the text anyway, strip it out.
      const normalizedResult = result.trim();
      const normalizedInput = text.trim();

      if (normalizedResult.startsWith(normalizedInput)) {
        // Remove the repeated part
        result = normalizedResult.slice(normalizedInput.length);
      }
      
      // Remove any leading quotes if the AI added them
      return result.replace(/^"/, "").replace(/^: /, "").trim(); 

    } catch (error: any) {
      if (mode === "continue") console.warn(`Failed with ${model}:`, error.message);
    }
  }
  return "";
};

async function fetchGenerateContent(model: string, key: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
