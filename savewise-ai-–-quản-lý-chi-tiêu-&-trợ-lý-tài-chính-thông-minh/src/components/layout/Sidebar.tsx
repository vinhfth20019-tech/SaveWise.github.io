import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowUpDown,
  Target,
  Wallet,
  Bot,
  UtensilsCrossed,
  TrendingUp,
  BarChart3,
  Settings,
  Plus,
  Menu,
  X,
  ShieldAlert,
  Coins,
} from 'lucide-react';
import { formatVND } from '../../utils/formatters';

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'goals'
  | 'budget'
  | 'coach'
  | 'meal'
  | 'habits'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  realBalance: number;
  spendableMoney: number;
  isDeficit: boolean;
  onOpenAddModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  realBalance,
  spendableMoney,
  isDeficit,
  onOpenAddModal,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'transactions' as NavTab, label: 'Thu nhập & Chi tiêu', icon: ArrowUpDown },
    { id: 'goals' as NavTab, label: 'Mục tiêu tiết kiệm', icon: Target },
    { id: 'budget' as NavTab, label: 'Ngân sách hằng ngày', icon: Wallet },
    { id: 'coach' as NavTab, label: 'AI Money Coach', icon: Bot, isAi: true },
    { id: 'meal' as NavTab, label: 'Thực đơn tiết kiệm', icon: UtensilsCrossed },
    { id: 'habits' as NavTab, label: 'Thói quen chi tiêu', icon: TrendingUp },
    { id: 'reports' as NavTab, label: 'Báo cáo tài chính', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Cài đặt & Dữ liệu', icon: Settings },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Mở menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSelectTab('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-xs">
              S
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">SAVEWISE AI</span>
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Ghi chép</span>
        </button>
      </div>

      {/* MOBILE BACKDROP DRAWER */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION (Desktop persistent & Mobile drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleSelectTab('dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
                S
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 text-base tracking-tight">SAVEWISE</span>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Chi tiêu thông minh</p>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Real Balance Box */}
          <div className="px-4 py-3 mx-4 mt-4 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
              <span>Số dư thực tế:</span>
              <Coins className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-base font-extrabold text-slate-900">{formatVND(realBalance)}</div>

            {isDeficit ? (
              <div className="mt-2 text-[10px] text-rose-600 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Cảnh báo thiếu hụt phân bổ</span>
              </div>
            ) : (
              <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                <span>Khả dụng:</span>
                <span className="font-bold text-blue-700">{formatVND(spendableMoney)}</span>
              </div>
            )}
          </div>

          {/* Primary Quick Record Button */}
          <div className="px-4 mt-3">
            <button
              onClick={() => {
                onOpenAddModal();
                setMobileOpen(false);
              }}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Ghi chép thu chi</span>
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="p-3 space-y-1 mt-3 overflow-y-auto max-h-[calc(100vh-280px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.isAi && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
          <div>SAVEWISE AI v2.0</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tiết kiệm có mục tiêu · Sống hợp lý</div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => handleSelectTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold cursor-pointer ${
            activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Tổng quan</span>
        </button>

        <button
          onClick={() => handleSelectTab('transactions')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold cursor-pointer ${
            activeTab === 'transactions' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <ArrowUpDown className="w-5 h-5 mb-0.5" />
          <span>Thu chi</span>
        </button>

        <button
          onClick={() => handleSelectTab('goals')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold cursor-pointer ${
            activeTab === 'goals' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <Target className="w-5 h-5 mb-0.5" />
          <span>Mục tiêu</span>
        </button>

        <button
          onClick={() => handleSelectTab('coach')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold cursor-pointer ${
            activeTab === 'coach' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Bot className="w-5 h-5 mb-0.5" />
          <span>AI Coach</span>
        </button>

        <button
          onClick={() => handleSelectTab('budget')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold cursor-pointer ${
            activeTab === 'budget' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span>Ngân sách</span>
        </button>
      </nav>
    </>
  );
};
