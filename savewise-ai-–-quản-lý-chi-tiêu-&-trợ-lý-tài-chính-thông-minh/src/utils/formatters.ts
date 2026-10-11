import { TransactionCategory, IncomeCategory, ExpenseCategory } from '../types';

export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 đ';
  const rounded = Math.round(amount);
  return new Intl.NumberFormat('vi-VN').format(rounded) + ' đ';
}

export function formatNumberVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (day && month && year) {
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export interface CategoryMeta {
  label: string;
  type: 'income' | 'expense';
  icon: string;
  badgeBg: string;
  badgeText: string;
}

export const CATEGORY_DEFINITIONS: Record<TransactionCategory, CategoryMeta> = {
  // Khoản thu nhập
  allowance: {
    label: 'Tiền tiêu vặt',
    type: 'income',
    icon: 'Coins',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-700',
  },
  salary: {
    label: 'Lương & Tiền công',
    type: 'income',
    icon: 'Briefcase',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-700',
  },
  bonus: {
    label: 'Tiền thưởng',
    type: 'income',
    icon: 'Sparkles',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-700',
  },
  gift: {
    label: 'Tiền được tặng',
    type: 'income',
    icon: 'Gift',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-700',
  },
  income_other: {
    label: 'Thu nhập khác',
    type: 'income',
    icon: 'PlusCircle',
    badgeBg: 'bg-slate-50 border-slate-200',
    badgeText: 'text-slate-700',
  },

  // Khoản chi tiêu
  food: {
    label: 'Ăn uống',
    type: 'expense',
    icon: 'Utensils',
    badgeBg: 'bg-orange-50 border-orange-200',
    badgeText: 'text-orange-700',
  },
  transport: {
    label: 'Đi lại & Xăng xe',
    type: 'expense',
    icon: 'Car',
    badgeBg: 'bg-cyan-50 border-cyan-200',
    badgeText: 'text-cyan-700',
  },
  study_work: {
    label: 'Học tập & Công việc',
    type: 'expense',
    icon: 'GraduationCap',
    badgeBg: 'bg-indigo-50 border-indigo-200',
    badgeText: 'text-indigo-700',
  },
  personal_items: {
    label: 'Đồ dùng cá nhân',
    type: 'expense',
    icon: 'Tag',
    badgeBg: 'bg-violet-50 border-violet-200',
    badgeText: 'text-violet-700',
  },
  entertainment: {
    label: 'Giải trí',
    type: 'expense',
    icon: 'Gamepad2',
    badgeBg: 'bg-pink-50 border-pink-200',
    badgeText: 'text-pink-700',
  },
  shopping: {
    label: 'Mua sắm',
    type: 'expense',
    icon: 'ShoppingBag',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-700',
  },
  health: {
    label: 'Sức khỏe',
    type: 'expense',
    icon: 'HeartPulse',
    badgeBg: 'bg-red-50 border-red-200',
    badgeText: 'text-red-700',
  },
  family: {
    label: 'Gia đình',
    type: 'expense',
    icon: 'Users',
    badgeBg: 'bg-teal-50 border-teal-200',
    badgeText: 'text-teal-700',
  },
  fixed_cost: {
    label: 'Chi phí cố định (Trọ, Điện, Nước)',
    type: 'expense',
    icon: 'Home',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-700',
  },
  expense_other: {
    label: 'Chi tiêu khác',
    type: 'expense',
    icon: 'CircleDot',
    badgeBg: 'bg-slate-50 border-slate-200',
    badgeText: 'text-slate-700',
  },
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_DEFINITIONS[category as TransactionCategory]?.label || category;
}

export function getCategoryMeta(category: string): CategoryMeta {
  return (
    CATEGORY_DEFINITIONS[category as TransactionCategory] || {
      label: category,
      type: 'expense',
      icon: 'CircleDot',
      badgeBg: 'bg-slate-50 border-slate-200',
      badgeText: 'text-slate-700',
    }
  );
}
