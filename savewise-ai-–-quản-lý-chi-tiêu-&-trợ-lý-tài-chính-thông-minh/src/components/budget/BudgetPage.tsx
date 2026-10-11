import React, { useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Plus,
  Check,
  Trash2,
  Calendar,
  Sparkles,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Coins,
} from 'lucide-react';
import {
  BudgetCategoryConfig,
  EmergencyFund,
  ExpenseCategory,
  FinancialHealthMetrics,
  MandatoryExpense,
  RecurringTransaction,
  Transaction,
  UserSettings,
} from '../../types';
import { calculateCategoryBudgetStatus, calculateDaysRemaining } from '../../services/finance';
import { formatVND, getCategoryMeta, CATEGORY_DEFINITIONS } from '../../utils/formatters';

interface BudgetPageProps {
  metrics: FinancialHealthMetrics;
  budgetConfigs: BudgetCategoryConfig[];
  emergencyFund: EmergencyFund;
  mandatoryExpenses: MandatoryExpense[];
  recurringTransactions: RecurringTransaction[];
  transactions: Transaction[];
  settings: UserSettings;
  onUpdateBudgetConfigs: (configs: BudgetCategoryConfig[]) => void;
  onUpdateEmergencyFund: (fund: EmergencyFund) => void;
  onAddMandatoryExpense: (expense: Omit<MandatoryExpense, 'id' | 'createdAt'>) => void;
  onToggleMandatoryPaid: (id: string) => void;
  onDeleteMandatoryExpense: (id: string) => void;
  onAddRecurring: (rec: Omit<RecurringTransaction, 'id' | 'createdAt'>) => void;
  onPayRecurring: (id: string) => void;
  onDeleteRecurring: (id: string) => void;
}

