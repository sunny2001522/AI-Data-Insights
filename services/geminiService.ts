
import { GoogleGenAI, Type } from "@google/genai";
import { ReportData, AnalysisResult } from "../types";

// NOTE: In a real production app, API keys should be handled via a backend proxy.
const API_KEY = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeData = async (appName: string, data: ReportData): Promise<AnalysisResult> => {
  const modelId = "gemini-2.0-flash"; 

  const prompt = `
    你是一位資深的產品數據分析師。請根據以下數據進行深度歸因分析,並生成可執行的決策建議。
    同時，你需要為這些分析生成 4-5 張 PPT 簡報的內容結構。

    【基礎數據】
    - App 名稱: ${appName}
    - 本週數據: 下載 ${data.metrics.downloads}, 活躍用戶 ${data.metrics.activeUsers}, 7日留存 ${data.metrics.retention7d}%
    - WoW 變化: 下載 ${data.wow.downloads}%, 活躍 ${data.wow.activeUsers}%, 留存 ${data.wow.retention}%

    【外部數據 (模擬)】
    - 產品更新: ${JSON.stringify(data.productUpdates)}
    - 用戶評論摘要: ${data.reviewsSummary}
    - 社群聲量: ${data.socialMentions}

    請按以下 JSON 格式輸出: 
    { 
        "health_status": "正常" | "需關注" | "異常", 
        "summary": "數據健康度總評 (50字內)", 
        "insights": [ 
            { 
                "title": "洞見標題", 
                "description": "詳細說明 (100字內)", 
                "evidence": "證據來源", 
                "impact_level": "高" | "中" | "低", 
                "links": ["相關連結"] 
            } 
        ], 
        "actions": [ 
            { 
                "action": "具體行動建議", 
                "priority": "高" | "中" | "低", 
                "expected_impact": "預期影響" 
            } 
        ], 
        "risks": ["風險警示 (若有異常)"], 
        "next_week_target": { 
            "downloads": 1000, 
            "active_users": 5000, 
            "retention_7d": 30.5 
        },
        "slides": [
            {
                "title": "PPT 標題",
                "bullets": ["重點 1", "重點 2", "重點 3"],
                "speaker_notes": "演講備忘稿 (解釋數據背後的原因)"
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
    
    // Robust JSON cleaning
    // 移除 Markdown code blocks
    const match = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (match) {
      text = match[1];
    }
    
    // 嘗試解析
    let result: AnalysisResult;
    try {
        result = JSON.parse(text) as AnalysisResult;
    } catch (e) {
        console.error("JSON Parse Error. Raw Text:", text);
        throw new Error("AI 回傳的格式無法解析，請稍後再試");
    }
    
    // Post-processing to ensure array safety
    result.insights = result.insights || [];
    result.actions = result.actions || [];
    result.risks = result.risks || [];
    result.slides = result.slides || [];
    
    // 確保 next_week_target 存在，否則給預設值
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
