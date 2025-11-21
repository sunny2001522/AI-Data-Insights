import { ReportData } from "../types";

// Since we cannot perform actual backend scraping in this frontend-only demo environment,
// we simulate the data collection phase that would normally happen in Python/Node.

export const fetchAppData = async (appId: string): Promise<ReportData> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Randomize stats slightly for demo purposes
  const baseDownloads = 12000;
  const downloads = Math.floor(baseDownloads + (Math.random() * 4000 - 2000));
  
  const baseActive = 5000;
  const activeUsers = Math.floor(baseActive + (Math.random() * 1000 - 500));

  const retention = parseFloat((35 + Math.random() * 10).toFixed(1));

  return {
    metrics: {
      weekStart: new Date().toISOString().split('T')[0],
      downloads,
      activeUsers,
      retention7d: retention,
    },
    wow: {
      downloads: parseFloat(((Math.random() * 20) - 5).toFixed(1)), // -5% to +15%
      activeUsers: parseFloat(((Math.random() * 15) - 5).toFixed(1)),
      retention: parseFloat(((Math.random() * 5) - 2).toFixed(1)),
    },
    productUpdates: [
      "v2.1.0: 新增 AI 摘要功能",
      "v2.1.1: 修復登入閃退問題"
    ],
    reviewsSummary: "用戶普遍好評 AI 準確度提升，但部分 Android 機型反應耗電快。",
    socialMentions: "Dcard 軟體版有關於 'AI 會議神器' 的熱門討論 (300+ 互動)，Threads 上有 KOL 推薦。"
  };
};