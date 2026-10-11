/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MoneyTracker } from './components/MoneyTracker';
import { SmartGoal } from './components/SmartGoal';
import { BudgetPage } from './components/budget/BudgetPage';
import { AICoach } from './components/AICoach';
import { SmartMeal } from './components/SmartMeal';
import { HabitsPage } from './components/habits/HabitsPage';
import { Reports } from './components/Reports';
import { SettingsPage } from './components/settings/SettingsPage';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AllocateGoalModal } from './components/goals/AllocateGoalModal';

import {
  loadAppData,
  saveAppData,
  exportBackupJSON,
  validateAndImportBackupJSON,
  DEMO_DATA,
  EMPTY_DATA,
  StorageData,
} from './services/storage';
import { calculateFinancialMetrics } from './services/finance';
import {
  Transaction,
  SavingsGoal,
  BudgetCategoryConfig,
  EmergencyFund,
  MandatoryExpense,
  UserSettings,
  RecurringTransaction,
} from './types';
import { formatVND } from './utils/formatters';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [storageData, setStorageData] = useState<StorageData>(loadAppData);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [allocatingGoal, setAllocatingGoal] = useState<SavingsGoal | null>(null);
  const [coachQuestion, setCoachQuestion] = useState<string>('');

  // Persist storage whenever storageData updates
  useEffect(() => {
    saveAppData(storageData);
  }, [storageData]);

  // Unified financial metrics calculation (Section 4)
  const metrics = useMemo(() => {
    return calculateFinancialMetrics({
      transactions: storageData.transactions,
      goals: storageData.goals,
      emergencyFund: storageData.emergencyFund,
      mandatoryExpenses: storageData.mandatoryExpenses,
      recurringTransactions: storageData.recurringTransactions,
      settings: storageData.settings,
    });
  }, [storageData]);

  // 1. Transaction Handlers
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      // Edit existing transaction
      setStorageData((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === existingId ? { ...txData, id: existingId, createdAt: t.createdAt } : t
        ),
      }));
    } else {
      // Add new transaction
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
      };
      setStorageData((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setStorageData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  // 2. Goal Handlers
  const handleAddGoal = (goalData: Omit<SavingsGoal, 'id' | 'history' | 'createdAt'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      history:
        goalData.currentAmount > 0
          ? [
              {
                id: `alloc-init-${Date.now()}`,
                goalId: `goal-${Date.now()}`,
                type: 'deposit',
                amount: goalData.currentAmount,
                date: new Date().toISOString().split('T')[0],
                note: 'Số tiền dành riêng ban đầu',
                createdAt: Date.now(),
              },
            ]
          : [],
    };

    setStorageData((prev) => ({
      ...prev,
      goals: [newGoal, ...prev.goals],
    }));
  };

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mục tiêu này? Số tiền đã phân bổ sẽ quay về phần tiền chưa phân bổ.')) {
      setStorageData((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== goalId),
      }));
    }
  };

  const handleAllocateGoal = (
    goalId: string,
    amount: number,
    type: 'deposit' | 'withdraw',
    note?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];

    setStorageData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;

        const updatedCurrent =
          type === 'deposit' ? g.currentAmount + amount : Math.max(0, g.currentAmount - amount);

        return {
          ...g,
          currentAmount: updatedCurrent,
          status: updatedCurrent >= g.targetAmount && g.targetAmount > 0 ? 'completed' : 'active',
          history: [
            {
              id: `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              goalId: g.id,
              type,
              amount,
              date: today,
              note: note || (type === 'deposit' ? 'Nạp tiền vào quỹ mục tiêu' : 'Rút tiền về ví'),
              createdAt: Date.now(),
            },
            ...(g.history || []),
          ],
        };
      }),
    }));
  };

  // 3. Budget & Mandatory Expense Handlers
  const handleUpdateBudgetConfigs = (configs: BudgetCategoryConfig[]) => {
    setStorageData((prev) => ({ ...prev, budgetConfigs: configs }));
  };

  const handleUpdateEmergencyFund = (fund: EmergencyFund) => {
    setStorageData((prev) => ({ ...prev, emergencyFund: fund }));
  };

  const handleAddMandatoryExpense = (
    expenseData: Omit<MandatoryExpense, 'id' | 'createdAt'>
  ) => {
    const newMandatory: MandatoryExpense = {
      ...expenseData,
      id: `mand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    setStorageData((prev) => ({
      ...prev,
      mandatoryExpenses: [newMandatory, ...prev.mandatoryExpenses],
    }));
  };

  const handleToggleMandatoryPaid = (id: string) => {
    const target = storageData.mandatoryExpenses.find((m) => m.id === id);
    if (!target) return;

    if (!target.isPaid) {
      // Đánh dấu đã trả -> Tự động ghi 1 giao dịch thực tế để trừ số dư ví, chống tính trùng 2 lần!
      const today = new Date().toISOString().split('T')[0];
      const txId = `tx-mand-${Date.now()}`;
      const newTx: Transaction = {
        id: txId,
        title: `[Chi cố định] ${target.title}`,
        amount: target.amount,
        type: 'expense',
        category: target.category,
        date: target.dueDate || today,
        note: `Đã thanh toán khoản chi cố định / bắt buộc`,
        paymentMethod: 'bank',
        createdAt: Date.now(),
      };

      setStorageData((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
        mandatoryExpenses: prev.mandatoryExpenses.map((m) =>
          m.id === id ? { ...m, isPaid: true, linkedTransactionId: txId } : m
        ),
      }));
    } else {
      // Hoàn tác chưa trả -> Xóa giao dịch liên kết đã tạo
      const linkedId = target.linkedTransactionId;
      setStorageData((prev) => ({
        ...prev,
        transactions: linkedId ? prev.transactions.filter((t) => t.id !== linkedId) : prev.transactions,
        mandatoryExpenses: prev.mandatoryExpenses.map((m) =>
          m.id === id ? { ...m, isPaid: false, linkedTransactionId: undefined } : m
        ),
      }));
    }
  };

  const handleDeleteMandatoryExpense = (id: string) => {
    setStorageData((prev) => ({
      ...prev,
      mandatoryExpenses: prev.mandatoryExpenses.filter((m) => m.id !== id),
    }));
  };

  // 3b. Recurring Transactions Handlers
  const handleAddRecurring = (recData: Omit<RecurringTransaction, 'id' | 'createdAt'>) => {
    const newRec: RecurringTransaction = {
      ...recData,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    setStorageData((prev) => ({
      ...prev,
      recurringTransactions: [newRec, ...(prev.recurringTransactions || [])],
    }));
  };

  const handlePayRecurring = (id: string) => {
    const rec = storageData.recurringTransactions?.find((r) => r.id === id);
    if (!rec) return;

    const today = new Date().toISOString().split('T')[0];
    const txId = `tx-rec-${Date.now()}`;
    const newTx: Transaction = {
      id: txId,
      title: `[Định kỳ] ${rec.title}`,
      amount: rec.amount,
      type: rec.type,
      category: rec.category,
      date: today,
      note: `Giao dịch định kỳ đã thanh toán chu kỳ này`,
      paymentMethod: 'bank',
      createdAt: Date.now(),
    };

    setStorageData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      recurringTransactions: (prev.recurringTransactions || []).map((r) =>
        r.id === id ? { ...r, isPaidThisCycle: true, linkedTransactionId: txId } : r
      ),
    }));
  };

  const handleDeleteRecurring = (id: string) => {
    setStorageData((prev) => ({
      ...prev,
      recurringTransactions: (prev.recurringTransactions || []).filter((r) => r.id !== id),
    }));
  };

  // 4. Settings & Backup Handlers
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setStorageData((prev) => ({ ...prev, settings: newSettings }));
  };

  const handleExportJSON = () => {
    const jsonStr = exportBackupJSON(storageData);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `savewise_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['Ngày', 'Tên giao dịch', 'Loại', 'Danh mục', 'Số tiền (VNĐ)', 'Phương thức', 'Ghi chú'];
    const rows = storageData.transactions.map((t) => [
      t.date,
      `"${t.title.replace(/"/g, '""')}"`,
      t.type === 'expense' ? 'Chi tiêu' : 'Thu nhập',
      t.category,
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
    link.setAttribute('download', `savewise_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (jsonStr: string) => {
    const result = validateAndImportBackupJSON(jsonStr);
    if (result.success && result.data) {
      setStorageData(result.data);
      alert('Đã khôi phục dữ liệu từ tệp sao lưu thành công!');
    } else {
      alert('Lỗi: ' + (result.error || 'Tệp sao lưu không hợp lệ.'));
    }
  };

  const handleLoadDemoData = () => {
    setStorageData(DEMO_DATA);
    alert('Đã nạp dữ liệu mẫu sinh viên thực tế.');
  };

  const handleResetToEmpty = () => {
    setStorageData(EMPTY_DATA);
  };

  const handleConsultAIGoal = (goal: SavingsGoal) => {
    setCoachQuestion(
      `Hãy giúp tôi lập kế hoạch tiết kiệm cụ thể cho mục tiêu "${goal.title}". Mục tiêu cần đạt ${formatVND(
        goal.targetAmount
      )}, hiện đã dành riêng được ${formatVND(goal.currentAmount)}.`
    );
    setActiveTab('coach');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        realBalance={metrics.realBalance}
        spendableMoney={metrics.spendableMoney}
        isDeficit={metrics.isDeficit}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Local Storage Safety & Backup Reminder Banner */}
        {!storageData.settings.storageBannerDismissed && (
          <div className="bg-slate-900 text-white px-4 py-2.5 sm:px-6 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                <strong>Lưu trữ an toàn trên thiết bị:</strong> Dữ liệu sổ tài chính đang được lưu trong trình duyệt của bạn (LocalStorage).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
              >
                Tải file sao lưu JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  setStorageData((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, storageBannerDismissed: true },
                  }));
                }}
                className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                title="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && (
            <Dashboard
              metrics={metrics}
              goals={storageData.goals}
              transactions={storageData.transactions}
              budgetConfigs={storageData.budgetConfigs}
              settings={storageData.settings}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              onOpenAllocateModal={(goal) => setAllocatingGoal(goal)}
            />
          )}

          {activeTab === 'transactions' && (
            <MoneyTracker
              transactions={storageData.transactions}
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'goals' && (
            <SmartGoal
              goals={storageData.goals}
              metrics={metrics}
              onAddGoal={handleAddGoal}
              onOpenAllocateModal={(goal) => setAllocatingGoal(goal)}
              onDeleteGoal={handleDeleteGoal}
              onConsultAI={handleConsultAIGoal}
            />
          )}

          {activeTab === 'budget' && (
            <BudgetPage
              metrics={metrics}
              budgetConfigs={storageData.budgetConfigs}
              emergencyFund={storageData.emergencyFund}
              mandatoryExpenses={storageData.mandatoryExpenses}
              recurringTransactions={storageData.recurringTransactions || []}
              transactions={storageData.transactions}
              settings={storageData.settings}
              onUpdateBudgetConfigs={handleUpdateBudgetConfigs}
              onUpdateEmergencyFund={handleUpdateEmergencyFund}
              onAddMandatoryExpense={handleAddMandatoryExpense}
              onToggleMandatoryPaid={handleToggleMandatoryPaid}
              onDeleteMandatoryExpense={handleDeleteMandatoryExpense}
              onAddRecurring={handleAddRecurring}
              onPayRecurring={handlePayRecurring}
              onDeleteRecurring={handleDeleteRecurring}
            />
          )}

          {activeTab === 'coach' && (
            <AICoach
              metrics={metrics}
              goals={storageData.goals}
              transactions={storageData.transactions}
              initialQuestion={coachQuestion}
            />
          )}

          {activeTab === 'meal' && (
            <SmartMeal
              metrics={metrics}
              settings={storageData.settings}
              onAddTransaction={(tx) => handleSaveTransaction(tx)}
            />
          )}

          {activeTab === 'habits' && (
            <HabitsPage
              metrics={metrics}
              goals={storageData.goals}
              transactions={storageData.transactions}
            />
          )}

          {activeTab === 'reports' && (
            <Reports
              metrics={metrics}
              goals={storageData.goals}
              transactions={storageData.transactions}
              budgetConfigs={storageData.budgetConfigs}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              settings={storageData.settings}
              storageData={storageData}
              onUpdateSettings={handleUpdateSettings}
              onImportBackup={handleImportBackup}
              onExportBackup={handleExportJSON}
              onExportCSV={handleExportCSV}
              onLoadDemoData={handleLoadDemoData}
              onResetToEmpty={handleResetToEmpty}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <strong className="text-slate-700">SAVEWISE AI</strong> · Chi tiêu thông minh – Tiết kiệm có mục tiêu – Sống hợp lý
            </div>
            <div className="text-[11px] text-slate-400">
              Công thức tài chính chuẩn hóa · Dữ liệu bảo mật trong trình duyệt
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
      />

      <AllocateGoalModal
        isOpen={!!allocatingGoal}
        onClose={() => setAllocatingGoal(null)}
        goal={allocatingGoal}
        unallocatedMoney={metrics.unallocatedMoney}
        onAllocate={handleAllocateGoal}
      />
    </div>
  );
}
