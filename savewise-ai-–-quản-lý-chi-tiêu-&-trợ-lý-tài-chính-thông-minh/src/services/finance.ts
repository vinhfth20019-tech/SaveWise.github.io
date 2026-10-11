import {
  Transaction,
  SavingsGoal,
  EmergencyFund,
  MandatoryExpense,
  UserSettings,
  FinancialHealthMetrics,
  BudgetCategoryConfig,
  ExpenseCategory,
  RecurringTransaction,
  DataCompletenessReport,
} from '../types';

/**
 * Đánh giá độ đầy đủ dữ liệu tài chính (Data Completeness Check)
 * Giúp AI và người dùng phát hiện kịp thời các thông tin bị thiếu (chưa nhập tiền trọ, chưa có số dư...)
 */
export function evaluateDataCompleteness(params: {
  transactions: Transaction[];
  goals: SavingsGoal[];
  mandatoryExpenses: MandatoryExpense[];
  recurringTransactions?: RecurringTransaction[];
  settings: UserSettings;
}): DataCompletenessReport {
  let score = 0;
  const missingItems: string[] = [];
  const assumptions: string[] = [];

  // 1. Số dư ban đầu
  if (params.settings.initialBalance > 0) {
    score += 25;
  } else {
    missingItems.push('Chưa nhập số dư ban đầu');
    assumptions.push('Giả định số dư khởi điểm là 0 ₫');
  }

  // 2. Lịch sử giao dịch thu chi
  if (params.transactions.length >= 3) {
    score += 25;
  } else if (params.transactions.length > 0) {
    score += 15;
    missingItems.push('Mới ghi ít hơn 3 giao dịch thực tế');
    assumptions.push('Giả định các khoản ăn uống/đi lại hàng ngày chưa được ghi nhận đầy đủ');
  } else {
    missingItems.push('Chưa ghi nhận giao dịch thu chi nào');
    assumptions.push('Giả định chưa phát sinh chi phí sinh hoạt nào');
  }

  // 3. Chi phí cố định & Khoản chi định kỳ (tiền phòng trọ, điện nước, internet)
  const hasFixedExpenses =
    params.mandatoryExpenses.length > 0 ||
    (params.recurringTransactions && params.recurringTransactions.some((r) => r.type === 'expense'));
  if (hasFixedExpenses) {
    score += 25;
  } else {
    missingItems.push('Chưa khai báo chi phí cố định (tiền trọ, điện nước, mạng internet)');
    assumptions.push('Giả định bạn không phải trả tiền thuê nhà hoặc chi phí cố định định kỳ');
  }

  // 4. Mục tiêu tiết kiệm
  if (params.goals.length > 0) {
    score += 25;
  } else {
    missingItems.push('Chưa đặt mục tiêu tiết kiệm');
    assumptions.push('Giả định bạn muốn tích lũy tự do mà chưa có thời hạn cụ thể');
  }

  let level: 'thap' | 'trung_binh' | 'day_du' = 'day_du';
  if (score < 50) level = 'thap';
  else if (score < 80) level = 'trung_binh';

  return {
    score,
    level,
    missingItems,
    assumptions,
  };
}

/**
 * Tính toán toàn bộ các chỉ số tài chính dùng chung theo đúng quy tắc Mục 4:
 * 1. Số dư thực tế = Số dư ban đầu + Tổng thu nhập thực tế - Tổng chi tiêu thực tế
 * 2. Tiền đã phân bổ mục tiêu = Tổng currentAmount của các mục tiêu
 * 3. Quỹ dự phòng = currentAmount của quỹ dự phòng
 * 4. Tiền chưa phân bổ = Số dư thực tế - Tiền đã phân bổ mục tiêu - Quỹ dự phòng
 * 5. Tiền có thể chi tiêu = Tiền chưa phân bổ - Chi bắt buộc chưa thanh toán trong kỳ
 * 6. Kiểm tra thiếu hụt nếu: (Tiền đã phân bổ mục tiêu + Quỹ dự phòng) > Số dư thực tế
 * 7. Ngân sách tham khảo mỗi ngày = max(0, Math.floor(Tiền có thể chi tiêu / Số ngày còn lại))
 */
