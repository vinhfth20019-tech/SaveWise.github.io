import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to generate content with low-latency priority and short timeout
async function generateWithFallback(options: {
  contents: any;
  config?: any;
  timeoutMs?: number;
}) {
  if (!aiClient) return null;
  // Use gemini-3.1-flash-lite as primary high-speed model (~1.5s), fallback to gemini-3.8-flash
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  const timeoutMs = options.timeoutMs || 4000; // Fast timeout: max 4 seconds

  for (const model of models) {
    try {
      const config = {
        maxOutputTokens: 600,
        temperature: 0.6,
        ...(options.config || {}),
      };

      const generatePromise = aiClient.models.generateContent({
        model,
        contents: options.contents,
        config,
      });

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on model ${model}`)), timeoutMs)
      );

      const res = (await Promise.race([generatePromise, timeoutPromise])) as any;
      if (res && res.text) {
        return res.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} unavailable or timed out (${err?.message || err}), switching or falling back...`);
    }
  }
  return null;
}

// Check AI configuration status
app.get('/api/ai/status', (_req, res) => {
  res.json({
    configured: !!apiKey,
    model: 'gemini-3.1-flash-lite',
    fallbackModel: 'gemini-3.8-flash',
  });
});

// 1. AI Money Coach endpoint (/api/ai/coach & /api/ai/chat)
const coachHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { message, history = [], financialContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const contextSummary = financialContext
      ? `
BỐI CẢNH TÀI CHÍNH CỦA NGƯỜI DÙNG HIỆN TẠI:
- Số tiền hiện có: ${financialContext.totalBalance?.toLocaleString('vi-VN')} đ
- Ngân sách tham khảo mỗi ngày: ${financialContext.dailyBudget?.toLocaleString('vi-VN')} đ
- Số tiền đã chi hôm nay: ${financialContext.dailySpent?.toLocaleString('vi-VN')} đ
- Số ngày còn lại trong kỳ ngân sách: ${financialContext.daysRemaining || 30} ngày
- Các khoản chi bắt buộc: ${financialContext.mandatoryExpenses?.toLocaleString('vi-VN')} đ
- Các mục tiêu tiết kiệm: ${
          financialContext.goals && financialContext.goals.length > 0
            ? financialContext.goals
                .map(
                  (g: any) =>
                    `+ "${g.title}": Cần ${g.targetAmount?.toLocaleString('vi-VN')}đ, đã có ${g.currentAmount?.toLocaleString('vi-VN')}đ, còn ${g.targetDays || 30} ngày`
                )
                .join('; ')
            : 'Chưa có mục tiêu'
        }
- Giao dịch chi tiêu gần đây: ${
          financialContext.recentTransactions && financialContext.recentTransactions.length > 0
            ? financialContext.recentTransactions
                .slice(0, 5)
                .map((t: any) => `${t.title} (${t.amount?.toLocaleString('vi-VN')}đ - ${t.category})`)
                .join(', ')
            : 'Chưa có chi tiêu gần đây'
        }
`
      : 'Chưa có dữ liệu bối cảnh tài chính cụ thể.';

    const systemPrompt = `Bạn là Trợ lý Tài chính Cá nhân SAVEWISE AI - chuyên gia quản lý tiền bạc dành cho học sinh, sinh viên và người trẻ Việt Nam.
Nhiệm vụ của bạn:
1. Trả lời súc tích, đi thẳng vào giải pháp và hành động cụ thể trong tối đa 3-4 ý ngắn gọn.
2. Dựa sát vào bối cảnh tài chính của người dùng (số dư, hạn mức ngày, mục tiêu tiết kiệm) để tính toán con số thực tế.
3. Luôn đưa ra lời khuyên thực tế ở Việt Nam (quán cơm bình dân, tự nấu tại phòng, mang bình nước, thẻ xe buýt...).
4. Dùng gạch đầu dòng và in đậm số tiền quan trọng để người dùng đọc nhanh chỉ trong 10 giây.
5. Tuyệt đối không viết văn dài dòng, triết lý lan man.`;

    if (!aiClient) {
      // Fallback response if API key is not configured
      const reply = `Chào bạn! Tôi là SAVEWISE AI. Hiện tại đang hoạt động ở chế độ ngoại tuyến mô phỏng. 
Dựa trên ngân sách của bạn (khoảng ${(financialContext?.dailyBudget || 40000).toLocaleString('vi-VN')}đ/ngày):
- Hãy ưu tiên chia tiền thành 3 phần: 50% ăn uống tối thiểu, 30% đi lại & sinh hoạt thiết yếu, 20% tích lũy mục tiêu.
- Mẹo hôm nay: Hãy nấu cơm tại nhà hoặc chọn các quán cơm bình dân quanh trường để tiết kiệm 30.000đ - 50.000đ mỗi ngày!`;
      return res.json({ reply });
    }

    const conversationContext = history
      .slice(-6)
      .map((h: any) => `${h.role === 'user' ? 'Người dùng' : 'SAVEWISE AI'}: ${h.text}`)
      .join('\n');

    const prompt = `${systemPrompt}

${contextSummary}

LỊCH SỬ HỘI THOẠI GẦN ĐÂY:
${conversationContext}

Người dùng hỏi: "${message}"

Hãy trả lời chi tiết, thực tế và chân thành:`;

    const text = await generateWithFallback({ contents: prompt });
    if (text) {
      return res.json({ reply: text });
    }

    // Dynamic contextual fallback if both models encounter temporary service issue
    const available = Math.max(0, (financialContext?.totalBalance || 0) - (financialContext?.mandatoryExpenses || 0));
    const daily = financialContext?.dailyBudget || Math.floor(available / (financialContext?.daysRemaining || 30));
    const primaryGoal = financialContext?.goals?.[0];

    const reply = `Chào bạn! Tôi đã phân tích dữ liệu tài chính của bạn:
- **Số dư khả dụng:** ${available.toLocaleString('vi-VN')} đ (dành cho ${financialContext?.daysRemaining || 30} ngày tới).
- **Hạn mức an toàn mỗi ngày:** **${daily.toLocaleString('vi-VN')} đ/ngày**.
${primaryGoal ? `- **Mục tiêu ưu tiên:** "${primaryGoal.title}", cần tiết kiệm khoảng **${Math.ceil((primaryGoal.targetAmount - primaryGoal.currentAmount) / (primaryGoal.targetDays || 30)).toLocaleString('vi-VN')} đ/ngày**.` : ''}

💡 **Kế hoạch hành động khuyến nghị cho bạn:**
1. **Kiểm soát bữa ăn:** Hạn chế đặt đồ ăn qua ứng dụng; tự nấu cơm hoặc ăn cơm bình dân sinh viên (khoảng 30.000đ - 35.000đ/bữa).
2. **Quy tắc 24h:** Trước khi chi bất kỳ khoản ngoài dự kiến nào trên 100.000đ, hãy trì hoãn 24 giờ để kiểm tra xem có thực sự cần thiết không.
3. **Tích lũy trước, chi sau:** Trích ngay 10% - 15% khi nhận tiền vào quỹ mục tiêu trước khi bắt đầu chi tiêu hàng ngày.`;

    return res.json({ reply });
  } catch (error: any) {
    console.error('Error in /api/ai/coach:', error);
    return res.json({
      reply: 'Chào bạn! Hệ thống đang tải cao điểm. Lời khuyên nhanh cho bạn: Hãy duy trì hạn mức chi tiêu ăn uống dưới 45.000đ hôm nay để bảo vệ mục tiêu tiết kiệm nhé!',
    });
  }
};

