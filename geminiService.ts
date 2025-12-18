
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

export const getFinancialAdvice = async (transactions: any[], accounts: any[]) => {
  if (!apiKey) {
    return "系統偵測到未設定 API Key，無法提供 AI 分析。請聯絡系統管理員或檢查 GitHub Secrets 設定。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-pro-preview';

    const dataSummary = {
      accounts: accounts.map(a => ({ name: a.name, balance: a.balance })),
      recentTransactions: transactions.slice(0, 20).map(t => ({
        amount: t.amount,
        type: t.type,
        category: t.category,
        note: t.note,
        date: t.date
      }))
    };

    const prompt = `
      你是 SmartFinance AI 財務顧問。請根據以下用戶的財務數據提供 3-5 條具體的理財建議。
      分析當前的收支比例、消費習慣，並給予鼓勵。
      請使用繁體中文，格式清晰，並以 Markdown 格式輸出。

      用戶數據摘要：
      ${JSON.stringify(dataSummary, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    return response.text || "AI 暫時無法生成建議，請稍後再試。";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "AI 服務目前無法連線，請檢查網路或 API Key 狀態。";
  }
};
