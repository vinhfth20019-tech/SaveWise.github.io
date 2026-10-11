export type TransactionType = 'income' | 'expense';

export type IncomeCategory =
  | 'allowance' // Tiền tiêu vặt
  | 'salary' // Lương hoặc tiền công
  | 'bonus' // Tiền thưởng
  | 'gift' // Tiền được tặng
  | 'income_other'; // Thu nhập khác

export type ExpenseCategory =
  | 'food' // Ăn uống
  | 'transport' // Đi lại
  | 'study_work' // Học tập và công việc
  | 'personal_items' // Đồ dùng cá nhân
  | 'entertainment' // Giải trí
  | 'shopping' // Mua sắm
  | 'health' // Sức khỏe
  | 'family' // Gia đình
  | 'fixed_cost' // Chi phí cố định (trọ, điện nước, mạng)
  | 'expense_other'; // Chi tiêu khác

export type TransactionCategory = IncomeCategory | ExpenseCategory;

export type PaymentMethod = 'cash' | 'e-wallet' | 'bank' | 'other';

export interface Transaction {
  id: string;
  title: string;
  amount: number; // Số nguyên không âm > 0
  type: TransactionType;
  category: TransactionCategory;
  date: string; // YYYY-MM-DD
  note?: string;
  paymentMethod?: PaymentMethod;
  createdAt: number;
}

export interface GoalAllocationHistory {
  id: string;
  goalId: string;
  type: 'deposit' | 'withdraw';
  amount: number; // Số nguyên > 0
  date: string;
  note?: string;
  createdAt: number;
}

export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number; // Số nguyên > 0
  currentAmount: number; // Số tiền đã dành riêng cho mục tiêu này
  deadline?: string; // YYYY-MM-DD
  targetDays?: number; // Số ngày còn lại hoặc tổng số ngày
  priority: GoalPriority;
  category: string;
  description?: string;
  icon?: string;
  status: GoalStatus;
  history: GoalAllocationHistory[];
  createdAt: number;
}

export interface BudgetCategoryConfig {
  category: ExpenseCategory;
  limit: number; // Hạn mức VNĐ
  period: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
}

export interface MandatoryExpense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  dueDate?: string;
  isPaid: boolean;
  linkedTransactionId?: string; // ID của giao dịch thực tế đã tạo để chống tính trùng 2 lần!
  createdAt: number;
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType; // 'income' (tiền tiêu vặt, lương) hoặc 'expense' (tiền trọ, điện nước, mạng)
  category: TransactionCategory;
  frequency: RecurringFrequency;
  dueDay: number; // Ngày trong tháng (1-31) hoặc ngày trong tuần
  nextDueDate: string; // YYYY-MM-DD
  isPaidThisCycle: boolean;
  linkedTransactionId?: string; // ID của giao dịch thực tế liên kết
  note?: string;
  createdAt: number;
}

export interface EmergencyFund {
  targetAmount: number; // Mục tiêu quỹ dự phòng
  currentAmount: number; // Số tiền đã dành riêng cho quỹ dự phòng
}

export interface UserSettings {
  userName: string;
  initialBalance: number; // Số dư ban đầu khi bắt đầu dùng
  daysInPeriod: number; // Số ngày trong kỳ ngân sách (mặc định 30 ngày)
  warningThreshold70: number; // Ngưỡng cảnh báo nhẹ (mặc định 70%)
  warningThreshold85: number; // Ngưỡng cảnh báo rõ (mặc định 85%)
  warningThreshold100: number; // Ngưỡng vượt ngân sách (mặc định 100%)
  dietaryPreferences: string; // Sở thích ăn uống
  dietaryAllergies: string; // Dị ứng thực phẩm
  cookingFacilities: boolean; // Có bếp nấu không
  aiConsentGiven: boolean; // Người dùng đã xác nhận thông báo gửi context tới AI
  hasCustomData: boolean; // Đã từng nhập dữ liệu cá nhân hay đang dùng demo
  lastBackupDate?: string; // Ngày gần nhất đã sao lưu JSON
  storageBannerDismissed?: boolean;
}

