import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Wallet,
  Sparkles,
} from 'lucide-react';
import {
  FinancialHealthMetrics,
  SavingsGoal,
  Transaction,
  BudgetCategoryConfig,
} from '../types';
import { formatVND, formatDateVN, getCategoryLabel, getCategoryMeta } from '../utils/formatters';

interface ReportsProps {
  metrics: FinancialHealthMetrics;
  goals: SavingsGoal[];
  transactions: Transaction[];
  budgetConfigs: BudgetCategoryConfig[];
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const Reports: React.FC<ReportsProps> = ({
  metrics,
  goals,
  transactions,
  budgetConfigs,
  onExportCSV,
  onExportJSON,
}) => {
  const [period, setPeriod] = useState<'all' | 'this_month' | 'last_30_days'>('last_30_days');

  const now = Date.now();
  const timeLimit = period === 'last_30_days' ? now - 30 * 86400000 : 0;

  const filteredTransactions = transactions.filter((t) => (period === 'all' ? true : t.createdAt >= timeLimit));

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  filteredTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner (hidden during print) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>BÁO CÁO TÀI CHÍNH & XUẤT DỮ LIỆU</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Tổng kết dòng tiền toàn diện
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Báo cáo đối chiếu số dư thực tế, thống kê danh mục chi tiêu và tiến độ các mục tiêu tích lũy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>In / Xuất PDF</span>
          </button>

          <button
            onClick={onExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={onExportJSON}
            className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Sao lưu JSON</span>
          </button>
        </div>
      </div>

      {/* Period Filter (print hidden) */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs font-semibold print:hidden">
        <span className="text-slate-500">Khoảng thời gian:</span>
        <button
          onClick={() => setPeriod('last_30_days')}
          className={`px-3 py-1 rounded-lg transition-all ${
            period === 'last_30_days' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          30 ngày gần nhất
        </button>
        <button
          onClick={() => setPeriod('all')}
          className={`px-3 py-1 rounded-lg transition-all ${
            period === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Toàn bộ lịch sử
        </button>
      </div>

      {/* PRINT-READY REPORT CONTAINER */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                BÁO CÁO TÀI CHÍNH CÁ NHÂN – SAVEWISE AI
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Kỳ thống kê: {period === 'all' ? 'Toàn bộ thời gian' : '30 ngày gần nhất'} · Ngày xuất: {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 font-mono">
              SAVEWISE-REPORT
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">TỔNG THU NHẬP</span>
            <div className="text-lg font-extrabold text-emerald-600">+{formatVND(totalIncome)}</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">TỔNG CHI TIÊU</span>
            <div className="text-lg font-extrabold text-rose-600">-{formatVND(totalExpense)}</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">CHÊNH LỆCH RÒNG</span>
            <div className={`text-lg font-extrabold ${netSavings >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {netSavings >= 0 ? `+${formatVND(netSavings)}` : `-${formatVND(Math.abs(netSavings))}`}
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200">
            <span className="text-[11px] font-bold text-blue-700 block mb-1">SỐ DƯ THỰC TẾ HIỆN CÓ</span>
            <div className="text-lg font-extrabold text-blue-900">{formatVND(metrics.realBalance)}</div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900">Chi tiết phân loại chi tiêu theo danh mục</h3>
          {sortedCategories.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Danh mục</th>
                    <th className="py-2.5 px-3 text-right">Số tiền đã chi</th>
                    <th className="py-2.5 px-3 text-right">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedCategories.map(([catKey, amount]) => {
                    const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                    return (
                      <tr key={catKey} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{getCategoryLabel(catKey)}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">{formatVND(amount)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{percent}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Chưa có chi tiêu trong kỳ.</p>
          )}
        </div>

        {/* Goals Progress Table */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900">Tiến độ các mục tiêu tiết kiệm ({goals.length})</h3>
          {goals.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Tên mục tiêu</th>
                    <th className="py-2.5 px-3">Danh mục</th>
                    <th className="py-2.5 px-3 text-right">Đã tích lũy</th>
                    <th className="py-2.5 px-3 text-right">Mục tiêu</th>
                    <th className="py-2.5 px-3 text-right">Tiến độ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {goals.map((g) => {
                    const percent = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                    return (
                      <tr key={g.id}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{g.title}</td>
                        <td className="py-2.5 px-3 text-slate-500">{g.category}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{formatVND(g.currentAmount)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{formatVND(g.targetAmount)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-700">{percent}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Chưa có mục tiêu nào.</p>
          )}
        </div>

        {/* Footer Notes */}
        <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 flex justify-between">
          <span>SAVEWISE AI · Nền tảng quản lý tài chính cá nhân thông minh</span>
          <span>Bản in bảo mật nội bộ</span>
        </div>
      </div>
    </div>
  );
};