export const BudgetPage: React.FC<BudgetPageProps> = ({
  metrics,
  budgetConfigs,
  emergencyFund,
  mandatoryExpenses,
  recurringTransactions = [],
  transactions,
  settings,
  onUpdateBudgetConfigs,
  onUpdateEmergencyFund,
  onAddMandatoryExpense,
  onToggleMandatoryPaid,
  onDeleteMandatoryExpense,
  onAddRecurring,
  onPayRecurring,
  onDeleteRecurring,
}) => {
  // Local state for editing budget limits
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [editLimitStr, setEditLimitStr] = useState('');
  const [editPeriod, setEditPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Local state for editing emergency fund
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [emergencyTarget, setEmergencyTarget] = useState(emergencyFund.targetAmount);
  const [emergencyCurrent, setEmergencyCurrent] = useState(emergencyFund.currentAmount);

  // Local state for adding mandatory expense
  const [showAddMandatory, setShowAddMandatory] = useState(false);
  const [mandTitle, setMandTitle] = useState('');
  const [mandAmount, setMandAmount] = useState('');
  const [mandCategory, setMandCategory] = useState<ExpenseCategory>('fixed_cost');
  const [mandDueDate, setMandDueDate] = useState('');

  // Local state for adding recurring transaction
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recType, setRecType] = useState<'income' | 'expense'>('expense');
  const [recCategory, setRecCategory] = useState<any>('fixed_cost');
  const [recFrequency, setRecFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [recDueDay, setRecDueDay] = useState('5');
  const [recNote, setRecNote] = useState('');

  const expenseCategories: ExpenseCategory[] = [
    'food',
    'transport',
    'study_work',
    'personal_items',
    'entertainment',
    'shopping',
    'health',
    'family',
    'fixed_cost',
    'expense_other',
  ];

  // Save category limit
  const handleSaveCategoryLimit = (category: ExpenseCategory) => {
    const raw = parseInt(editLimitStr.replace(/\D/g, ''), 10) || 0;
    const existing = budgetConfigs.find((b) => b.category === category);

    let updated: BudgetCategoryConfig[];
    if (existing) {
      updated = budgetConfigs.map((b) =>
        b.category === category ? { ...b, limit: raw, period: editPeriod, isActive: raw > 0 } : b
      );
    } else {
      updated = [...budgetConfigs, { category, limit: raw, period: editPeriod, isActive: raw > 0 }];
    }

    onUpdateBudgetConfigs(updated);
    setEditingCategory(null);
    setEditLimitStr('');
  };

  // Save emergency fund
  const handleSaveEmergencyFund = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEmergencyFund({
      targetAmount: Math.max(0, emergencyTarget),
      currentAmount: Math.max(0, emergencyCurrent),
    });
    setIsEditingEmergency(false);
  };

  // Add mandatory expense
  const handleAddMandatorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(mandAmount.replace(/\D/g, ''), 10) || 0;
    if (!mandTitle.trim() || amount <= 0) return;

    onAddMandatoryExpense({
      title: mandTitle.trim(),
      amount,
      category: mandCategory,
      dueDate: mandDueDate || undefined,
      isPaid: false,
    });

    setMandTitle('');
    setMandAmount('');
    setMandDueDate('');
    setShowAddMandatory(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span>NGÂN SÁCH HẰNG NGÀY & KHOẢN CHI BẮT BUỘC</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Kế hoạch ngân sách & An toàn dòng tiền
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập hạn mức theo danh mục, bảo đảm tiền chi trả chi phí cố định và xác định mức tiêu an toàn mỗi ngày.
          </p>
        </div>

        {/* Daily Reference Display */}
        <div className="bg-blue-50/80 border border-blue-200/80 p-4 rounded-xl flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[11px] font-semibold text-blue-700 block">NGÂN SÁCH THAM KHẢO / NGÀY</span>
            <div className="text-xl font-extrabold text-blue-900">
              {formatVND(metrics.dailyReferenceBudget)}
            </div>
            <span className="text-[10px] text-blue-600">Trong {metrics.daysRemaining} ngày còn lại</span>
          </div>
        </div>
      </div>

      {/* DEFICIT ALERT IF ANY */}
      {metrics.isDeficit && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Cảnh báo: Thiếu hụt ngân sách phân bổ!</h4>
            <p className="mt-0.5 leading-relaxed">
              Tổng số tiền bạn đã phân bổ cho các mục tiêu tiết kiệm ({formatVND(metrics.allocatedToGoals)}) và quỹ dự phòng ({formatVND(metrics.emergencyFundAmount)}) lớn hơn số dư thực tế hiện có trong ví ({formatVND(metrics.realBalance)}).
              Bạn đang bị thiếu hụt <strong>{formatVND(metrics.deficitAmount)}</strong>. Hãy cân nhắc rút bớt một phần tiền từ mục tiêu về ví hoặc ghi nhận thêm các khoản thu nhập.
            </p>
          </div>
        </div>
      )}

      {/* 3 STATS CARDS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Tiền có thể chi tiêu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Tiền có thể chi tiêu linh hoạt</span>
          <div className="text-2xl font-extrabold text-blue-600">{formatVND(metrics.spendableMoney)}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Đã trừ {formatVND(metrics.unpaidMandatoryExpenses)} khoản bắt buộc chưa trả
          </p>
        </div>

        {/* Card 2: Tiền chưa phân bổ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Tiền chưa phân bổ trong ví</span>
          <div className={`text-2xl font-extrabold ${metrics.unallocatedMoney >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatVND(metrics.unallocatedMoney)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Số dư còn lại sau khi trừ tiền mục tiêu & dự phòng
          </p>
        </div>

        {/* Card 3: Quỹ dự phòng khẩn cấp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">Quỹ dự phòng khẩn cấp</span>
              <button
                onClick={() => setIsEditingEmergency(true)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
              >
                Cài đặt
              </button>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">
              {formatVND(emergencyFund.currentAmount)}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>Mục tiêu: {formatVND(emergencyFund.targetAmount)}</span>
            <span>
              {emergencyFund.targetAmount > 0
                ? `${Math.round((emergencyFund.currentAmount / emergencyFund.targetAmount) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: HẠN MỨC NGÂN SÁCH THEO DANH MỤC */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Hạn mức ngân sách theo danh mục chi tiêu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống theo dõi thực tế và tự động cảnh báo theo ngưỡng {settings.warningThreshold70}% (nhẹ), {settings.warningThreshold85}% (rõ) và {settings.warningThreshold100}% (vượt).
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenseCategories.map((catKey) => {
            const status = calculateCategoryBudgetStatus({
              category: catKey,
              budgetConfigs,
              transactions,
              settings,
            });
            const meta = getCategoryMeta(catKey);
            const isEditing = editingCategory === catKey;

            return (
              <div
                key={catKey}
                className={`p-4 rounded-xl border transition-all ${
                  status.alertLevel === 'danger_100'
                    ? 'border-rose-300 bg-rose-50/30'
                    : status.alertLevel === 'warning_85'
                    ? 'border-orange-300 bg-orange-50/20'
                    : status.alertLevel === 'warning_70'
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg border text-xs font-bold ${meta.badgeBg} ${meta.badgeText}`}>
                      {meta.label.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{meta.label}</h4>
                      <span className="text-[11px] text-slate-400">
                        {status.hasBudget ? `Hạn mức ${status.period === 'daily' ? 'ngày' : status.period === 'weekly' ? 'tuần' : 'tháng'}` : 'Chưa đặt hạn mức'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {status.alertLevel === 'danger_100' && (
                      <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                        VƯỢT NGÂN SÁCH
                      </span>
                    )}
                    {status.alertLevel === 'warning_85' && (
                      <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                        CẢNH BÁO {status.percentUsed}%
                      </span>
                    )}
                    {status.alertLevel === 'warning_70' && (
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        GẦN ĐẠT {status.percentUsed}%
                      </span>
                    )}

                    <button
                      onClick={() => {
                        if (isEditing) {
                          setEditingCategory(null);
                        } else {
                          setEditingCategory(catKey);
                          setEditLimitStr(status.limit > 0 ? new Intl.NumberFormat('vi-VN').format(status.limit) : '');
                          setEditPeriod(status.period);
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold ml-1 cursor-pointer"
                    >
                      {isEditing ? 'Đóng' : 'Sửa'}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {status.hasBudget ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">
                        Đã chi: <strong className="text-slate-800">{formatVND(status.actualSpent)}</strong>
                      </span>
                      <span className="text-slate-500">
                        Hạn mức: <strong className="text-slate-800">{formatVND(status.limit)}</strong>
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          status.alertLevel === 'danger_100'
                            ? 'bg-rose-500'
                            : status.alertLevel === 'warning_85'
                            ? 'bg-orange-500'
                            : status.alertLevel === 'warning_70'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, status.percentUsed)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Đã dùng {status.percentUsed}%</span>
                      <span className={status.isOverBudget ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'}>
                        {status.isOverBudget ? `Vượt ${formatVND(status.overAmount)}` : `Còn lại ${formatVND(status.remaining)}`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-400">
                    Đã chi tiêu trong kỳ: <strong>{formatVND(status.actualSpent)}</strong>
                  </div>
                )}

                {/* Inline Edit Form */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editLimitStr}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setEditLimitStr(raw ? new Intl.NumberFormat('vi-VN').format(parseInt(raw, 10)) : '');
                        }}
                        placeholder="Số tiền hạn mức (VNĐ)"
                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                      />
                      <select
                        value={editPeriod}
                        onChange={(e) => setEditPeriod(e.target.value as any)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="daily">Hằng ngày</option>
                        <option value="weekly">Hằng tuần</option>
                        <option value="monthly">Hằng tháng</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSaveCategoryLimit(catKey)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Lưu hạn mức
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: KHOẢN CHI BẮT BUỘC CHƯA THANH TOÁN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Các khoản chi bắt buộc trong kỳ ({mandatoryExpenses.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bao gồm tiền trọ, điện nước, internet, học phí... phải giữ lại tiền trước khi xác định ngân sách sinh hoạt.
            </p>
          </div>

          <button
            onClick={() => setShowAddMandatory(true)}
            className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm khoản chi bắt buộc</span>
          </button>
        </div>

        {/* Mandatory Form Modal/Expand */}
        {showAddMandatory && (
          <form onSubmit={handleAddMandatorySubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900">Thêm khoản chi bắt buộc mới</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={mandTitle}
                onChange={(e) => setMandTitle(e.target.value)}
                placeholder="Tên khoản chi (ví dụ: Tiền phòng trọ)"
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                required
                value={mandAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setMandAmount(raw ? new Intl.NumberFormat('vi-VN').format(parseInt(raw, 10)) : '');
                }}
                placeholder="Số tiền cần trả (VNĐ)"
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
              />
              <input
                type="date"
                value={mandDueDate}
                onChange={(e) => setMandDueDate(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddMandatory(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Lưu khoản chi
              </button>
            </div>
          </form>
        )}

        {/* Mandatory list */}
        {mandatoryExpenses.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {mandatoryExpenses.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleMandatoryPaid(m.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                      m.isPaid
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-blue-500'
                    }`}
                    title={m.isPaid ? 'Đã thanh toán (bấm để hoàn tác)' : 'Chưa thanh toán (bấm để ghi nhận đã trả)'}
                  >
                    {m.isPaid && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div>
                    <div className={`text-xs font-bold ${m.isPaid ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {m.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{formatVND(m.amount)}</span>
                      {m.dueDate && (
                        <>
                          <span>·</span>
                          <span>Hạn trả: {m.dueDate}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className={m.isPaid ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {m.isPaid ? '✓ Đã thanh toán (tự trừ ví)' : 'Chưa trả (đang giữ chỗ)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-extrabold ${m.isPaid ? 'text-slate-400' : 'text-slate-900'}`}>
                    {formatVND(m.amount)}
                  </span>
                  <button
                    onClick={() => onDeleteMandatoryExpense(m.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Chưa có khoản chi bắt buộc nào. Thêm các khoản cố định (tiền trọ, điện, nước) để bảo đảm không bị thiếu hụt!
          </div>
        )}
      </div>

      {/* SECTION 3: QUẢN LÝ KHOẢN THU CHI ĐỊNH KỲ (RECURRING BILLS & INCOME) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Quản lý thu chi định kỳ & Nhắc đến hạn ({recurringTransactions.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động nhắc lịch và hỗ trợ ghi nhận thanh toán nhanh, bảo đảm không bị ghi trùng hóa đơn 2 lần.
            </p>
          </div>

          <button
            onClick={() => setShowAddRecurring(true)}
            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm khoản định kỳ</span>
          </button>
        </div>

        {/* Add Recurring Form */}
        {showAddRecurring && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const raw = parseInt(recAmount.replace(/\D/g, ''), 10) || 0;
              if (!recTitle.trim() || raw <= 0) return;

              const today = new Date();
              const dayNum = parseInt(recDueDay, 10) || 5;
              const nextDate = new Date(today.getFullYear(), today.getMonth(), dayNum);
              if (nextDate.getTime() < today.getTime()) {
                nextDate.setMonth(nextDate.getMonth() + 1);
              }
              const nextDueDateStr = nextDate.toISOString().split('T')[0];

              onAddRecurring({
                title: recTitle.trim(),
                amount: raw,
                type: recType,
                category: recCategory,
                frequency: recFrequency,
                dueDay: dayNum,
                nextDueDate: nextDueDateStr,
                isPaidThisCycle: false,
                note: recNote.trim() || undefined,
              });

              setRecTitle('');
              setRecAmount('');
              setRecNote('');
              setShowAddRecurring(false);
            }}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in"
          >
            <h4 className="text-xs font-bold text-slate-900">Thiết lập khoản thu chi định kỳ</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={recType}
                onChange={(e) => setRecType(e.target.value as any)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold"
              >
                <option value="expense">Khoản chi (tiền trọ, netflix, mạng...)</option>
                <option value="income">Khoản thu (tiền tiêu vặt, lương...)</option>
              </select>

              <input
                type="text"
                required
                value={recTitle}
                onChange={(e) => setRecTitle(e.target.value)}
                placeholder="Tên khoản (ví dụ: Tiền mạng, Lương tuần...)"
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <input
                type="text"
                required
                value={recAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setRecAmount(raw ? new Intl.NumberFormat('vi-VN').format(parseInt(raw, 10)) : '');
                }}
                placeholder="Số tiền (VNĐ)"
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
              />

              <select
                value={recFrequency}
                onChange={(e) => setRecFrequency(e.target.value as any)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              >
                <option value="monthly">Hằng tháng</option>
                <option value="weekly">Hằng tuần</option>
                <option value="biweekly">2 tuần một lần</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ngày đến hạn trong tháng (1 - 31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={recDueDay}
                  onChange={(e) => setRecDueDay(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ghi chú chi tiết (tùy chọn)
                </label>
                <input
                  type="text"
                  value={recNote}
                  onChange={(e) => setRecNote(e.target.value)}
                  placeholder="Ví dụ: Đóng qua chuyển khoản hoặc tiền mặt"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddRecurring(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Lưu khoản định kỳ
              </button>
            </div>
          </form>
        )}

        {/* Recurring List */}
        {recurringTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recurringTransactions.map((r) => {
              const daysLeft = calculateDaysRemaining(r.nextDueDate);
              const isOverdue = daysLeft === 0 && !r.isPaidThisCycle;
              const isDueSoon = daysLeft <= 3 && !r.isPaidThisCycle;

              return (
                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-extrabold ${
                        r.type === 'income'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {r.type === 'income' ? '+Thu' : '-Chi'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${r.isPaidThisCycle ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {r.title}
                        </span>
                        {/* Due Badge */}
                        {r.isPaidThisCycle ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Chu kỳ này đã xong
                          </span>
                        ) : isOverdue ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            ⚠️ Đã đến hạn hôm nay
                          </span>
                        ) : isDueSoon ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ⏳ Còn {daysLeft} ngày
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                            Còn {daysLeft} ngày
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-slate-700">{formatVND(r.amount)}</span>
                        <span>·</span>
                        <span>
                          {r.frequency === 'monthly' ? `Ngày ${r.dueDay} hàng tháng` : 'Định kỳ tuần'}
                        </span>
                        {r.note && (
                          <>
                            <span>·</span>
                            <span>{r.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!r.isPaidThisCycle && (
                      <button
                        type="button"
                        onClick={() => onPayRecurring(r.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 ${
                          r.type === 'income'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{r.type === 'income' ? 'Đã nhận tiền' : 'Thanh toán ngay'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteRecurring(r.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Xóa khoản định kỳ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Chưa có khoản thu chi định kỳ nào. Thêm tiền tiêu vặt hoặc tiền nhà để hệ thống tự động nhắc lịch!
          </div>
        )}
      </div>

      {/* MODAL EDIT EMERGENCY FUND */}
      {isEditingEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Thiết lập Quỹ dự phòng khẩn cấp</h3>
            <form onSubmit={handleSaveEmergencyFund} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mục tiêu quỹ dự phòng (VNĐ)
                </label>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  value={emergencyTarget}
                  onChange={(e) => setEmergencyTarget(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tiền hiện đang giữ trong quỹ dự phòng (VNĐ)
                </label>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  value={emergencyCurrent}
                  onChange={(e) => setEmergencyCurrent(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Khoản tiền này sẽ được khóa riêng, không bị tính vào ngân sách tiêu vặt hằng ngày.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingEmergency(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Lưu quỹ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
