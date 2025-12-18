
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// 聲明環境變數型別以通過 tsc 編譯
declare const process: {
  env: {
    API_KEY: string;
  }
};

export const getFinancialAdvice = async (transactions: any[], accounts: any[]) => {
  // 檢查 API Key 是否有效
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'null' || apiKey === 'undefined') {
    return "系統偵測到未設定 API Key，無法提供 AI 分析。請確保在 GitHub Secrets 或環境變數中設定 API_KEY。";
  }

  try {
    // 根據規範初始化 GoogleGenAI
    const ai = new GoogleGenAI({ apiKey });

    const dataSummary = {
      accounts: accounts.map(a => ({ name: a.name, balance: a.balance })),
      recentTransactions: transactions.slice(0, 15).map(t => ({
        amount: t.amount,
        type: t.type,
        category: t.category,
        note: t.note,
        date: t.date
      }))
    };

    const prompt = `
      你是 SmartFinance AI 財務顧問。請根據以下用戶的財務數據提供 3-5 條具體的理財建議。
      請分析收支比例、潛在的浪費、以及資產配置。
      輸出格式要求：
      1. 使用繁體中文。
      2. 格式要專業且親切。
      3. 以 Markdown 格式輸出。

      數據內容：
      ${JSON.stringify(dataSummary, null, 2)}
    `;

    // 使用 gemini-3-pro-preview 處理複雜推理任務
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    // 規範要求直接存取 .text 屬性，不使用方法調用
    return response.text || "AI 目前無法生成建議，請稍後再試。";
  } catch (error) {
    console.error("Gemini AI Analysis error:", error);
    return "AI 服務暫時無法回應。可能是 API 額度已滿或網路連線問題。";
  }
};