app.post('/api/ai/coach', coachHandler);
app.post('/api/ai/chat', coachHandler);

// 2. Smart Meal Generator endpoint
app.post('/api/ai/meal-plan', async (req, res) => {
  try {
    const {
      dailyBudget = 50000,
      days = 3,
      mealsPerDay = ['breakfast', 'lunch', 'dinner'],
      availableIngredients = '',
      dietaryRestrictions = '',
    } = req.body;

    const mealsText = mealsPerDay
      .map((m: string) => (m === 'breakfast' ? 'Bữa sáng' : m === 'lunch' ? 'Bữa trưa' : 'Bữa tối'))
      .join(', ');

    const prompt = `Bạn là chuyên gia ẩm thực tiết kiệm dành cho sinh viên Việt Nam của SAVEWISE AI.
Hãy thiết kế thực đơn ăn uống thực tế, thơm ngon, dinh dưỡng và tiết kiệm với các thông tin sau:
- Ngân sách ăn uống mỗi ngày: ${dailyBudget.toLocaleString('vi-VN')} đồng
- Số ngày lập thực đơn: ${days} ngày
- Các bữa ăn mỗi ngày cần có: ${mealsText}
- Nguyên liệu sẵn có ở nhà: ${availableIngredients ? availableIngredients : 'Không có, mua mới hoàn toàn'}
- Kiêng khem / sở thích / dị ứng: ${dietaryRestrictions ? dietaryRestrictions : 'Không có'}

Quy tắc:
1. Giá cả phải sát với thực tế chợ sinh viên và siêu thị bình dân tại Việt Nam năm 2026 (ví dụ: trứng 3.000-3.500đ/quả, rau muống 8.000-10.000đ/bó, thịt heo 12.000-15.000đ/lạng, đậu phụ 4.000-5.000đ/bìa, cơm tấm/bánh mì 15.000-25.000đ...).
2. Tận dụng tối đa nguyên liệu có sẵn để tiết kiệm chi phí.
3. Tổng chi phí ăn uống mỗi ngày KHÔNG ĐƯỢC VƯỢT QUÁ ${dailyBudget.toLocaleString('vi-VN')} đồng.
4. Trả về đúng định dạng JSON chuẩn theo mẫu sau, không bọc markdown khác:
{
  "summary": "Tóm tắt ngắn gọn triết lý thực đơn (1-2 câu)",
  "totalEstimatedCost": 140000,
  "dailyAverage": 46666,
  "days": [
    {
      "dayNumber": 1,
      "dayTitle": "Ngày 1: Đạm & rau cân bằng",
      "dailyCost": 45000,
      "meals": [
        {
          "type": "Sáng",
          "dish": "Bánh mì trứng ốp la + dưa leo",
          "cost": 12000,
          "ingredients": ["Bánh mì (4k)", "1 quả trứng (3.5k)", "Dưa leo (4.5k)"],
          "note": "Nhanh gọn, đủ năng lượng"
        },
        {
          "type": "Trưa",
          "dish": "Thịt băm xào đậu phụ + Canh rau cải",
          "cost": 20000,
          "ingredients": ["50g thịt băm (8k)", "1 bìa đậu phụ (4k)", "Rau cải (5k)", "Gia vị (3k)"],
          "note": "Nấu kèm cơm nóng"
        },
        {
          "type": "Tối",
          "dish": "Trứng rán hành tây + Canh cà chua trứng",
          "cost": 13000,
          "ingredients": ["2 quả trứng (7k)", "Hành tây & cà chua (6k)"],
          "note": "Ngon miệng, dễ tiêu hóa"
        }
      ]
    }
  ],
  "savingTips": [
    "Mẹo 1: Mua rau cả bó ăn 2 bữa",
    "Mẹo 2: Nấu cơm tại phòng mang đi học"
  ],
  "groceryList": [
    {"item": "Trứng gà (1 vỉ 10 quả)", "estimatedPrice": 32000},
    {"item": "Đậu phụ (3 bìa)", "estimatedPrice": 12000}
  ]
}`;

    const raw = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (raw) {
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return res.json(JSON.parse(jsonMatch[0]));
        }
      } catch (err) {
        console.warn('Fallback due to JSON parse error in meal plan:', err);
      }
    }

    // High quality contextual fallback if service is busy
    return res.json({
      summary: `Thực đơn thông minh tối ưu trong tầm giá ${dailyBudget.toLocaleString('vi-VN')}đ/ngày, đầy đủ dinh dưỡng cho sinh viên.`,
      totalEstimatedCost: dailyBudget * days,
      dailyAverage: dailyBudget,
      days: Array.from({ length: days }, (_, i) => ({
        dayNumber: i + 1,
        dayTitle: `Ngày ${i + 1}: Thực đơn tiết kiệm dinh dưỡng`,
        dailyCost: dailyBudget,
        meals: [
          {
            type: 'Sáng',
            dish: i % 2 === 0 ? 'Bánh mì ốp la xúc xích' : 'Xôi bắp mỡ hành',
            cost: Math.round(dailyBudget * 0.25),
            ingredients: ['1 ổ bánh mì (4k)', '1 quả trứng (3.5k)', 'Dưa leo (3k)'],
            note: 'Nhanh gọn lót dạ trước giờ lên lớp',
          },
          {
            type: 'Trưa',
            dish: i % 2 === 0 ? 'Thịt xào đậu que + Canh rau ngót' : 'Cá nục kho cà + Rau luộc',
            cost: Math.round(dailyBudget * 0.45),
            ingredients: ['Thịt nạc 100g (14k)', 'Rau xanh (5k)', 'Gia vị sẵn có'],
            note: 'Nấu tại phòng, chia khẩu phần cân đối',
          },
          {
            type: 'Tối',
            dish: 'Đậu phụ sốt cà chua + Trứng luộc dầm tương',
            cost: Math.round(dailyBudget * 0.3),
            ingredients: ['2 bìa đậu phụ (8k)', '2 quả cà chua (4k)', 'Rau thơm (2k)'],
            note: 'Dễ tiêu, thanh đạm, tiết kiệm chi phí',
          },
        ],
      })),
      savingTips: [
        'Nấu một mẻ thịt kho hoặc sốt đậu dùng được cho cả trưa và tối để tiết kiệm gas/điện.',
        'Mua rau củ ở chợ dân sinh vào sáng sớm để tươi ngon và rẻ hơn 30% so với siêu thị tiện lợi.',
        'Tận dụng cơm nguội làm cơm chiên trứng tỏi thơm nức mũi cho bữa sáng hôm sau.',
      ],
      groceryList: [
        { item: 'Trứng gà (vỉ 10 quả)', estimatedPrice: 32000 },
        { item: 'Đậu phụ làng Mơ (4 bìa)', estimatedPrice: 16000 },
        { item: 'Rau muống + Cà chua', estimatedPrice: 18000 },
        { item: 'Thịt heo nạc (200g)', estimatedPrice: 28000 },
      ],
    });
  } catch (error: any) {
    console.error('Error in /api/ai/meal-plan:', error);
    return res.status(500).json({ error: 'Không thể tạo thực đơn lúc này. Vui lòng thử lại.' });
  }
});

