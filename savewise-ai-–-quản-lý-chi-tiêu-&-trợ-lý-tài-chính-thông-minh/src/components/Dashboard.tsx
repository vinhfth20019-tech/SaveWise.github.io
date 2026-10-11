import React from 'react';
import {
  Wallet,
  Coins,
  Target,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  PlusCircle,
  Clock,
  CheckCircle2,
  PieChart,
  ShieldAlert,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import {
  FinancialHealthMetrics,
  SavingsGoal,
  Transaction,
  BudgetCategoryConfig,
  UserSettings,
} from '../types';
import { calculateGoalPlan, calculateCategoryBudgetStatus } from '../services/finance';
import { formatVND, formatDateVN, getCategoryLabel, getCategoryMeta } from '../utils/formatters';

interface DashboardProps {
  metrics: FinancialHealthMetrics;
  goals: SavingsGoal[];
  transactions: Transaction[];
  budgetConfigs: BudgetCategoryConfig[];
  settings: UserSettings;
  onNavigateTab: (tab: any) => void;
  onOpenAddModal: () => void;
  onOpenAllocateModal: (goal: SavingsGoal) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  goals,
  transactions,
  budgetConfigs,
  settings,
  onNavigateTab,
  onOpenAddModal,
  onOpenAllocateModal,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Tính toán chi tiêu trong tháng hiện tại (30 ngày qua)
  const now = Date.now();
  const oneMonthAgo = now - 30 * 86400000;

  const thisMonthIncome = transactions
    .filter((t) => t.type === 'income' && t.createdAt >= oneMonthAgo)
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthExpense = transactions
    .filter((t) => t.type === 'expense' && t.createdAt >= oneMonthAgo)
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. Tính toán chi tiêu hôm nay
  const todayExpense = transactions
    .filter((t) => t.type === 'expense' && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  // 3. Cơ cấu chi tiêu theo danh mục
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense' && t.createdAt >= oneMonthAgo)
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const totalExpenseInPeriod = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  // 4. Xây dựng tối đa 3 Gợi ý trong ngày (Mục 5.5) dựa trên số liệu thực tế
  const suggestions: Array<{ title: string; reason: string; action: string; type: 'warning' | 'info' | 'positive' }> = [];

  // Gợi ý 1: Kiểm tra thiếu hụt hoặc ngân sách ngày
  if (metrics.isDeficit) {
    suggestions.push({
      title: 'Thiếu hụt tiền phân bổ mục tiêu',
      reason: `Bạn đã phân bổ ${formatVND(metrics.allocatedToGoals + metrics.emergencyFundAmount)} cho mục tiêu & dự phòng, vượt số dư ví ${formatVND(metrics.realBalance)}.`,
      action: 'Rút bớt tiền từ mục tiêu về ví hoặc ghi nhận thêm các khoản thu nhập để cân bằng.',
      type: 'warning',
    });
  } else if (todayExpense > metrics.dailyReferenceBudget && metrics.dailyReferenceBudget > 0) {
    suggestions.push({
      title: 'Hôm nay chi tiêu vượt mức tham khảo',
      reason: `Hôm nay bạn đã chi ${formatVND(todayExpense)}, vượt hạn mức tham khảo ${formatVND(metrics.dailyReferenceBudget)}/ngày.`,
      action: 'Cân nhắc cắt giảm các khoản ăn vặt hoặc mua sắm không thiết yếu trong 2 ngày tới.',
      type: 'warning',
    });
  } else {
    suggestions.push({
      title: 'Ngân sách an toàn mỗi ngày',
      reason: `Số tiền có thể chi tiêu còn lại ${formatVND(metrics.spendableMoney)}, bình quân an toàn ${formatVND(metrics.dailyReferenceBudget)}/ngày trong ${metrics.daysRemaining} ngày tới.`,
      action: 'Duy trì mức chi tiêu ăn uống hợp lý để bảo toàn dòng tiền.',
      type: 'positive',
    });
  }

  // Gợi ý 2: Kiểm tra danh mục chi tiêu vượt ngưỡng
  const exceededCategory = budgetConfigs
    .filter((b) => b.isActive && b.limit > 0)
    .map((b) => calculateCategoryBudgetStatus({ category: b.category, budgetConfigs, transactions, settings }))
    .find((s) => s.alertLevel === 'danger_100' || s.alertLevel === 'warning_85');

  if (exceededCategory) {
    suggestions.push({
      title: `Danh mục ${getCategoryLabel(exceededCategory.category)} đã dùng ${exceededCategory.percentUsed}% ngân sách`,
      reason: `Đã chi ${formatVND(exceededCategory.actualSpent)} / hạn mức ${formatVND(exceededCategory.limit)}.`,
      action: 'Chuyển sang tự nấu ăn hoặc tìm giải pháp thay thế rẻ hơn trong tuần này.',
      type: 'warning',
    });
  } else if (goals.length > 0) {
    const primaryGoal = goals[0];
    const plan = calculateGoalPlan(primaryGoal);
    if (!plan.isCompleted) {
      suggestions.push({
        title: `Mục tiêu "${primaryGoal.title}" còn thiếu ${formatVND(plan.deficit)}`,
        reason: plan.daysLeft > 0 ? `Còn ${plan.daysLeft} ngày đến hạn hoàn thành dự kiến.` : 'Chưa đặt thời hạn cụ thể.',
        action: plan.dailyNeeded > 0 ? `Chỉ cần để dành khoảng ${formatVND(plan.dailyNeeded)}/ngày là chạm tay tới mục tiêu.` : 'Bấm vào mục tiêu để phân bổ tiền tích lũy.',
        type: 'info',
      });
    }
  }

  // Gợi ý 3: Mẹo thực phẩm & thói quen
  suggestions.push({
    title: 'Tối ưu chi phí ăn uống với Smart Meal',
    reason: 'Chi phí ăn uống ngoài hàng thường chiếm 40-50% tổng ngân sách của học sinh, sinh viên.',
    action: 'Dùng tính năng Smart Meal để lập thực đơn ngon, bổ, rẻ phù hợp ngân sách mỗi ngày.',
    type: 'info',
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 mb-2">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span>SAVEWISE AI · CHI TIÊU THÔNG MINH, TIẾT KIỆM CÓ MỤC TIÊU</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Xin chào {settings.userName || 'bạn'}, hôm nay dòng tiền thế nào?
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-2xl">
            Hệ thống hỗ trợ kiểm soát ngân sách theo công thức tài chính minh bạch: bảo đảm chi phí bắt buộc, nuôi dưỡng quỹ mục tiêu và ăn uống hợp lý mỗi ngày.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 text-xs font-bold">
            <button
              onClick={() => onNavigateTab('coach')}
              className="px-4 py-2 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Hỏi đáp với AI Coach</span>
            </button>

            <button
              onClick={() => onNavigateTab('meal')}
              className="px-4 py-2 bg-blue-600/60 hover:bg-blue-600/80 text-white rounded-xl transition-all border border-blue-400/30 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Lập thực đơn tiết kiệm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* DEFICIT ALERT BANNER (Section 4.2) */}
      {metrics.isDeficit && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Cảnh báo: Tiền phân bổ đang vượt số dư thực tế</h4>
            <p className="mt-0.5 leading-relaxed">
              Tổng tiền trong các mục tiêu ({formatVND(metrics.allocatedToGoals)}) và quỹ dự phòng ({formatVND(metrics.emergencyFundAmount)}) vượt số dư thực tế của bạn ({formatVND(metrics.realBalance)}).
              Bạn đang thiếu hụt <strong>{formatVND(metrics.deficitAmount)}</strong>. Hãy rút bớt tiền từ mục tiêu về ví để tránh thâm hụt tiền sinh hoạt!
            </p>
          </div>
        </div>
      )}

      {/* UPCOMING BILLS ALERT (Khoản chi sắp đến hạn trong 7 ngày tới) */}
      {metrics.upcomingBillsCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-900">
                Nhắc nhở: Có {metrics.upcomingBillsCount} khoản chi sắp đến hạn thanh toán trong tuần này
              </h4>
              <p className="mt-0.5 text-amber-800">
                Tổng cộng cần thanh toán: <strong>{formatVND(metrics.upcomingBillsTotal)}</strong>. Hãy chuẩn bị sẵn tiền để không bị phạt trễ hạn hoặc cắt dịch vụ!
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('budget')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shrink-0 shadow-xs cursor-pointer"
          >
            Xem & Thanh toán ngay
          </button>
        </div>
      )}

      {/* 4 CÂU HỎI CỐT LÕI MỖI NGÀY (CORE 4 QUESTIONS PANEL) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-extrabold text-sm border border-blue-200">
              4Q
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                4 Câu hỏi cốt lõi mỗi ngày của bạn
              </h3>
              <p className="text-xs text-slate-500">
                Trả lời nhanh giúp bạn luôn làm chủ tài chính và biết rõ mình đang đứng ở đâu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Độ đầy đủ dữ liệu:</span>
            <span className={`px-2 py-0.5 rounded-full font-bold ${metrics.dataCompleteness.score >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {metrics.dataCompleteness.score}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Câu hỏi 1: Tôi hiện có bao nhiêu tiền? */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block mb-1">
                Câu hỏi 1
              </span>
              <h4 className="font-bold text-xs text-slate-900">
                Tôi hiện có bao nhiêu tiền?
              </h4>
              <div className="text-xl font-extrabold text-slate-900 mt-2">
                {formatVND(metrics.realBalance)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Số dư thực tế trong ví/tài khoản.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-0.5">
              <div>🎯 Đã khóa mục tiêu: <strong>{formatVND(metrics.allocatedToGoals)}</strong></div>
              <div>💼 Tiền chưa phân bổ: <strong>{formatVND(metrics.unallocatedMoney)}</strong></div>
            </div>
          </div>

          {/* Câu hỏi 2: Hôm nay tôi nên tiêu tối đa bao nhiêu? */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block mb-1">
                Câu hỏi 2
              </span>
              <h4 className="font-bold text-xs text-slate-900">
                Hôm nay tôi nên tiêu tối đa bao nhiêu?
              </h4>
              <div className="text-xl font-extrabold text-emerald-700 mt-2">
                {formatVND(metrics.dailyReferenceBudget)}
                <span className="text-xs font-semibold text-slate-400"> /ngày</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Hạn mức an toàn sau khi trừ khoản bắt buộc và mục tiêu.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
              <span>Hôm nay đã tiêu: </span>
              <strong className={todayExpense > metrics.dailyReferenceBudget && metrics.dailyReferenceBudget > 0 ? 'text-rose-600' : 'text-slate-800'}>
                {formatVND(todayExpense)}
              </strong>
            </div>
          </div>

          {/* Câu hỏi 3: Làm thế nào để tiết kiệm đủ tiền cho mục tiêu? */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block mb-1">
                Câu hỏi 3
              </span>
              <h4 className="font-bold text-xs text-slate-900">
                Tiết kiệm đủ tiền cho mục tiêu?
              </h4>
              {goals.length > 0 ? (
                <>
                  <div className="text-sm font-extrabold text-indigo-900 mt-2 line-clamp-1">
                    "{goals[0].title}"
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-1">
                    Cần tích lũy: ~{formatVND(Math.ceil(Math.max(0, goals[0].targetAmount - goals[0].currentAmount) / (goals[0].targetDays || 30)))}/ngày
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Đã tích lũy {Math.round((goals[0].currentAmount / (goals[0].targetAmount || 1)) * 100)}%
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-3">
                  Chưa có mục tiêu. Hãy thêm một mục tiêu để có động lực tích lũy!
                </p>
              )}
            </div>
            <button
              onClick={() => onNavigateTab('goals')}
              className="text-left text-[11px] font-bold text-indigo-600 hover:text-indigo-800 pt-2 border-t border-slate-200/60 cursor-pointer"
            >
              Xem chi tiết mục tiêu →
            </button>
          </div>

          {/* Câu hỏi 4: Ăn uống và mua sắm thế nào để vừa tiết kiệm vừa đáp ứng nhu cầu? */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block mb-1">
                Câu hỏi 4
              </span>
              <h4 className="font-bold text-xs text-slate-900">
                Ăn uống & mua sắm thế nào?
              </h4>
              <div className="text-sm font-extrabold text-amber-900 mt-2">
                Tự nấu hoặc cơm sinh viên
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Giới hạn ăn uống ~{formatVND(Math.min(metrics.dailyReferenceBudget, 50000))}/ngày. Tận dụng gia vị & tủ lạnh sẵn có.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('meal')}
              className="text-left text-[11px] font-bold text-amber-700 hover:text-amber-900 pt-2 border-t border-slate-200/60 cursor-pointer"
            >
              Lên thực đơn Smart Meal →
            </button>
          </div>
        </div>
      </div>

      {/* 5.1 THẺ THỐNG KÊ (6 METRIC CARDS FULFILLING SECTION 5.1) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Chỉ số tài chính tổng quan
          </h2>
          <span className="text-[11px] text-slate-400">Dữ liệu tính toán thống nhất toàn hệ thống</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Số dư thực tế */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold">1. SỐ DƯ THỰC TẾ</span>
                <Coins className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">{formatVND(metrics.realBalance)}</div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">
              Gốc: {formatVND(settings.initialBalance)}
            </span>
          </div>

          {/* Card 2: Tiền chưa phân bổ */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold">2. TIỀN CHƯA PHÂN BỔ</span>
                <Wallet className="w-4 h-4 text-indigo-600" />
              </div>
              <div className={`text-xl font-extrabold ${metrics.unallocatedMoney >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {formatVND(metrics.unallocatedMoney)}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">
              Sau trừ mục tiêu & dự phòng
            </span>
          </div>

          {/* Card 3: Tiền đang dành cho mục tiêu */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold">3. TIỀN MỤC TIÊU</span>
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-emerald-700">{formatVND(metrics.allocatedToGoals)}</div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">
              Trong {goals.length} mục tiêu đang nuôi
            </span>
          </div>

          {/* Card 4: Tổng thu nhập tháng */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold">4. THU NHẬP THÁNG</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-emerald-600">+{formatVND(thisMonthIncome)}</div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">Trong 30 ngày gần nhất</span>
          </div>

          {/* Card 5: Tổng chi tiêu tháng */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold">5. CHI TIÊU THÁNG</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-extrabold text-rose-600">-{formatVND(thisMonthExpense)}</div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">Đã thanh toán thực tế</span>
          </div>

          {/* Card 6: Số tiền còn lại theo ngân sách (Spendable) */}
          <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-blue-700 mb-1">
                <span className="text-[11px] font-bold">6. TIỀN CÓ THỂ TIÊU</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-extrabold text-blue-700">{formatVND(metrics.spendableMoney)}</div>
            </div>
            <span className="text-[10px] text-blue-600 mt-2 block">
              ~ {formatVND(metrics.dailyReferenceBudget)}/ngày
            </span>
          </div>
        </div>
      </div>

      {/* 5.5 GỢI Ý TRONG NGÀY (SECTION 5.5: TỐI ĐA 3 GỢI Ý CÓ LÝ DO & HÀNH ĐỘNG ĐỀ XUẤT) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Gợi ý tài chính thông minh trong ngày</span>
          </h3>
          <span className="text-[11px] text-slate-400">Dựa trên ngân sách & giao dịch thực tế</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions.map((sug, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                sug.type === 'warning'
                  ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                  : sug.type === 'positive'
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                  : 'bg-blue-50/40 border-blue-200 text-blue-950'
              }`}
            >
              <div>
                <h4 className="font-bold text-xs">{sug.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  <strong>Lý do:</strong> {sug.reason}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/50 text-[11px] font-semibold text-blue-800">
                👉 <strong>Đề xuất:</strong> {sug.action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5.2 MỤC TIÊU TIẾT KIỆM (CARDS WITH ACTIONS FULFILLING SECTION 5.2) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Mục tiêu tiết kiệm đang hoạt động ({goals.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Các khoản đóng góp vào mục tiêu là phân bổ nội bộ, không làm mất tổng số dư thực tế.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('goals')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Quản lý tất cả mục tiêu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => {
              const plan = calculateGoalPlan(g);

              return (
                <div
                  key={g.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    plan.isCompleted
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{g.title}</h4>
                        <span className="text-[10px] text-slate-400">{g.category}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        {plan.progressPercent}%
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${plan.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Đã có: <strong>{formatVND(plan.current)}</strong></span>
                        <span>Đích: {formatVND(plan.target)}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                      <span>Còn thiếu: {formatVND(plan.deficit)}</span>
                      {plan.dailyNeeded > 0 && (
                        <span className="font-semibold text-blue-700">
                          Cần {formatVND(plan.dailyNeeded)}/ngày
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {plan.daysLeft > 0 ? `Còn ${plan.daysLeft} ngày` : 'Chưa có hạn'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenAllocateModal(g)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Nạp / Rút tiền
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            Chưa có mục tiêu nào. Hãy tạo mục tiêu đầu tiên (mua tai nghe, du lịch, quỹ dự phòng...) để bắt đầu tích lũy!
          </div>
        )}
      </div>

      {/* 5.3 & 5.4 BIỂU ĐỒ & HOẠT ĐỘNG GẦN ĐÂY (SECTION 5.3 & 5.4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cơ cấu chi tiêu theo danh mục (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Cơ cấu chi tiêu thực tế</h3>
              <p className="text-[11px] text-slate-400">Trong 30 ngày gần đây</p>
            </div>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>

          {sortedCategories.length > 0 ? (
            <div className="space-y-3">
              {sortedCategories.slice(0, 5).map(([catKey, amount]) => {
                const percent = totalExpenseInPeriod > 0 ? Math.round((amount / totalExpenseInPeriod) * 100) : 0;
                const meta = getCategoryMeta(catKey);

                return (
                  <div key={catKey}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-700">{meta.label}</span>
                      <span className="font-bold text-slate-900">
                        {formatVND(amount)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Chưa có giao dịch chi tiêu nào trong 30 ngày qua. Hãy ghi chép giao dịch để xem biểu đồ cơ cấu!
            </div>
          )}
        </div>

        {/* Right: Giao dịch mới nhất (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Hoạt động thu chi gần đây</h3>
              <p className="text-[11px] text-slate-400">Các giao dịch thực tế đã ghi nhận</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddModal}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Thêm giao dịch</span>
              </button>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs text-slate-400 hover:text-slate-700 ml-2"
              >
                Xem tất cả →
              </button>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map((t) => {
                const meta = getCategoryMeta(t.category);
                const isIncome = t.type === 'income';

                return (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/60 rounded-lg px-1 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg border font-bold text-[10px] ${meta.badgeBg} ${meta.badgeText}`}>
                        {meta.label.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{t.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{meta.label}</span>
                          <span>·</span>
                          <span>{formatDateVN(t.date)}</span>
                          {t.note && (
                            <>
                              <span>·</span>
                              <span className="italic truncate max-w-[120px]">{t.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`font-extrabold text-xs ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isIncome ? `+${formatVND(t.amount)}` : `-${formatVND(t.amount)}`}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Chưa có giao dịch nào được ghi lại.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
