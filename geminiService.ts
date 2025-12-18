
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// 聲明環境變數型別以通過 tsc 編譯
declare const process: {
  env: {
    API_KEY: string;
  }
};

export const getFinancialAdvice = async (transactions: any[], accounts: any[]) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'null' || apiKey === 'undefined') {
    return "系統偵測到未設定 API Key，無法提供 AI 分析。請在環境變數或專案設定中加入 API_KEY。";
  }

  try {
    // 正確初始化 AI 客戶端
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
      請針對當前資產狀態與最近支出模式進行分析。
      
      格式要求：
      1. 使用繁體中文。
      2. 專業且富有鼓勵性。
      3. 以 Markdown 格式輸出。

      用戶數據摘要：
      ${JSON.stringify(dataSummary, null, 2)}
    `;

    // 呼叫 Gemini 3 Pro 進行生成
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    // 根據規範，直接讀取 .text 屬性（非方法）
    return response.text || "AI 暫時無法生成分析報告，請稍後再試。";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "AI 服務目前的連線有些問題，請檢查 API 金鑰額度。";
  }
};
