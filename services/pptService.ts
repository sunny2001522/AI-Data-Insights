import PptxGenJS from 'pptxgenjs';
import { AnalysisResult, ReportData } from '../types';

export const generatePPT = async (appName: string, data: ReportData, analysis: AnalysisResult) => {
  const pres = new PptxGenJS();

  // 1. Set Meta Data
  pres.author = 'App Analytics AI';
  pres.company = 'Gemini Powered';
  pres.subject = `${appName} Weekly Report`;
  pres.title = `${appName} Data Analysis`;

  // 2. Master Slide Layout (Theme)
  pres.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: 'F3F4F6' },
    objects: [
      {
        rect: { x: 0, y: 0, w: '100%', h: 0.75, fill: { color: '1E3A8A' } }, // Dark Blue Header
      },
      {
        text: {
          text: 'App Analytics AI',
          options: { x: 0.2, y: 0.15, fontFace: 'Arial', fontSize: 14, color: 'FFFFFF', bold: true },
        },
      },
      {
        line: { x: 0, y: 6.8, w: '100%', h: 0, line: { color: '1E3A8A', width: 2 } } // Footer line
      }
    ],
  });

  // 3. Title Slide
  const slide1 = pres.addSlide();
  slide1.background = { color: '1E3A8A' }; // Dark Blue Background
  slide1.addText(`${appName}`, {
    x: 1, y: 2, w: '80%', h: 1,
    fontSize: 44, color: 'FFFFFF', align: 'center', bold: true
  });
  slide1.addText(`週度數據分析報告`, {
    x: 1, y: 3, w: '80%', h: 0.5,
    fontSize: 24, color: 'A5B4FC', align: 'center'
  });
  slide1.addText(`生成日期: ${new Date().toLocaleDateString()}`, {
    x: 1, y: 3.8, w: '80%', h: 0.5,
    fontSize: 14, color: 'E0E7FF', align: 'center'
  });

  // 4. Generate Content Slides from Gemini Analysis
  if (analysis.slides && analysis.slides.length > 0) {
    analysis.slides.forEach((content) => {
      const slide = pres.addSlide({ masterName: 'MASTER_SLIDE' });
      
      // Title
      slide.addText(content.title || "分析詳情", {
        x: 0.5, y: 0.2, w: '90%', h: 0.5,
        fontSize: 24, color: 'FFFFFF', bold: true
      });

      // Content (Bullets)
      // Fix: Safety check for bullets array
      const bullets = content.bullets || [];
      if (bullets.length > 0) {
        const bulletConfig = bullets.map(b => ({ text: b, options: { breakLine: true } }));
        
        slide.addText(bulletConfig, {
          x: 0.5, y: 1.2, w: '90%', h: 5,
          fontSize: 18, color: '374151', bullet: true, lineSpacing: 35
        });
      } else {
        slide.addText("尚無詳細重點。", {
           x: 0.5, y: 1.2, w: '90%', h: 1,
           fontSize: 18, color: '6B7280'
        });
      }

      // Speaker Notes
      if (content.speaker_notes) {
        slide.addNotes(content.speaker_notes);
      }
    });
  }

  // 5. Data Overview Slide (Hardcoded from metrics)
  const metricSlide = pres.addSlide({ masterName: 'MASTER_SLIDE' });
  metricSlide.addText('本週核心數據總覽', {
    x: 0.5, y: 0.2, w: '90%', h: 0.5,
    fontSize: 24, color: 'FFFFFF', bold: true
  });

  // Create a table for metrics
  const tableData = [
    [
      { text: '指標', options: { bold: true, fill: 'E0E7FF' } }, 
      { text: '數值', options: { bold: true, fill: 'E0E7FF' } }, 
      { text: 'WoW 變化', options: { bold: true, fill: 'E0E7FF' } }
    ],
    ['下載數', data.metrics.downloads.toLocaleString(), `${data.wow.downloads}%`],
    ['活躍用戶', data.metrics.activeUsers.toLocaleString(), `${data.wow.activeUsers}%`],
    ['七日留存', `${data.metrics.retention7d}%`, `${data.wow.retention}%`],
  ];

  metricSlide.addTable(tableData, {
    x: 1, y: 1.5, w: 8,
    rowH: 0.75, colW: [3, 2.5, 2.5],
    fontSize: 16, border: { pt: 1, color: 'd1d5db' }
  });

  // 6. Summary Slide
  const summarySlide = pres.addSlide({ masterName: 'MASTER_SLIDE' });
  summarySlide.addText('分析總結', {
    x: 0.5, y: 0.2, w: '90%', h: 0.5,
    fontSize: 24, color: 'FFFFFF', bold: true
  });
  summarySlide.addText(analysis.summary || "本週數據分析完成。", {
    x: 0.5, y: 1.5, w: '90%', h: 4,
    fontSize: 20, color: '1F2937'
  });

  // Save
  await pres.writeFile({ fileName: `${appName}_Report_${new Date().toISOString().split('T')[0]}.pptx` });
};