export function calculateFinancialMetrics(params: {
  transactions: Transaction[];
  goals: SavingsGoal[];
  emergencyFund: EmergencyFund;
  mandatoryExpenses: MandatoryExpense[];
  recurringTransactions?: RecurringTransaction[];
  settings: UserSettings;
}): FinancialHealthMetrics {
  const { transactions, goals, emergencyFund, mandatoryExpenses, recurringTransactions = [], settings } = params;

  // 1. Tính tổng thu và tổng chi thực tế từ sổ giao dịch
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    const amount = Math.max(0, Math.round(t.amount || 0));
    if (t.type === 'income') {
      totalIncome += amount;
    } else if (t.type === 'expense') {
      totalExpense += amount;
    }
  }

  // 2. Số dư thực tế = Số dư ban đầu + Tổng thu - Tổng chi
  const initialBalance = Math.max(0, Math.round(settings.initialBalance || 0));
  const realBalance = initialBalance + totalIncome - totalExpense;

  // 3. Tiền đã phân bổ vào các mục tiêu tiết kiệm (chỉ là phân bổ nội bộ, không phải chi tiêu mất đi)
  const allocatedToGoals = goals.reduce((sum, g) => sum + Math.max(0, Math.round(g.currentAmount || 0)), 0);

  // 4. Quỹ dự phòng
  const emergencyFundAmount = Math.max(0, Math.round(emergencyFund.currentAmount || 0));

  // 5. Tổng tiền đã phân bổ
  const totalAllocated = allocatedToGoals + emergencyFundAmount;

  // 6. Kiểm tra tình trạng thiếu hụt (nếu tiền đã phân bổ > số dư thực tế)
  const isDeficit = totalAllocated > realBalance;
  const deficitAmount = isDeficit ? totalAllocated - realBalance : 0;

  // 7. Tiền chưa phân bổ = Số dư thực tế - Tiền mục tiêu - Quỹ dự phòng (có thể âm nếu thiếu hụt)
  const unallocatedMoney = realBalance - totalAllocated;

  // 8. Các khoản chi bắt buộc chưa thanh toán trong kỳ
  const unpaidMandatoryExpenses = mandatoryExpenses
    .filter((m) => !m.isPaid)
    .reduce((sum, m) => sum + Math.max(0, Math.round(m.amount || 0)), 0);

  // 9. Tiền có thể chi tiêu (ngân sách linh hoạt còn lại)
  const spendableMoney = Math.max(0, unallocatedMoney - unpaidMandatoryExpenses);

  // 10. Số ngày còn lại trong kỳ
  const daysRemaining = Math.max(1, Math.round(settings.daysInPeriod || 30));

  // 11. Ngân sách tham khảo mỗi ngày (làm tròn xuống số nguyên VNĐ)
  const dailyReferenceBudget = Math.floor(spendableMoney / daysRemaining);

  // 12. Tính toán các khoản sắp đến hạn trong vòng 7 ngày tới (Upcoming Bills)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let upcomingBillsCount = 0;
  let upcomingBillsTotal = 0;

  for (const m of mandatoryExpenses) {
    if (!m.isPaid) {
      if (m.dueDate) {
        const daysLeft = calculateDaysRemaining(m.dueDate);
        if (daysLeft <= 7) {
          upcomingBillsCount += 1;
          upcomingBillsTotal += m.amount;
        }
      } else {
        // Chưa có ngày cụ thể nhưng chưa trả
        upcomingBillsCount += 1;
        upcomingBillsTotal += m.amount;
      }
    }
  }

  for (const r of recurringTransactions) {
    if (r.type === 'expense' && !r.isPaidThisCycle) {
      const daysLeft = calculateDaysRemaining(r.nextDueDate);
      if (daysLeft <= 7) {
        upcomingBillsCount += 1;
        upcomingBillsTotal += r.amount;
      }
    }
  }

  // 13. Đánh giá độ đầy đủ dữ liệu
  const dataCompleteness = evaluateDataCompleteness({
    transactions,
    goals,
    mandatoryExpenses,
    recurringTransactions,
    settings,
  });

  return {
    realBalance,
    totalIncome,
    totalExpense,
    allocatedToGoals,
    emergencyFundAmount,
    unallocatedMoney,
    unpaidMandatoryExpenses,
    spendableMoney,
    isDeficit,
    deficitAmount,
    dailyReferenceBudget,
    daysRemaining,
    upcomingBillsCount,
    upcomingBillsTotal,
    dataCompleteness,
  };
}

