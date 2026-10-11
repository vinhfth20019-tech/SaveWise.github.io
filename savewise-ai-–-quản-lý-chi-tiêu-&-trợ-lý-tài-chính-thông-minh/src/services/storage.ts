import {
  Transaction,
  SavingsGoal,
  BudgetCategoryConfig,
  EmergencyFund,
  MandatoryExpense,
  SavingChallenge,
  UserSettings,
  RecurringTransaction,
} from '../types';

export const SCHEMA_VERSION = 2;
const STORAGE_KEY = 'savewise_app_data_v2';

export interface StorageData {
  schemaVersion: number;
  transactions: Transaction[];
  goals: SavingsGoal[];
  budgetConfigs: BudgetCategoryConfig[];
  emergencyFund: EmergencyFund;
  mandatoryExpenses: MandatoryExpense[];
  recurringTransactions: RecurringTransaction[];
  challenges: SavingChallenge[];
  settings: UserSettings;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  userName: 'Bạn',
  initialBalance: 3000000, // 3.000.000 đ
  daysInPeriod: 30, // 30 ngày
  warningThreshold70: 70,
  warningThreshold85: 85,
  warningThreshold100: 100,
  dietaryPreferences: 'Ăn uống đa dạng, thích rau xanh',
  dietaryAllergies: '',
  cookingFacilities: true,
  aiConsentGiven: true,
  hasCustomData: false,
};

export const DEFAULT_BUDGET_CONFIGS: BudgetCategoryConfig[] = [
  { category: 'food', limit: 1200000, period: 'monthly', isActive: true },
  { category: 'transport', limit: 300000, period: 'monthly', isActive: true },
  { category: 'study_work', limit: 250000, period: 'monthly', isActive: true },
  { category: 'entertainment', limit: 200000, period: 'monthly', isActive: true },
  { category: 'personal_items', limit: 200000, period: 'monthly', isActive: true },
  { category: 'shopping', limit: 300000, period: 'monthly', isActive: true },
];

