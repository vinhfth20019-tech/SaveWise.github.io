import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import {
  Transaction,
  TransactionCategory,
  TransactionType,
  PaymentMethod,
  IncomeCategory,
  ExpenseCategory,
} from '../types';
import { CATEGORY_DEFINITIONS } from '../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  initialData?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');

  // Load existing data if editing
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmountStr(new Intl.NumberFormat('vi-VN').format(initialData.amount));
      setTitle(initialData.title);
      setCategory(initialData.category);
      setDate(initialData.date);
      setPaymentMethod(initialData.paymentMethod || 'cash');
      setNote(initialData.note || '');
    } else {
      setType('expense');
      setAmountStr('');
      setTitle('');
      setCategory('food');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('cash');
      setNote('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const quickAmounts = type === 'expense'
    ? [20000, 35000, 50000, 100000, 200000]
    : [200000, 500000, 1000000, 2000000, 3000000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(amountStr.replace(/\D/g, ''), 10) || 0;
    if (amount <= 0 || !title.trim()) {
      alert('Vui lòng nhập tên giao dịch và số tiền lớn hơn 0!');
      return;
    }

    onSave(
      {
        title: title.trim(),
        amount,
        type,
        category,
        date,
        paymentMethod,
        note: note.trim() || undefined,
      },
      initialData?.id
    );

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

  // Filter categories by type
  const availableCategories = Object.entries(CATEGORY_DEFINITIONS).filter(
    ([_, meta]) => meta.type === type
  ) as [TransactionCategory, typeof CATEGORY_DEFINITIONS[TransactionCategory]][];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm">
            {initialData ? 'Chỉnh sửa giao dịch' : 'Ghi chép giao dịch mới'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('food');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tiền chi ra (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('salary');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tiền thu vào (+)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số tiền (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="Ví dụ: 35.000"
                className="w-full px-4 py-2.5 text-lg font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                ₫
              </span>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmountStr(new Intl.NumberFormat('vi-VN').format(q))}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  +{new Intl.NumberFormat('vi-VN').format(q)}đ
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên giao dịch <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'expense' ? 'Ví dụ: Cơm trưa sườn trứng, Xăng xe...' : 'Ví dụ: Tiền làm thêm, Phụ cấp bố mẹ...'}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Danh mục phân loại
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {availableCategories.map(([catKey, meta]) => (
                <button
                  type="button"
                  key={catKey}
                  onClick={() => setCategory(catKey)}
                  className={`px-2.5 py-2 rounded-lg text-left text-xs font-medium border transition-all ${
                    category === catKey
                      ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate">{meta.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date, Payment Method & Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày thực hiện</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phương thức thanh toán</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Tiền mặt</option>
                <option value="e-wallet">Ví điện tử (Momo/ZaloPay)</option>
                <option value="bank">Tài khoản ngân hàng</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú thêm</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm tùy chọn..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{initialData ? 'Cập nhật giao dịch' : 'Lưu giao dịch vào sổ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