/**
 * Tính số ngày còn lại đến hạn chót (YYYY-MM-DD)
 */
export function calculateDaysRemaining(deadlineStr?: string): number {
  if (!deadlineStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = deadlineStr.split('-').map(Number);
  if (!year || !month || !day) return 0;

  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Tính tiến độ và kế hoạch của một mục tiêu tiết kiệm
 */
export function calculateGoalPlan(goal: SavingsGoal) {
  const target = Math.max(0, Math.round(goal.targetAmount || 0));
  const current = Math.max(0, Math.round(goal.currentAmount || 0));
  const deficit = Math.max(0, target - current);

  const isCompleted = current >= target && target > 0;
  const progressPercent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const daysLeft = goal.deadline ? calculateDaysRemaining(goal.deadline) : goal.targetDays || 0;

  // Số tiền cần tiết kiệm mỗi ngày (chỉ tính nếu chưa hoàn thành và có thời hạn)
  let dailyNeeded = 0;
  let weeklyNeeded = 0;
  let monthlyNeeded = 0;

  if (!isCompleted && daysLeft > 0) {
    dailyNeeded = Math.ceil(deficit / daysLeft);
    weeklyNeeded = Math.ceil(dailyNeeded * 7);
    monthlyNeeded = Math.ceil(dailyNeeded * 30);
  }

  return {
    target,
    current,
    deficit,
    isCompleted,
    progressPercent,
    daysLeft,
    dailyNeeded,
    weeklyNeeded,
    monthlyNeeded,
  };
}

/**
 * Tính toán ngân sách theo từng danh mục
 */
export function calculateCategoryBudgetStatus(params: {
  category: ExpenseCategory;
  budgetConfigs: BudgetCategoryConfig[];
  transactions: Transaction[];
  settings: UserSettings;
}) {
  const { category, budgetConfigs, transactions, settings } = params;

  const config = budgetConfigs.find((b) => b.category === category && b.isActive);
  const limit = config ? Math.max(0, Math.round(config.limit || 0)) : 0;

  // Tính chi tiêu trong kỳ (mặc định trong 30 ngày qua hoặc tháng hiện tại)
  const now = Date.now();
  const periodDays = config?.period === 'daily' ? 1 : config?.period === 'weekly' ? 7 : settings.daysInPeriod || 30;
  const timeLimit = now - periodDays * 24 * 60 * 60 * 1000;

  const actualSpent = transactions
    .filter((t) => t.type === 'expense' && t.category === category && t.createdAt >= timeLimit)
    .reduce((sum, t) => sum + Math.max(0, Math.round(t.amount || 0)), 0);

  const remaining = Math.max(0, limit - actualSpent);
  const isOverBudget = limit > 0 && actualSpent > limit;
  const overAmount = isOverBudget ? actualSpent - limit : 0;

  const percentUsed = limit > 0 ? Math.round((actualSpent / limit) * 100) : 0;

  // Xác định mức cảnh báo theo cài đặt người dùng
  const warn70 = settings.warningThreshold70 || 70;
  const warn85 = settings.warningThreshold85 || 85;
  const warn100 = settings.warningThreshold100 || 100;

  let alertLevel: 'normal' | 'warning_70' | 'warning_85' | 'danger_100' = 'normal';
  if (limit > 0) {
    if (percentUsed >= warn100) {
      alertLevel = 'danger_100';
    } else if (percentUsed >= warn85) {
      alertLevel = 'warning_85';
    } else if (percentUsed >= warn70) {
      alertLevel = 'warning_70';
    }
  }

  return {
    category,
    hasBudget: limit > 0,
    limit,
    actualSpent,
    remaining,
    percentUsed,
    isOverBudget,
    overAmount,
    alertLevel,
    period: config?.period || 'monthly',
  };
}
