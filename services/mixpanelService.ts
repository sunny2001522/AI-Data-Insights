
import { ReportData, DailyStat } from "../types";

// 輔助函數：產生過去 7 天的模擬每日數據
const generateDailyStats = (baseDownloads: number, baseActive: number): DailyStat[] => {
    const stats: DailyStat[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        
        // Add some random noise
        const noiseD = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
        const noiseA = 0.9 + Math.random() * 0.2; // 0.9 - 1.1
        
        stats.push({
            date: d.toISOString().split('T')[0].slice(5), // "MM-DD"
            downloads: Math.floor((baseDownloads / 7) * noiseD),
            activeUsers: Math.floor((baseActive / 7) * noiseA)
        });
    }
    return stats;
};

const PROXY_URL = 'http://localhost:3001/api/mixpanel';

export const fetchMixpanelStats = async (
  token: string, 
  secret: string
): Promise<Partial<ReportData>> => {
  
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. 嘗試透過 Proxy 抓取 (如果有跑本地後端)
    // 設定短 Timeout，失敗就馬上轉 Mock
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超時

    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, secret }),
        signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
        const result = await response.json();
        if (!result.mocked) {
            return result; // 如果後端真的有抓到資料
        }
    }
    throw new Error("Proxy unavailable");

  } catch (error) {
    console.log("Falling back to Mock Data for Demo.");
    
    // 2. Fallback Mock Data (真實感的模擬數據)
    const baseDownloads = 5000 + Math.floor(Math.random() * 3000);
    const baseActive = 20000 + Math.floor(Math.random() * 5000);
    const dailyStats = generateDailyStats(baseDownloads, baseActive);

    return {
        metrics: {
            weekStart: today,
            downloads: baseDownloads,
            activeUsers: baseActive,
            retention7d: parseFloat((30 + Math.random() * 15).toFixed(1))
        },
        dailyStats: dailyStats,
        wow: {
            downloads: parseFloat(((Math.random() * 20) - 5).toFixed(1)),
            activeUsers: parseFloat(((Math.random() * 10) - 2).toFixed(1)),
            retention: parseFloat(((Math.random() * 5) - 1).toFixed(1))
        }
    };
  }
};

export const fetchDailyStats = async (appId: string): Promise<DailyStat[]> => {
    // In a real app, this would fetch granular data from Mixpanel
    return generateDailyStats(8000, 25000);
}
