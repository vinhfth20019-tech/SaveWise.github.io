import React, { useState } from 'react';
import {
  ArrowUpDown,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Download,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
  Check,
  X,
  CreditCard,
} from 'lucide-react';
import {
  Transaction,
  TransactionCategory,
  TransactionType,
  PaymentMethod,
  IncomeCategory,
  ExpenseCategory,
} from '../types';
import { formatVND, formatDateVN, getCategoryLabel, getCategoryMeta, CATEGORY_DEFINITIONS } from '../utils/formatters';

interface MoneyTrackerProps {
  transactions: Transaction[];
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const MoneyTracker: React.FC<MoneyTrackerProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state for inline/modal quick edit
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];
  const oneWeekAgo = now - 7 * 86400000;
  const oneMonthAgo = now - 30 * 86400000;

  // Filter transactions
  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNote = t.note?.toLowerCase().includes(q);
      if (!matchTitle && !matchNote) return false;
    }
    if (filterPeriod === 'today') return t.date === todayStr;
    if (filterPeriod === 'week') return t.createdAt >= oneWeekAgo;
    if (filterPeriod === 'month') return t.createdAt >= oneMonthAgo;
    return true;
  });

  // Sort transactions
  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === 'newest') return b.createdAt - a.createdAt;
    return a.createdAt - b.createdAt;
  });

  // Calculate totals of filtered set
  const totalExpense = sorted
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = sorted
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Ngày', 'Tên giao dịch', 'Loại', 'Danh mục', 'Số tiền (VNĐ)', 'Phương thức', 'Ghi chú'];
    const rows = sorted.map((t) => [
      t.date,
      `"${t.title.replace(/"/g, '""')}"`,
      t.type === 'expense' ? 'Chi tiêu' : 'Thu nhập',
      `"${getCategoryLabel(t.category)}"`,
      t.amount,
      t.paymentMethod || 'Tiền mặt',
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `savewise_thu_chi_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa giao dịch "${title}"? Tất cả số dư và biểu đồ sẽ được tự động cập nhật lại.`)) {
      onDeleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <ArrowUpDown className="w-4 h-4 text-blue-600" />
            <span>QUẢN LÝ THU NHẬP VÀ CHI TIÊU</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Sổ ghi chép thu chi chi tiết
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận chính xác dòng tiền ra vào, tự động phân loại danh mục và đồng bộ với số dư thực tế.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm giao dịch</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Tổng chi tiêu theo bộ lọc</span>
          <div className="text-2xl font-extrabold text-rose-600">-{formatVND(totalExpense)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {sorted.filter((t) => t.type === 'expense').length} khoản chi đã ghi
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Tổng thu nhập theo bộ lọc</span>
          <div className="text-2xl font-extrabold text-emerald-600">+{formatVND(totalIncome)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {sorted.filter((t) => t.type === 'income').length} khoản thu đã ghi
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Chênh lệch thu - chi</span>
          <div className={`text-2xl font-extrabold ${netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {netBalance >= 0 ? `+${formatVND(netBalance)}` : `-${formatVND(Math.abs(netBalance))}`}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {netBalance >= 0 ? 'Dòng tiền thặng dư' : 'Cảnh báo: Chi tiêu đang vượt thu'}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên giao dịch, ghi chú..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Period buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterPeriod === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterPeriod === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterPeriod === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterPeriod === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 ngày qua
            </button>
          </div>
        </div>

        {/* Filters: Type, Category, Sort */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg border font-medium ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2.5 py-1 rounded-lg border font-medium ${
                filterType === 'expense'
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Khoản chi (-)
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-2.5 py-1 rounded-lg border font-medium ${
                filterType === 'income'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Khoản thu (+)
            </button>
          </div>

          <span className="text-slate-300">|</span>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">Tất cả danh mục</option>
            {Object.entries(CATEGORY_DEFINITIONS).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label} ({meta.type === 'income' ? 'Thu' : 'Chi'})
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 ml-auto"
          >
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
          </select>
        </div>
      </div>

      {/* Transactions List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {sorted.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {sorted.map((t) => {
              const meta = getCategoryMeta(t.category);
              const isIncome = t.type === 'income';

              return (
                <div
                  key={t.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border shrink-0 ${meta.badgeBg} ${meta.badgeText}`}
                    >
                      {meta.label.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{t.title}</div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="font-semibold text-slate-700">{meta.label}</span>
                        <span>·</span>
                        <span>{formatDateVN(t.date)}</span>
                        {t.paymentMethod && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400">
                              {t.paymentMethod === 'cash'
                                ? 'Tiền mặt'
                                : t.paymentMethod === 'e-wallet'
                                ? 'Ví điện tử'
                                : t.paymentMethod === 'bank'
                                ? 'Chuyển khoản'
                                : 'Khác'}
                            </span>
                          </>
                        )}
                        {t.note && (
                          <>
                            <span>·</span>
                            <span className="italic text-slate-400 max-w-[200px] truncate">{t.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`text-sm font-extrabold ${
                          isIncome ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isIncome ? `+${formatVND(t.amount)}` : `-${formatVND(t.amount)}`}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isIncome ? 'Thu nhập' : 'Chi tiêu'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditTransaction(t)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa giao dịch"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(t.id, t.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa giao dịch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-semibold text-slate-600">Không tìm thấy giao dịch nào</div>
            <p className="text-xs mt-1">Hãy thử thay đổi điều kiện lọc hoặc thêm giao dịch mới!</p>
          </div>
        )}
      </div>
    </div>
  );
};
