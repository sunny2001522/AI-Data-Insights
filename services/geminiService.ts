
import { GoogleGenAI } from "@google/genai";
import { ReportData, AnalysisResult, AppConfig } from "../types";

const API_KEY = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeData = async (appConfig: AppConfig, data: ReportData): Promise<AnalysisResult> => {
  const modelId = "gemini-2.0-flash"; 

  const storeInfo = appConfig.appStoreLink || appConfig.playStoreLink 
    ? `App Store/Play Store 連結已提供，請假設你已爬取了最新的用戶評論與評分趨勢 (模擬數據)。` 
    : `未提供商店連結，請基於一般市場趨勢模擬評論數據。`;

  const prompt = `
    你是一位頂尖的產品數據分析師。請根據以下數據進行分析,並生成週報。
    
    【產品資訊】
    - App 名稱: ${appConfig.name}
    - Store 資訊: ${storeInfo}

    【本週核心數據】
    - 總下載: ${data.metrics.downloads.toLocaleString()} (WoW: ${data.wow.downloads}%)
    - 活躍用戶(WAU): ${data.metrics.activeUsers.toLocaleString()} (WoW: ${data.wow.activeUsers}%)
    - 7日留存: ${data.metrics.retention7d}% (WoW: ${data.wow.retention}%)
    
    【日趨勢數據 (最近7天)】
    ${JSON.stringify(data.dailyStats)}

    【外部情報 (模擬)】
    - 產品更新: ${JSON.stringify(data.productUpdates)}
    - 社群與評論: ${data.reviewsSummary} ${data.socialMentions}

    【分析要求】
    1. **深度歸因與行動合併**: 請不要分開寫洞見和建議。針對每個觀察到的現象 (歸因)，直接給出對應的具體行動。
       例如: "連假造成活躍下降 (現象) -> 宜趁連假末尾加大推播曝光 (行動)"。
    2. **下週 OKR**: 根據當前趨勢與 WoW，設定合理的下週目標。
    3. **每日數據解讀**: 觀察日趨勢數據，指出是否有特定日期的異常波動。
    
    請按以下 JSON 格式輸出: 
    { 
        "health_status": "正常" | "需關注" | "異常", 
        "summary": "數據健康度總評與日趨勢觀察 (80字內)", 
        "merged_insights": [ 
            { 
                "title": "分析主題 (如: 留存率下滑、活躍度異常)", 
                "observation": "觀察到的現象與歸因 (e.g. 近日收到低星評價導致留存下降)", 
                "action": "具體建議行動 (e.g. 優先修復 Bug 並回覆評論)",
                "evidence": "數據或評論來源", 
                "impact_level": "高" | "中" | "低"
            } 
        ], 
        "risks": ["風險警示"], 
        "next_week_target": { 
            "downloads": 數值, 
            "active_users": 數值, 
            "retention_7d": 數值 
        },
        "slides": [
            {
                "title": "PPT 標題",
                "bullets": ["重點 1", "重點 2"],
                "speaker_notes": "演講稿"
            }
        ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const match = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (match) text = match[1];
    
    let result: AnalysisResult;
    try {
        result = JSON.parse(text) as AnalysisResult;
    } catch (e) {
        console.error("JSON Parse Error", text);
        throw new Error("AI 格式解析失敗");
    }
    
    // Defaults
    result.merged_insights = result.merged_insights || [];
    result.risks = result.risks || [];
    result.slides = result.slides || [];
    
    if (!result.next_week_target) {
        result.next_week_target = {
            downloads: Math.round(data.metrics.downloads * 1.05),
            active_users: Math.round(data.metrics.activeUsers * 1.05),
            retention_7d: data.metrics.retention7d
        };
    }
    
    return result;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};
