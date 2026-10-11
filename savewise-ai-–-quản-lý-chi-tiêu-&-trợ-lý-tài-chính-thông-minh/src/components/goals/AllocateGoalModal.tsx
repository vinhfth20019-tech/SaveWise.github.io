import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, AlertTriangle, Check, Coins } from 'lucide-react';
import { SavingsGoal } from '../../types';
import { formatVND } from '../../utils/formatters';

interface AllocateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  unallocatedMoney: number;
  onAllocate: (goalId: string, amount: number, type: 'deposit' | 'withdraw', note?: string) => void;
}

export const AllocateGoalModal: React.FC<AllocateGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  unallocatedMoney,
  onAllocate,
}) => {
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [warningConfirmed, setWarningConfirmed] = useState(false);

  if (!isOpen || !goal) return null;

  const rawAmount = parseInt(amountStr.replace(/\D/g, ''), 10) || 0;

  // Kiểm tra nếu nạp vượt số tiền chưa phân bổ
  const isOverUnallocated = actionType === 'deposit' && rawAmount > unallocatedMoney;
  // Kiểm tra nếu rút vượt số tiền đang có trong mục tiêu
  const isOverCurrentGoal = actionType === 'withdraw' && rawAmount > goal.currentAmount;

  const quickAmounts = actionType === 'deposit'
    ? [20000, 50000, 100000, 200000, 500000]
    : [20000, 50000, 100000, goal.currentAmount];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawAmount <= 0) return;

    if (isOverCurrentGoal) {
      alert(`Không thể rút vượt quá số tiền hiện có trong mục tiêu (${formatVND(goal.currentAmount)})!`);
      return;
    }

    if (isOverUnallocated && !warningConfirmed) {
      alert('Vui lòng xác nhận rằng bạn đồng ý phân bổ vượt số tiền chưa phân bổ!');
      return;
    }

    onAllocate(goal.id, rawAmount, actionType, note.trim() || undefined);
    setAmountStr('');
    setNote('');
    setWarningConfirmed(false);
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAmountStr('');
      return;
    }
    setAmountStr(new Intl.NumberFormat('vi-VN').format(parseInt(raw, 10)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Phân bổ quỹ mục tiêu</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">{goal.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Action Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setActionType('deposit');
                setWarningConfirmed(false);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                actionType === 'deposit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Nạp tiền vào quỹ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActionType('withdraw');
                setWarningConfirmed(false);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                actionType === 'withdraw'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Rút tiền về ví</span>
            </button>
          </div>

          {/* Quick Context Stats */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Đang có trong mục tiêu:</span>
              <strong className="text-slate-900">{formatVND(goal.currentAmount)}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Mục tiêu cần đạt:</span>
              <span className="font-semibold text-slate-700">{formatVND(goal.targetAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200/50">
              <span>Tiền chưa phân bổ trong ví:</span>
              <strong className={unallocatedMoney >= 0 ? 'text-blue-700' : 'text-rose-600'}>
                {formatVND(unallocatedMoney)}
              </strong>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số tiền muốn {actionType === 'deposit' ? 'nạp thêm' : 'rút bớt'} (đồng) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="Ví dụ: 50.000"
                className="w-full px-4 py-2.5 text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₫
              </span>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.filter(a => a > 0).map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmountStr(new Intl.NumberFormat('vi-VN').format(q))}
                  className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  {formatVND(q)}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú nội bộ
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={actionType === 'deposit' ? 'Ví dụ: Tiền tiết kiệm từ việc nhịn trà sữa' : 'Ví dụ: Rút chi trả việc gấp'}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Warning banner if over unallocated money */}
          {isOverUnallocated && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Cảnh báo:</strong> Số tiền phân bổ ({formatVND(rawAmount)}) lớn hơn số tiền chưa phân bổ hiện có ({formatVND(unallocatedMoney)}). Thao tác này sẽ làm số dư tiền chưa phân bổ của bạn bị âm (thiếu hụt).
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 pt-1 border-t border-amber-200/50">
                <input
                  type="checkbox"
                  checked={warningConfirmed}
                  onChange={(e) => setWarningConfirmed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Tôi hiểu và đồng ý tiếp tục phân bổ</span>
              </label>
            </div>
          )}

          {/* Error banner if trying to withdraw more than goal has */}
          {isOverCurrentGoal && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>Số tiền muốn rút ({formatVND(rawAmount)}) vượt quá số tiền đang có trong mục tiêu ({formatVND(goal.currentAmount)}).</span>
            </div>
          )}

          {/* Note on internal allocation rule (Section 4.1 & 4.2) */}
          <p className="text-[11px] text-slate-400 italic">
            * Thao tác phân bổ này là giao dịch điều chuyển nội bộ giữa ví và quỹ mục tiêu, không làm thay đổi tổng số dư thực tế và không bị tính thành chi tiêu.
          </p>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isOverCurrentGoal || (isOverUnallocated && !warningConfirmed)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Xác nhận {actionType === 'deposit' ? 'nạp vào mục tiêu' : 'rút về ví'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
