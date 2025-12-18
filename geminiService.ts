
import { GoogleGenAI, Type } from "@google/genai";

declare const process: {
  env: {
    API_KEY: string;
  }
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'null' || apiKey === 'undefined') return null;
  return new GoogleGenAI({ apiKey });
};

export const getDailyFortune = async (totalBalance: number) => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是理財占卜師。根據用戶總資產 $${totalBalance}，生成今日財運。
      請回傳 JSON 格式：
      {
        "score": number (1-100),
        "fortune": "簡短的一句話運勢",
        "luckyColor": "顏色名稱",
        "tip": "今日理財建議"
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            fortune: { type: Type.STRING },
            luckyColor: { type: Type.STRING },
            tip: { type: Type.STRING }
          },
          required: ["score", "fortune", "luckyColor", "tip"]
        }
      }
    });
    
    // 使用轉型確保 tsc 不會對 .text 屬性報錯
    const text = (response as any).text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Daily fortune error:", error);
    return null;
  }
};

export const getFinancialAdvice = async (transactions: any[], accounts: any[]) => {
  const ai = getAIClient();
  if (!ai) return "系統偵測到未設定 API Key。";

  try {
    const dataSummary = {
      accounts: accounts.map(a => ({ name: a.name, balance: a.balance })),
      recentTransactions: transactions.slice(0, 10).map(t => ({
        amount: t.amount, type: t.type, category: t.category, date: t.date
      }))
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `請根據以下財務數據提供理財建議：${JSON.stringify(dataSummary)}。使用繁體中文，Markdown 格式。`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });

    return (response as any).text || "無法生成建議內容。";
  } catch (error) {
    console.error("AI Advice error:", error);
    return "AI 服務暫時無法連線。";
  }
};
