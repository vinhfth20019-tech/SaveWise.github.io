import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Sparkles,
  TrendingUp,
  History,
  CheckCircle2,
  AlertCircle,
  Coins,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { FinancialHealthMetrics, GoalPriority, SavingsGoal } from '../types';
import { calculateGoalPlan } from '../services/finance';
import { formatVND, formatDateVN } from '../utils/formatters';

interface SmartGoalProps {
  goals: SavingsGoal[];
  metrics: FinancialHealthMetrics;
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'history' | 'createdAt'>) => void;
  onOpenAllocateModal: (goal: SavingsGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onConsultAI: (goal: SavingsGoal) => void;
}

export const SmartGoal: React.FC<SmartGoalProps> = ({
  goals,
  metrics,
  onAddGoal,
  onOpenAllocateModal,
  onDeleteGoal,
  onConsultAI,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(goals[0]?.id || null);

  // Form states
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState(1500000);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<GoalPriority>('high');
  const [category, setCategory] = useState('Học tập & Công nghệ');
  const [description, setDescription] = useState('');

  const activeGoal = goals.find((g) => g.id === selectedGoalId) || goals[0] || null;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetAmount <= 0) return;

    onAddGoal({
      title: title.trim(),
      targetAmount,
      currentAmount: Math.max(0, currentAmount),
      deadline: deadline || undefined,
      priority,
      category,
      description: description.trim() || undefined,
      status: 'active',
    });

    setIsAdding(false);
    setTitle('');
    setTargetAmount(1500000);
    setCurrentAmount(0);
    setDescription('');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <Target className="w-4 h-4 text-blue-600" />
            <span>SMART GOAL · MỤC TIÊU TIẾT KIỆM THÔNG MINH</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Kế hoạch tích lũy & Chinh phục ước mơ
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Số tiền dành cho mục tiêu là phân bổ nội bộ, không làm thay đổi tổng số tiền thực tế và không bị tính thành chi tiêu.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mục tiêu mới</span>
        </button>
      </div>

      {/* CREATE GOAL EXPANDABLE FORM */}
      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-500/30 shadow-md animate-in fade-in">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Thiết lập mục tiêu tiết kiệm mới</h3>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên mục tiêu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Mua tai nghe chống ồn, Du lịch Đà Lạt..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Danh mục mục tiêu
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Học tập & Công nghệ">Học tập & Công nghệ</option>
                  <option value="Du lịch & Trải nghiệm">Du lịch & Trải nghiệm</option>
                  <option value="Quỹ dự phòng khẩn cấp">Quỹ dự phòng khẩn cấp</option>
                  <option value="Mua sắm cá nhân">Mua sắm cá nhân</option>
                  <option value="Tự do tài chính nhỏ">Tự do tài chính nhỏ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tiền cần đạt (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="50000"
                  min="50000"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tiền đã dành riêng ban đầu (VNĐ)
                </label>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hạn hoàn thành (tùy chọn)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do / Mô tả ý nghĩa mục tiêu
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ví dụ: Phục vụ nghe bài giảng tiếng Anh hàng ngày..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Lưu mục tiêu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GOALS LIST & DETAILED PLAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Goals List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Danh sách mục tiêu ({goals.length})
            </h3>
            <span className="text-[11px] text-slate-400">Bấm để xem chi tiết</span>
          </div>

          {goals.map((g) => {
            const plan = calculateGoalPlan(g);
            const isSelected = g.id === (activeGoal?.id || '');

            return (
              <div
                key={g.id}
                onClick={() => setSelectedGoalId(g.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{g.title}</h4>
                    <span className="text-[11px] text-slate-400">{g.category}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    plan.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {plan.progressPercent}%
                  </span>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${plan.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1.5 text-slate-500 font-medium">
                    <span>Đã có: {formatVND(plan.current)}</span>
                    <span>Đích: {formatVND(plan.target)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{plan.daysLeft > 0 ? `Còn ${plan.daysLeft} ngày` : 'Chưa có hạn'}</span>
                  {plan.dailyNeeded > 0 ? (
                    <span className="font-bold text-blue-700">Cần {formatVND(plan.dailyNeeded)}/ngày</span>
                  ) : plan.isCompleted ? (
                    <span className="font-bold text-emerald-700">Đã hoàn thành!</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Goal Details (7 cols) */}
        {activeGoal && (
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            {/* Goal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-blue-700">{activeGoal.category}</span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {activeGoal.title}
                </h3>
                {activeGoal.description && (
                  <p className="text-xs text-slate-500 mt-1">{activeGoal.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAllocateModal(activeGoal)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Coins className="w-4 h-4" />
                  <span>Nạp / Rút tiền</span>
                </button>

                <button
                  onClick={() => onConsultAI(activeGoal)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Hỏi AI kế hoạch thực tế cho mục tiêu này"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">AI Cố vấn</span>
                </button>
              </div>
            </div>

            {/* Calculations Breakdown */}
            {(() => {
              const plan = calculateGoalPlan(activeGoal);
              const isAmbitious = plan.dailyNeeded > metrics.dailyReferenceBudget * 0.6 && metrics.dailyReferenceBudget > 0;

              return (
                <div className="space-y-4">
                  {/* Progress Meter */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-semibold text-slate-600">Tiến độ tích lũy thực tế</span>
                      <span className="text-base font-extrabold text-emerald-700">{plan.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${plan.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs mt-2 text-slate-500 font-medium">
                      <span>Đã dành riêng: <strong>{formatVND(plan.current)}</strong></span>
                      <span>Mục tiêu: <strong>{formatVND(plan.target)}</strong></span>
                    </div>
                  </div>

                  {/* 3 Metrics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 block mb-0.5">Số tiền còn thiếu</span>
                      <div className="text-base font-extrabold text-slate-900">{formatVND(plan.deficit)}</div>
                    </div>

                    <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                      <span className="text-[11px] text-blue-800 block mb-0.5">Cần tiết kiệm / ngày</span>
                      <div className="text-base font-extrabold text-blue-700">
                        {plan.isCompleted ? 'Đã hoàn thành' : plan.dailyNeeded > 0 ? formatVND(plan.dailyNeeded) : 'Chưa đặt hạn'}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 block mb-0.5">Cần tiết kiệm / tuần</span>
                      <div className="text-base font-extrabold text-slate-900">
                        {plan.isCompleted ? '0 đ' : formatVND(plan.weeklyNeeded)}
                      </div>
                    </div>
                  </div>

                  {/* Feasibility Assessment (Section 7.4) */}
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                      isAmbitious
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-blue-50/50 border-blue-200 text-blue-950'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                    <div>
                      <h4 className="font-bold mb-1">
                        {isAmbitious
                          ? 'Đánh giá tính khả thi: Cần điều chỉnh nhẹ'
                          : 'Đánh giá tính khả thi: Kế hoạch cân đối & hợp lý'}
                      </h4>
                      <p>
                        {isAmbitious
                          ? `Để đạt mục tiêu trong ${plan.daysLeft} ngày, bạn cần tiết kiệm ${formatVND(plan.dailyNeeded)}/ngày, chiếm hơn 60% hạn mức sinh hoạt tham khảo (${formatVND(metrics.dailyReferenceBudget)}/ngày). Hệ thống đề xuất kéo dài thời hạn thêm khoảng ${Math.ceil(plan.daysLeft * 1.5)} ngày để không bị áp lực nhịn ăn!`
                          : plan.dailyNeeded > 0
                          ? `Mức tích lũy ${formatVND(plan.dailyNeeded)}/ngày hoàn toàn nằm trong tầm tay, chỉ tương đương một ly cà phê hoặc một lần bớt ăn vặt. Kiên trì ${plan.daysLeft} ngày nữa là hoàn thành!`
                          : 'Hãy đặt hạn hoàn thành cho mục tiêu này để hệ thống tính toán con số tiết kiệm chính xác mỗi ngày cho bạn.'}
                      </p>
                    </div>
                  </div>

                  {/* Allocation History (Section 6.4) */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      <span>Lịch sử phân bổ & Rút tiền ({activeGoal.history?.length || 0})</span>
                    </h4>

                    {activeGoal.history && activeGoal.history.length > 0 ? (
                      <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                        {activeGoal.history.map((h) => (
                          <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-semibold text-slate-800">
                                {h.note || (h.type === 'deposit' ? 'Phân bổ vào quỹ' : 'Rút tiền về ví')}
                              </div>
                              <span className="text-[11px] text-slate-400">{formatDateVN(h.date)}</span>
                            </div>
                            <span
                              className={`font-bold ${
                                h.type === 'deposit' ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {h.type === 'deposit' ? `+${formatVND(h.amount)}` : `-${formatVND(h.amount)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        Chưa có lịch sử phân bổ nào. Bấm nút "Nạp / Rút tiền" để khởi động mục tiêu!
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