export interface SavingChallenge {
  id: string;
  title: string;
  description: string;
  dailyAmount: number;
  totalDays: number;
  completedDays: number[];
  category: string;
  badge: string;
  status: 'not_started' | 'active' | 'completed' | 'paused';
  createdAt: number;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unitPriceEstimate: number; // Giá nguyên liệu trong lần đi chợ
  portionCostEstimate: number; // Chi phí phần nguyên liệu sử dụng thực tế
  reusableForNextMeal?: boolean;
}

export interface MealItem {
  type: 'Sáng' | 'Trưa' | 'Tối';
  dish: string;
  portionCount: number;
  ingredients: Ingredient[];
  preparationTimeMinutes: number;
  recipeShort: string;
  nutritionNotes?: string;
}

export interface DayMealPlan {
  dayNumber: number;
  dayTitle: string;
  meals: MealItem[];
  dailyUsedCost: number; // Chi phí nguyên liệu thực tế dùng trong ngày
}

export interface ShoppingItem {
  id: string;
  name: string;
  neededQuantity: string;
  alreadyHave: boolean;
  estimatedPrice: number;
  isPurchased: boolean;
}

export interface MealPlanResponse {
  summary: string;
  numberOfPeople: number;
  totalMarketBudgetNeeded: number; // Chi phí cần mua ở chợ trong đợt này
  totalIngredientCostUsed: number; // Chi phí nguyên liệu thực tế tiêu thụ
  days: DayMealPlan[];
  shoppingList: ShoppingItem[];
  savingTips: string[];
}

export interface PurchaseEvaluationResponse {
  recommendation: 'NEN_MUA' | 'CHO_72_GIO' | 'TIM_LUA_CHON_RE_HON' | 'KHONG_NEN_MUA';
  recommendationLabel: string;
  score: number; // 1-10
  verdictTitle: string;
  percentOfBalance: number;
  equivalentDaysOfLiving: number;
  affectedGoals: string[];
  reasoning: string;
  opportunityCost: string;
  alternativeOptions: string[];
  coolingOffQuestions: string[];
}

export interface SpendingHabitInsight {
  topCategory: { category: ExpenseCategory; amount: number; percent: number };
  fastestGrowingCategory?: { category: ExpenseCategory; increaseAmount: number; percent: number };
  recurringExpenses: Array<{ title: string; count: number; totalAmount: number }>;
  peakSpendingDays: string[];
  exceededBudgets: Array<{ category: ExpenseCategory; limit: number; actual: number }>;
  goodSavingsPeriods: string[];
  observationsWithAction: Array<{
    finding: string;
    evidence: string;
    actionableAdvice: string;
  }>;
}

export interface DataCompletenessReport {
  score: number; // 0-100%
  level: 'thap' | 'trung_binh' | 'day_du';
  missingItems: string[];
  assumptions: string[];
}

export interface FinancialHealthMetrics {
  realBalance: number; // Số dư thực tế = Số dư ban đầu + Tổng thu - Tổng chi
  totalIncome: number; // Tổng thu nhập thực tế
  totalExpense: number; // Tổng chi tiêu thực tế
  allocatedToGoals: number; // Tổng tiền đang nằm trong các mục tiêu
  emergencyFundAmount: number; // Tiền đang nằm trong quỹ dự phòng
  unallocatedMoney: number; // Tiền chưa phân bổ = Số dư thực tế - Tiền mục tiêu - Quỹ dự phòng
  unpaidMandatoryExpenses: number; // Các khoản chi bắt buộc chưa thanh toán trong kỳ
  spendableMoney: number; // Tiền có thể chi tiêu = max(0, Tiền chưa phân bổ - Chi bắt buộc chưa thanh toán)
  isDeficit: boolean; // Có bị thiếu hụt tiền (tiền đã phân bổ > số dư thực tế)?
  deficitAmount: number; // Số tiền thiếu hụt nếu có
  dailyReferenceBudget: number; // Ngân sách tham khảo mỗi ngày = max(0, spendableMoney / daysRemaining)
  daysRemaining: number;
  upcomingBillsCount: number; // Số khoản sắp đến hạn (trong 7 ngày)
  upcomingBillsTotal: number; // Tổng tiền các khoản sắp đến hạn
  dataCompleteness: DataCompletenessReport; // Đánh giá độ đầy đủ dữ liệu
}