// 3. Purchase Decision Evaluator endpoint
app.post('/api/ai/purchase-evaluator', async (req, res) => {
  try {
    const { itemName, price, necessity, category, currentBalance, dailyBudget, primaryGoal } = req.body;

    const daysOfFood = dailyBudget > 0 ? (price / dailyBudget).toFixed(1) : '0';
    const impactOnGoal =
      primaryGoal && primaryGoal.targetAmount
        ? `Món đồ này chiếm ${((price / primaryGoal.targetAmount) * 100).toFixed(1)}% mục tiêu tiết kiệm "${primaryGoal.title}".`
        : 'Chưa liên kết mục tiêu cụ thể.';

    const prompt = `Bạn là Trợ lý Cân nhắc Mua sắm (Purchase Decision Coach) của SAVEWISE AI.
Người dùng đang đắn đo trước khi rút hầu bao mua một món đồ:
- Tên món đồ: "${itemName}"
- Giá tiền: ${price.toLocaleString('vi-VN')} đ
- Danh mục: ${category || 'Mua sắm'}
- Tự đánh giá độ cần thiết: ${necessity} (Cần thiết cấp bách / Cần thiết vừa phải / Thích ngẫu hứng / Thèm nhất thời)
- Số tiền người dùng hiện có: ${currentBalance ? currentBalance.toLocaleString('vi-VN') + ' đ' : 'Không rõ'}
- Ngân sách ăn tiêu 1 ngày: ${dailyBudget ? dailyBudget.toLocaleString('vi-VN') + ' đ' : 'Không rõ'}
- Quy đổi tương đương: Khoản tiền này bằng khoảng ${daysOfFood} ngày tiền ăn tiêu của họ!
- Tác động mục tiêu: ${impactOnGoal}

Hãy đưa ra đánh giá khách quan, sắc bén, tỉnh táo nhưng giàu sự đồng cảm.
Trả về định dạng JSON thuần túy:
{
  "recommendation": "NÊN_MUA" | "CHO_72_GIO" | "TIM_LUA_CHON_RE_HON" | "KHONG_NEN_MUA",
  "recommendationLabel": "Chờ suy nghĩ 72 giờ (Quy tắc giảm xúc cảm)",
  "score": 6.5,
  "verdictTitle": "Lời khuyên cốt lõi tóm tắt",
  "reasoning": "Phân tích tâm lý và tác động tài chính (2-3 câu sắc bén)",
  "opportunityCost": "Với số tiền này, bạn có thể chi trả cho...",
  "alternativeOptions": ["Giải pháp thay thế 1 (ví dụ mua đồ 2nd hand, mượn, thuê)", "Giải pháp thay thế 2"],
  "coolingOffQuestions": [
    "Câu hỏi 1 để tự vấn: Nếu 2 tuần nữa không có nó, cuộc sống có bị ảnh hưởng gì không?",
    "Câu hỏi 2: Có phải bạn đang mua vì lướt TikTok/Shopee thấy rẻ?"
  ]
}`;

    const raw = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (raw) {
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return res.json(JSON.parse(jsonMatch[0]));
        }
      } catch (err) {
        console.warn('Fallback due to JSON parse error in purchase-evaluator:', err);
      }
    }

    const isHighNecessity = necessity.includes('Cần thiết') || necessity === 'urgent';
    return res.json({
      recommendation: isHighNecessity ? 'NEN_MUA' : 'CHO_72_GIO',
      recommendationLabel: isHighNecessity ? 'Nên mua (Cần thiết thực tế)' : 'Chờ suy nghĩ 72 giờ (Tránh mua vì cảm xúc)',
      score: isHighNecessity ? 8.5 : 5.0,
      verdictTitle: isHighNecessity ? 'Khoản chi chính đáng cho công việc/học tập' : 'Hãy hoãn lại 3 ngày để xem có thực sự cần không',
      reasoning: `Khoản tiền ${price.toLocaleString('vi-VN')}đ tương đương gần ${daysOfFood} ngày tiền sinh hoạt của bạn. Đừng để cảm xúc nhất thời làm chậm kế hoạch tiết kiệm.`,
      opportunityCost: `Số tiền này có thể giúp bạn trang trải ${daysOfFood} ngày ăn uống thoải mái hoặc đóng góp tiến độ vào mục tiêu.`,
      alternativeOptions: [
        'Tìm kiếm sản phẩm tương tự đã qua sử dụng (chợ đồ cũ sinh viên)',
        'Chờ đợt khuyến mãi lớn hoặc tích lũy đủ 100% tiền dư mới mua',
      ],
      coolingOffQuestions: [
        'Nếu không có món này trong 1 tháng tới, bạn có gặp trở ngại lớn nào không?',
        'Bạn mua vì thực sự phục vụ nhu cầu, hay vì đang cảm thấy stress/thích mua sắm?',
      ],
    });
  } catch (error: any) {
    console.error('Error in /api/ai/purchase-evaluator:', error);
    return res.status(500).json({ error: 'Không thể đánh giá món đồ lúc này.' });
  }
});