export const DEMO_DATA: StorageData = {
  schemaVersion: SCHEMA_VERSION,
  settings: {
    ...DEFAULT_USER_SETTINGS,
    userName: 'Minh',
    initialBalance: 3200000, // 3.200.000 đ
    hasCustomData: false,
  },
  emergencyFund: {
    targetAmount: 1000000, // 1.000.000 đ
    currentAmount: 300000, // Đã tích lũy 300.000 đ
  },
  mandatoryExpenses: [
    {
      id: 'm-1',
      title: 'Tiền phòng trọ & điện nước',
      amount: 1200000,
      category: 'fixed_cost',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      isPaid: false,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'm-2',
      title: 'Tiền mạng Internet phòng',
      amount: 100000,
      category: 'fixed_cost',
      dueDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
      isPaid: false,
      createdAt: Date.now() - 86400000 * 3,
    },
  ],
  recurringTransactions: [
    {
      id: 'rec-1',
      title: 'Tiền tiêu vặt / trợ cấp gia đình',
      amount: 3000000,
      type: 'income',
      category: 'allowance',
      frequency: 'monthly',
      dueDay: 1,
      nextDueDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      isPaidThisCycle: true,
      note: 'Nhận cố định đầu mỗi tháng',
      createdAt: Date.now() - 86400000 * 10,
    },
    {
      id: 'rec-2',
      title: 'Tiền phòng trọ cố định',
      amount: 1200000,
      type: 'expense',
      category: 'fixed_cost',
      frequency: 'monthly',
      dueDay: 5,
      nextDueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      isPaidThisCycle: false,
      note: 'Đóng trước ngày mùng 5 hàng tháng',
      createdAt: Date.now() - 86400000 * 10,
    },
    {
      id: 'rec-3',
      title: 'Gói Spotify / YouTube Premium sinh viên',
      amount: 35000,
      type: 'expense',
      category: 'entertainment',
      frequency: 'monthly',
      dueDay: 15,
      nextDueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      isPaidThisCycle: false,
      note: 'Trừ tự động thẻ ngân hàng',
      createdAt: Date.now() - 86400000 * 10,
    },
  ],
  goals: [
    {
      id: 'goal-1',
      title: 'Tai nghe Bluetooth học ngoại ngữ',
      targetAmount: 1500000,
      currentAmount: 450000,
      targetDays: 60,
      deadline: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      priority: 'high',
      category: 'Học tập & Công nghệ',
      description: 'Chống ồn tốt, học nghe IELTS và tham gia lớp học trực tuyến.',
      status: 'active',
      createdAt: Date.now() - 86400000 * 10,
      history: [
        {
          id: 'c-1',
          goalId: 'goal-1',
          type: 'deposit',
          amount: 250000,
          date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
          note: 'Phân bổ từ tiền dạy thêm',
          createdAt: Date.now() - 86400000 * 5,
        },
        {
          id: 'c-2',
          goalId: 'goal-1',
          type: 'deposit',
          amount: 200000,
          date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
          note: 'Tiết kiệm tuần trước',
          createdAt: Date.now() - 86400000 * 2,
        },
      ],
    },
    {
      id: 'goal-2',
      title: 'Chuyến dã ngoại cuối kỳ cùng lớp',
      targetAmount: 800000,
      currentAmount: 200000,
      targetDays: 45,
      deadline: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
      priority: 'medium',
      category: 'Du lịch & Trải nghiệm',
      description: 'Chuyến đi 2 ngày 1 đêm xả stress sau thi kết thúc học phần.',
      status: 'active',
      createdAt: Date.now() - 86400000 * 15,
      history: [
        {
          id: 'c-3',
          goalId: 'goal-2',
          type: 'deposit',
          amount: 200000,
          date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
          note: 'Trích từ tiền mừng tuổi',
          createdAt: Date.now() - 86400000 * 8,
        },
      ],
    },
  ],
  budgetConfigs: DEFAULT_BUDGET_CONFIGS,
  challenges: [
    {
      id: 'ch-1',
      title: 'Tích lũy 10.000đ mỗi ngày trong 30 ngày',
      description: 'Bỏ ống heo đều đặn 10k mỗi ngày. Sau 1 tháng bạn sẽ có 300.000đ mà không áp lực.',
      dailyAmount: 10000,
      totalDays: 30,
      completedDays: [1, 2, 3, 4, 5],
      category: 'Tích lũy nhỏ',
      badge: 'Heo đất chăm chỉ',
      status: 'active',
      createdAt: Date.now() - 86400000 * 6,
    },
    {
      id: 'ch-2',
      title: '7 ngày không trà sữa & đồ uống ngọt',
      description: 'Tự mang bình nước lọc cá nhân thay vì mua trà sữa 35k-50k. Khỏe đẹp và bảo vệ ví tiền.',
      dailyAmount: 35000,
      totalDays: 7,
      completedDays: [1, 2, 3],
      category: 'Cắt giảm lãng phí',
      badge: 'Khắc tinh trà sữa',
      status: 'active',
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: 'ch-3',
      title: 'Tuần lễ tự nấu ăn tại nhà',
      description: 'Tự chuẩn bị cơm hộp đi học/đi làm 7 ngày liên tiếp để tiết kiệm hơn 40% chi phí ăn uống.',
      dailyAmount: 30000,
      totalDays: 7,
      completedDays: [1, 2],
      category: 'Ẩm thực tiết kiệm',
      badge: 'Đầu bếp sinh viên',
      status: 'active',
      createdAt: Date.now() - 86400000 * 3,
    },
  ],
  transactions: [
    {
      id: 'tx-1',
      title: 'Cơm trưa bình dân sườn trứng',
      amount: 35000,
      type: 'expense',
      category: 'food',
      date: new Date().toISOString().split('T')[0],
      note: 'Quán cơm gần cổng trường',
      paymentMethod: 'cash',
      createdAt: Date.now() - 3600000 * 3,
    },
    {
      id: 'tx-2',
      title: 'Cà phê muối sáng',
      amount: 18000,
      type: 'expense',
      category: 'food',
      date: new Date().toISOString().split('T')[0],
      note: 'Mua mang đi trước giờ vào lớp',
      paymentMethod: 'e-wallet',
      createdAt: Date.now() - 3600000 * 5,
    },
    {
      id: 'tx-3',
      title: 'Đổ xăng xe máy Wave',
      amount: 60000,
      type: 'expense',
      category: 'transport',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      note: 'Đổ đầy bình đi cả tuần',
      paymentMethod: 'cash',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'tx-4',
      title: 'Mua giáo trình & in tài liệu ôn thi',
      amount: 45000,
      type: 'expense',
      category: 'study_work',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      note: 'Tài liệu ôn thi giữa kỳ',
      paymentMethod: 'cash',
      createdAt: Date.now() - 86400000 * 1.2,
    },
    {
      id: 'tx-5',
      title: 'Đi chợ mua thực phẩm nấu 2 ngày',
      amount: 85000,
      type: 'expense',
      category: 'food',
      date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      note: 'Thịt heo, trứng gà, rau muống, đậu phụ',
      paymentMethod: 'e-wallet',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'tx-6',
      title: 'Nhận phụ cấp gia đình tháng này',
      amount: 3000000,
      type: 'income',
      category: 'allowance',
      date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      note: 'Bố mẹ gửi đầu tháng',
      paymentMethod: 'bank',
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'tx-7',
      title: 'Tiền làm gia sư part-time',
      amount: 800000,
      type: 'income',
      category: 'salary',
      date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      note: '4 buổi tuần trước',
      paymentMethod: 'bank',
      createdAt: Date.now() - 86400000 * 4,
    },
  ],
};

