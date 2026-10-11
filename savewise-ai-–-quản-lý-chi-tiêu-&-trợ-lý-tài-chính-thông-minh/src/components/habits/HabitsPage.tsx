import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  FinancialHealthMetrics,
  PurchaseEvaluationResponse,
  SavingsGoal,
  Transaction,
} from '../../types';
import { formatVND, getCategoryLabel } from '../../utils/formatters';

interface HabitsPageProps {
  metrics: FinancialHealthMetrics;
  goals: SavingsGoal[];
  transactions: Transaction[];
}

export const HabitsPage: React.FC<HabitsPageProps> = ({ metrics, goals, transactions }) => {
  // Evaluator form states
  const [itemName, setItemName] = useState('Tai nghe Bluetooth không dây');
  const [itemPrice, setItemPrice] = useState(650000);
  const [necessity, setNecessity] = useState('medium');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');
  const [evalLoading, setEvalLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<PurchaseEvaluationResponse | null>(null);

  // Analyze spending habits from real transactions
  const expenses = transactions.filter((t) => t.type === 'expense');

  // Category totals
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0] || null;
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Frequent recurring titles
  const titleCounts: Record<string, { count: number; total: number }> = {};
  expenses.forEach((t) => {
    const key = t.title.toLowerCase().trim();
    if (!titleCounts[key]) titleCounts[key] = { count: 0, total: 0 };
    titleCounts[key].count += 1;
    titleCounts[key].total += t.amount;
  });

  const recurringList = Object.entries(titleCounts)
    .filter(([_, data]) => data.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  // Peak spending days
  const dateTotals: Record<string, number> = {};
  expenses.forEach((t) => {
    dateTotals[t.date] = (dateTotals[t.date] || 0) + t.amount;
  });
  const peakDays = Object.entries(dateTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Handle Purchase Evaluation
  const handleEvaluatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || itemPrice <= 0) return;

    setEvalLoading(true);
    try {
      const selectedGoal = goals.find((g) => g.id === selectedGoalId) || goals[0] || null;

      const res = await fetch('/api/ai/purchase-evaluator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: itemName.trim(),
          price: itemPrice,
          necessity:
            necessity === 'urgent'
              ? 'Cần thiết sống còn'
              : necessity === 'medium'
              ? 'Hữu ích cho công việc/học tập'
              : necessity === 'impulse'
              ? 'Thích ngẫu hứng'
              : 'Thèm nhất thời vì lướt mạng',
          category: 'shopping',
          currentBalance: metrics.realBalance,
          dailyBudget: metrics.dailyReferenceBudget,
          primaryGoal: selectedGoal,
        }),
      });

      if (!res.ok) throw new Error('Evaluation error');
      const data: PurchaseEvaluationResponse = await res.json();
      setEvaluation(data);
    } catch (err) {
      console.error(err);
      // Fallback calculation directly
      const daysOfFood = metrics.dailyReferenceBudget > 0 ? (itemPrice / metrics.dailyReferenceBudget).toFixed(1) : '10';
      setEvaluation({
        recommendation: necessity === 'urgent' ? 'NEN_MUA' : 'CHO_72_GIO',
        recommendationLabel: necessity === 'urgent' ? 'Nên mua (Cần thiết thực tế)' : 'Chờ suy nghĩ 72 giờ (Quy tắc giảm cảm xúc)',
        score: necessity === 'urgent' ? 8.5 : 5.0,
        verdictTitle: necessity === 'urgent' ? 'Khoản chi chính đáng' : 'Hãy hoãn lại 3 ngày để kiểm tra nhu cầu thật',
        percentOfBalance: metrics.realBalance > 0 ? Math.round((itemPrice / metrics.realBalance) * 100) : 0,
        equivalentDaysOfLiving: parseFloat(daysOfFood),
        affectedGoals: goals.slice(0, 1).map((g) => g.title),
        reasoning: `Món đồ ${formatVND(itemPrice)} tương đương khoảng ${daysOfFood} ngày tiền sinh hoạt. Hãy cân nhắc xem nếu không mua thì cuộc sống có bị ảnh hưởng gì không.`,
        opportunityCost: `Số tiền này có thể giúp bạn trang trải ${daysOfFood} ngày ăn uống hoặc đóng góp vào mục tiêu tích lũy.`,
        alternativeOptions: ['Tìm mua đồ đã qua sử dụng', 'Chờ đợt giảm giá lớn'],
        coolingOffQuestions: [
          'Bạn mua vì thực sự cần hay vì thấy bạn bè có?',
          'Nếu chờ 2 tuần nữa mới mua thì có ảnh hưởng gì không?',
        ],
      });
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>THÓI QUEN CHI TIÊU & TRỢ LÝ TRƯỚC KHI MUA HÀNG</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Nhận diện thói quen tiêu tiền & Giữ chặt hầu bao
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Phân tích số liệu thực tế để tìm lỗ rò rỉ ví tiền và áp dụng quy tắc 72 giờ trước khi mua sắm.
          </p>
        </div>
      </div>

      {/* MODULE 8: SPENDING HABITS OBSERVATIONS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span>Phân tích thói quen dựa trên lịch sử chi tiêu thực tế</span>
        </h3>

        {expenses.length >= 3 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Category */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Danh mục chi tiêu lớn nhất
              </span>
              {topCategory ? (
                <>
                  <div className="text-base font-extrabold text-slate-900">
                    {getCategoryLabel(topCategory[0])}
                  </div>
                  <div className="text-xs font-bold text-blue-700 mt-1">
                    {formatVND(topCategory[1])} ({totalExpense > 0 ? Math.round((topCategory[1] / totalExpense) * 100) : 0}% tổng chi)
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    💡 Đề xuất: Đặt hạn mức tuần cho danh mục này để tránh vượt kế hoạch.
                  </p>
                </>
              ) : (
                <span className="text-xs text-slate-400">Chưa có dữ liệu</span>
              )}
            </div>

            {/* Recurring Expenses */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Khoản chi lặp lại thường xuyên
              </span>
              {recurringList.length > 0 ? (
                <div className="space-y-1.5 mt-1">
                  {recurringList.map(([title, data], i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[140px]">{title}</span>
                      <span className="text-slate-500">
                        {data.count} lần ({formatVND(data.total)})
                      </span>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400 mt-2">
                    💡 Các khoản chi nhỏ lặp lại có thể âm thầm làm rò rỉ ngân sách.
                  </p>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Chưa phát hiện khoản chi lặp lại thường xuyên</span>
              )}
            </div>

            {/* Peak Spending Days */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Những ngày chi tiêu cao điểm
              </span>
              {peakDays.length > 0 ? (
                <div className="space-y-1.5 mt-1">
                  {peakDays.map(([date, amount], i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{date}</span>
                      <span className="font-bold text-rose-600">{formatVND(amount)}</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400 mt-2">
                    💡 Hãy chú ý các ngày cuối tuần hoặc sau ngày nhận lương.
                  </p>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Chưa đủ dữ liệu</span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            Chưa đủ lịch sử giao dịch để phân tích thói quen chính xác. Hãy tiếp tục ghi chép ít nhất 5 giao dịch để hệ thống nhận diện!
          </div>
        )}
      </div>

      {/* MODULE 7: PURCHASE DECISION EVALUATOR */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Trợ lý trước khi mua hàng (Purchase Decision Evaluator)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đánh giá món đồ trước khi quẹt thẻ hoặc bấm thanh toán trên ứng dụng mua sắm.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form (5 cols) */}
          <form onSubmit={handleEvaluatePurchase} className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên món đồ định mua <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ví dụ: Giày thể thao, Tai nghe, Áo khoác..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Giá tiền món đồ (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="10000"
                min="10000"
                required
                value={itemPrice}
                onChange={(e) => setItemPrice(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mức độ cần thiết
              </label>
              <select
                value={necessity}
                onChange={(e) => setNecessity(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="urgent">Cần thiết cấp bách (Không có thì việc bị đình trệ)</option>
                <option value="medium">Hữu ích cho công việc / học tập</option>
                <option value="impulse">Thích ngẫu hứng (Thấy đẹp / bạn bè có)</option>
                <option value="fleeting">Thèm nhất thời vì lướt TikTok / Shopee Sale</option>
              </select>
            </div>

            {goals.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mục tiêu tiết kiệm liên quan
                </label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({formatVND(g.targetAmount)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={evalLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{evalLoading ? 'AI đang phân tích tâm lý...' : 'Đánh giá món đồ này'}</span>
            </button>
          </form>

          {/* Results Display (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50 p-5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            {evaluation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                    evaluation.recommendation === 'NEN_MUA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {evaluation.recommendationLabel}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    Điểm số: {evaluation.score}/10
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{evaluation.verdictTitle}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/70">
                    {evaluation.reasoning}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-400 block">Quy đổi tiền ăn</span>
                    <strong className="text-slate-900">~ {evaluation.equivalentDaysOfLiving} ngày sinh hoạt</strong>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-400 block">Tỷ lệ số dư</span>
                    <strong className="text-slate-900">{evaluation.percentOfBalance}% số dư ví</strong>
                  </div>
                </div>

                {evaluation.coolingOffQuestions && evaluation.coolingOffQuestions.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      ❓ Câu hỏi tự vấn trước khi quẹt thẻ (Quy tắc 72 giờ):
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600 italic">
                      {evaluation.coolingOffQuestions.map((q, i) => (
                        <li key={i}>"{q}"</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <ShoppingBag className="w-10 h-10 text-slate-300 mb-2" />
                <div className="text-xs font-bold text-slate-600">Chưa có kết quả đánh giá</div>
                <p className="text-[11px] mt-1 max-w-xs">
                  Nhập giá tiền và tên món đồ bạn định mua để xem món đồ tương đương bao nhiêu ngày tiền ăn và ảnh hưởng tới mục tiêu tiết kiệm thế nào.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