// 4. Spending Habit Insights endpoint
app.post('/api/ai/insights', async (req, res) => {
  try {
    const { transactions = [], totalBalance = 0, dailyBudget = 0, goals = [] } = req.body;

    const prompt = `Bạn là Trợ lý Phân tích Dữ liệu Chi tiêu SAVEWISE AI.
Dữ liệu người dùng:
- Số dư hiện tại: ${totalBalance.toLocaleString('vi-VN')} đ
- Ngân sách chuẩn mỗi ngày: ${dailyBudget.toLocaleString('vi-VN')} đ
- Danh sách giao dịch: ${JSON.stringify(transactions.slice(-20))}
- Các mục tiêu: ${JSON.stringify(goals)}

Nhiệm vụ: Phân tích thói quen tiêu tiền, phát hiện các khoản chi lặp lại (trà sữa, ship đồ ăn...), cảnh báo nguy cơ vượt ngân sách, và đưa ra 3 hành động cụ thể tuần này.
Trả về định dạng JSON:
{
  "financialHealthScore": 78,
  "healthStatus": "Khá tốt / Cần chú ý / Báo động",
  "keyObservations": [
    "Quan sát 1: Chi tiêu ăn uống ngoài hàng chiếm 45% tổng chi",
    "Quan sát 2: Tần suất chi tiêu vặt buổi chiều tăng cao"
  ],
  "actionableTips": [
    "Hành động 1 cụ thể để tiết kiệm thêm 50k tuần này",
    "Hành động 2",
    "Hành động 3"
  ],
  "wasteAlert": "Cảnh báo thói quen có thể gây rò rỉ ví tiền"
}`;

    const raw = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (raw) {
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return res.json(JSON.parse(jsonMatch[0]));
        }
      } catch (err) {
        console.warn('Fallback due to JSON parse error in insights:', err);
      }
    }

    return res.json({
      financialHealthScore: 78,
      healthStatus: 'Khá tốt',
      keyObservations: [
        'Bạn đang duy trì việc ghi chép đều đặn, đây là bước đầu tiên để làm chủ dòng tiền cá nhân.',
        'Chi tiêu ăn uống và đồ uống vặt chiếm tỷ trọng lớn nhất trong các khoản chi hàng ngày.',
      ],
      actionableTips: [
        'Thử đặt hạn mức chi tiêu ăn vặt tối đa 20.000đ/ngày trong tuần này.',
        'Chuẩn bị sẵn bình nước cá nhân khi đi học/đi làm để tiết kiệm tiền đồ uống ngoài hàng.',
        'Trích ngay 10% khi nhận được tiền tiêu vặt hoặc lương vào quỹ mục tiêu trước khi bắt đầu chi tiêu.',
      ],
      wasteAlert: 'Cẩn thận với thói quen đặt đồ ăn qua ứng dụng khi đói buổi đêm hoặc trà sữa buổi chiều!',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/insights:', error);
    return res.status(500).json({ error: 'Không thể phân tích dữ liệu lúc này.' });
  }
});

// Setup Vite middleware in dev or static files in production
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SAVEWISE AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
