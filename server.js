
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001; // Backend runs on 3001, Frontend on 3000

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- Supabase Configuration ---
const SUPABASE_URL = 'https://qozrcckqztsikaiopbca.supabase.co';
// 注意：後端通常使用 Service Role Key，但為了方便 demo，我們沿用你提供的 Key
const SUPABASE_KEY = 'DjN9SRxtvrBxLhRzfcPJle3VZGA1pjevUW90HBsuNLXw2pnbzSKy0Mg8MmL9dfpDRHD1kkVUxMzvLEXK6o6Flw==';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 1. Proxy Endpoints (Fixes CORS) ---

// Mixpanel Proxy
app.post('/api/mixpanel', async (req, res) => {
  const { token, secret, fromDate, toDate } = req.body;
  
  if (!token || !secret) {
    return res.status(400).json({ error: 'Missing token or secret' });
  }

  const authHeader = 'Basic ' + Buffer.from(secret + ':').toString('base64');
  const BASE_URL = 'https://mixpanel.com/api/2.0';

  try {
    // 這裡我們示範抓取 Segmentation 數據
    // 實際應用中，你可能需要根據具體 Event 修改
    const event = '$app_open'; // 或 'App Install'
    const url = `${BASE_URL}/segmentation?event=${event}&from_date=${fromDate}&to_date=${toDate}&type=general&unit=week`;

    const response = await axios.get(url, {
      headers: { 'Authorization': authHeader }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Mixpanel Proxy Error:', error.response?.data || error.message);
    // 如果 Mixpanel 失敗，我們回傳模擬數據以確保 Demo 流程能走下去
    // 在生產環境請移除這個 mock fallback
    res.json({
        data: {
            series: { "2023-01-01": 1234 } // Mock structure
        },
        mocked: true
    });
  }
});

// Google Chat Proxy
app.post('/api/chat', async (req, res) => {
  const { webhookUrl, message } = req.body;

  if (!webhookUrl || !message) {
    return res.status(400).json({ error: 'Missing webhookUrl or message' });
  }

  try {
    await axios.post(webhookUrl, message, {
      headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Google Chat Proxy Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to send message to Google Chat' });
  }
});

// --- 2. Cron Jobs (Automation) ---

// 排程：每週一 早上 09:00 執行
cron.schedule('0 9 * * 1', async () => {
  console.log('⏰ [CRON] Starting weekly report generation task...');
  
  try {
    // 1. 從 Supabase 撈取所有 App
    const { data: apps, error } = await supabase.from('product').select('*');
    
    if (error) throw error;

    if (!apps || apps.length === 0) {
      console.log('📭 No apps found to process.');
      return;
    }

    console.log(`📋 Found ${apps.length} apps. Processing...`);

    // 2. 遍歷每個 App 執行分析 (簡化版邏輯)
    for (const app of apps) {
        console.log(`Processing ${app.Name}...`);
        // 在這裡，你會呼叫 Python Script 或是執行類似 GeminiService 的邏輯
        // 由於 GeminiService 目前在前端，完整的後端自動化需要將 analyzeData 移至後端
        
        // 模擬：發送通知說開始分析
        if (app.chat_webhook_url) {
            await axios.post(app.chat_webhook_url, {
                text: `🤖 [自動排程] 開始分析 ${app.Name} 的週度數據...`
            }).catch(e => console.error('Webhook fail', e.message));
        }
    }

    console.log('✅ [CRON] Weekly task completed.');

  } catch (err) {
    console.error('❌ [CRON] Task failed:', err);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Backend Server running at http://localhost:${PORT}`);
  console.log(`🔗 CORS Proxy ready for Mixpanel & Google Chat`);
  console.log(`⏰ Cron Jobs initialized`);
});