export const EMPTY_DATA: StorageData = {
  schemaVersion: SCHEMA_VERSION,
  settings: DEFAULT_USER_SETTINGS,
  emergencyFund: {
    targetAmount: 1000000,
    currentAmount: 0,
  },
  mandatoryExpenses: [],
  recurringTransactions: [],
  goals: [],
  budgetConfigs: DEFAULT_BUDGET_CONFIGS,
  challenges: [],
  transactions: [],
};

export function loadAppData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Mặc định nạp demo data để người dùng trải nghiệm ngay lập tức
      saveAppData(DEMO_DATA);
      return DEMO_DATA;
    }
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion === SCHEMA_VERSION && Array.isArray(parsed.transactions)) {
      return {
        ...DEMO_DATA,
        ...parsed,
        settings: { ...DEFAULT_USER_SETTINGS, ...(parsed.settings || {}) },
      };
    }
    // Nếu schema cũ, nâng cấp hoặc giữ an toàn
    return DEMO_DATA;
  } catch (err) {
    console.error('Lỗi khi đọc dữ liệu từ LocalStorage, dùng dữ liệu an toàn:', err);
    return DEMO_DATA;
  }
}

export function saveAppData(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Không thể lưu dữ liệu vào LocalStorage:', err);
  }
}

export function exportBackupJSON(data: StorageData): string {
  const exportPayload = {
    ...data,
    exportedAt: new Date().toISOString(),
    appName: 'SAVEWISE AI',
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function validateAndImportBackupJSON(jsonStr: string): {
  success: boolean;
  data?: StorageData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonStr);

    if (typeof parsed !== 'object' || parsed === null) {
      return { success: false, error: 'Tệp JSON không hợp lệ.' };
    }

    if (!Array.isArray(parsed.transactions) || !Array.isArray(parsed.goals)) {
      return {
        success: false,
        error: 'Cấu trúc tệp sao lưu không đúng định dạng SAVEWISE AI (thiếu transactions hoặc goals).',
      };
    }

    // Validate transactions
    for (const t of parsed.transactions) {
      if (!t.title || typeof t.amount !== 'number' || isNaN(t.amount) || t.amount < 0) {
        return {
          success: false,
          error: `Phát hiện giao dịch không hợp lệ trong tệp sao lưu: ${t.title || 'không tên'}`,
        };
      }
    }

    // Build valid data
    const validData: StorageData = {
      schemaVersion: SCHEMA_VERSION,
      transactions: parsed.transactions,
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      budgetConfigs: Array.isArray(parsed.budgetConfigs) ? parsed.budgetConfigs : DEFAULT_BUDGET_CONFIGS,
      emergencyFund: parsed.emergencyFund || { targetAmount: 1000000, currentAmount: 0 },
      mandatoryExpenses: Array.isArray(parsed.mandatoryExpenses) ? parsed.mandatoryExpenses : [],
      recurringTransactions: Array.isArray(parsed.recurringTransactions) ? parsed.recurringTransactions : [],
      challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [],
      settings: { ...DEFAULT_USER_SETTINGS, ...(parsed.settings || {}) },
    };

    saveAppData(validData);
    return { success: true, data: validData };
  } catch (err: any) {
    return { success: false, error: 'Không thể phân tích cú pháp tệp JSON: ' + (err?.message || 'Lỗi cú pháp') };
  }
}
