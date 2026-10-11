import React, { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { UserSettings } from '../../types';
import { StorageData } from '../../services/storage';
import { formatVND } from '../../utils/formatters';

interface SettingsPageProps {
  settings: UserSettings;
  storageData: StorageData;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onImportBackup: (jsonStr: string) => void;
  onExportBackup: () => void;
  onExportCSV: () => void;
  onLoadDemoData: () => void;
  onResetToEmpty: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  storageData,
  onUpdateSettings,
  onImportBackup,
  onExportBackup,
  onExportCSV,
  onLoadDemoData,
  onResetToEmpty,
}) => {
  const [initialBalance, setInitialBalance] = useState(settings.initialBalance);
  const [daysInPeriod, setDaysInPeriod] = useState(settings.daysInPeriod);
  const [threshold70, setThreshold70] = useState(settings.warningThreshold70);
  const [threshold85, setThreshold85] = useState(settings.warningThreshold85);
  const [threshold100, setThreshold100] = useState(settings.warningThreshold100);
  const [dietaryPreferences, setDietaryPreferences] = useState(settings.dietaryPreferences);
  const [dietaryAllergies, setDietaryAllergies] = useState(settings.dietaryAllergies);
  const [cookingFacilities, setCookingFacilities] = useState(settings.cookingFacilities);
  const [userName, setUserName] = useState(settings.userName);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      userName: userName.trim() || 'Bạn',
      initialBalance: Math.max(0, initialBalance),
      daysInPeriod: Math.max(1, daysInPeriod),
      warningThreshold70: Math.max(1, threshold70),
      warningThreshold85: Math.max(1, threshold85),
      warningThreshold100: Math.max(1, threshold100),
      dietaryPreferences: dietaryPreferences.trim(),
      dietaryAllergies: dietaryAllergies.trim(),
      cookingFacilities,
      hasCustomData: true,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (window.confirm('CẢNH BÁO: Nhập tệp sao lưu sẽ ghi đè dữ liệu hiện tại của bạn. Bạn có muốn tiếp tục?')) {
          onImportBackup(content);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleConfirmReset = () => {
    if (deleteConfirmText.trim().toUpperCase() === 'XÓA HẾT') {
      onResetToEmpty();
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      alert('Đã xóa toàn bộ dữ liệu trên thiết bị. Bạn có thể bắt đầu với sổ tài chính hoàn toàn mới!');
    } else {
      alert('Vui lòng nhập chính xác chữ "XÓA HẾT" để xác nhận thao tác nguy hiểm này.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <Settings className="w-4 h-4 text-blue-600" />
            <span>CÀI ĐẶT & BẢO MẬT DỮ LIỆU</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Thiết lập hệ thống & Quản lý dữ liệu cá nhân
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dữ liệu được lưu trữ an toàn trong trình duyệt của bạn (LocalStorage) và không bị tải lên máy chủ ngoài ý muốn.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu thành công!</span>
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card 1: Số dư ban đầu & Kỳ ngân sách */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            1. Cấu hình số dư ban đầu & Chu kỳ quản lý
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên hiển thị của bạn
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ví dụ: Minh, Hoa..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số dư ban đầu khi bắt đầu dùng ứng dụng (đồng)
              </label>
              <input
                type="number"
                step="50000"
                min="0"
                required
                value={initialBalance}
                onChange={(e) => setInitialBalance(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Công thức: Số dư thực tế = Số dư ban đầu + Tổng thu nhập - Tổng chi tiêu.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số ngày trong một chu kỳ kế hoạch ngân sách
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="7"
                max="60"
                value={daysInPeriod}
                onChange={(e) => setDaysInPeriod(parseInt(e.target.value, 10))}
                className="flex-1 accent-blue-600 cursor-pointer"
              />
              <span className="w-20 text-center font-bold text-xs bg-slate-100 py-1.5 px-2 rounded-lg text-slate-800">
                {daysInPeriod} ngày
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <button type="button" onClick={() => setDaysInPeriod(7)} className="hover:text-blue-700">1 tuần</button>
              <button type="button" onClick={() => setDaysInPeriod(15)} className="hover:text-blue-700">15 ngày</button>
              <button type="button" onClick={() => setDaysInPeriod(30)} className="hover:text-blue-700">1 tháng (30 ngày)</button>
            </div>
          </div>
        </div>

        {/* Card 2: Ngưỡng cảnh báo chi tiêu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            2. Ngưỡng cảnh báo ngân sách
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
              <label className="block text-xs font-bold text-amber-800 mb-1">
                Cảnh báo nhẹ (%)
              </label>
              <input
                type="number"
                min="50"
                max="80"
                value={threshold70}
                onChange={(e) => setThreshold70(parseInt(e.target.value, 10) || 70)}
                className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-[10px] text-amber-700 block mt-1">Mặc định: 70% ngân sách</span>
            </div>

            <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-200">
              <label className="block text-xs font-bold text-orange-800 mb-1">
                Cảnh báo rõ (%)
              </label>
              <input
                type="number"
                min="75"
                max="95"
                value={threshold85}
                onChange={(e) => setThreshold85(parseInt(e.target.value, 10) || 85)}
                className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-orange-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <span className="text-[10px] text-orange-700 block mt-1">Mặc định: 85% ngân sách</span>
            </div>

            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200">
              <label className="block text-xs font-bold text-rose-800 mb-1">
                Vượt ngân sách (%)
              </label>
              <input
                type="number"
                min="95"
                max="120"
                value={threshold100}
                onChange={(e) => setThreshold100(parseInt(e.target.value, 10) || 100)}
                className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <span className="text-[10px] text-rose-700 block mt-1">Mặc định: 100% ngân sách</span>
            </div>
          </div>
        </div>

        {/* Card 3: Sở thích ẩm thực cho Smart Meal */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            3. Hồ sơ ăn uống & Smart Meal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sở thích ăn uống
              </label>
              <input
                type="text"
                value={dietaryPreferences}
                onChange={(e) => setDietaryPreferences(e.target.value)}
                placeholder="Ví dụ: Thích rau xanh, không ăn cay..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dị ứng hoặc kiêng cữ
              </label>
              <input
                type="text"
                value={dietaryAllergies}
                onChange={(e) => setDietaryAllergies(e.target.value)}
                placeholder="Ví dụ: Dị ứng hải sản, kiêng sữa bò..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={cookingFacilities}
              onChange={(e) => setCookingFacilities(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Nơi ở có bếp nấu (nồi cơm, chảo, bếp từ/ga) để tự nấu ăn</span>
          </label>
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu tất cả thiết lập</span>
          </button>
        </div>
      </form>

      {/* Card 4: Quản lý sao lưu & Dữ liệu (Backup, Restore, CSV, Demo Data) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sao lưu, phục hồi & Dữ liệu mẫu</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Export JSON */}
          <button
            type="button"
            onClick={onExportBackup}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer"
          >
            <Download className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-slate-900">Sao lưu JSON</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tải tệp sao lưu toàn bộ dữ liệu máy về máy</p>
          </button>

          {/* Import JSON */}
          <label className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer block">
            <Upload className="w-5 h-5 text-indigo-600 mb-2" />
            <div className="text-xs font-bold text-slate-900">Khôi phục JSON</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tải lên tệp JSON đã sao lưu trước đó</p>
            <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </label>

          {/* Export CSV */}
          <button
            type="button"
            onClick={onExportCSV}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-slate-900">Xuất sổ thu chi (CSV)</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Mở được bằng Excel hoặc Google Sheets</p>
          </button>

          {/* Load Demo Data */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Nạp dữ liệu mẫu sinh viên để tham khảo tính năng?')) {
                onLoadDemoData();
              }
            }}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-slate-900">Dữ liệu mẫu demo</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Nạp lại mẫu sinh viên thực tế để trải nghiệm</p>
          </button>
        </div>

        {/* Danger Zone: Xóa toàn bộ dữ liệu */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Vùng nguy hiểm: Xóa toàn bộ dữ liệu</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Xóa sạch các giao dịch, mục tiêu, ngân sách và thiết lập để bắt đầu với một tài khoản hoàn toàn mới.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Xóa sạch dữ liệu</span>
          </button>
        </div>
      </div>

      {/* MODAL XÁC NHẬN XÓA NGUY HIỂM */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-base text-slate-900">Xác nhận xóa sạch dữ liệu</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Hành động này <strong>không thể hoàn tác</strong>. Mọi giao dịch, mục tiêu tiết kiệm, ngân sách và ghi chép của bạn trên thiết bị này sẽ bị xóa hoàn toàn.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Để xác nhận, vui lòng gõ chính xác chữ <span className="text-rose-600">XÓA HẾT</span>:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Gõ XÓA HẾT"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'XÓA HẾT'}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-xl transition-all cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
