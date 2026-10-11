import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Flame,
  ChefHat,
  RotateCcw,
  Users,
  Check,
  Edit2,
} from 'lucide-react';
import {
  DayMealPlan,
  FinancialHealthMetrics,
  MealPlanResponse,
  ShoppingItem,
  Transaction,
  UserSettings,
} from '../types';
import { formatVND } from '../utils/formatters';

interface SmartMealProps {
  metrics: FinancialHealthMetrics;
  settings: UserSettings;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const SmartMeal: React.FC<SmartMealProps> = ({
  metrics,
  settings,
  onAddTransaction,
}) => {
  const [budgetInput, setBudgetInput] = useState(
    metrics.dailyReferenceBudget > 0 ? Math.min(metrics.dailyReferenceBudget, 60000) : 45000
  );
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [days, setDays] = useState(3);
  const [availableIngredients, setAvailableIngredients] = useState('Trứng, cơm nguội, nước mắm, hành tỏi');
  const [dietaryRestrictions, setDietaryRestrictions] = useState(settings.dietaryAllergies || 'Không ăn cay, thích ăn rau');
  const [hasCookingFacilities, setHasCookingFacilities] = useState(settings.cookingFacilities);
  const [cookingTime, setCookingTime] = useState('Dưới 30 phút');

  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [addedMealKeys, setAddedMealKeys] = useState<Set<string>>(new Set());

  // Generate meal plan
  const handleGenerateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyBudget: budgetInput,
          numberOfPeople,
          days,
          mealsPerDay: ['breakfast', 'lunch', 'dinner'],
          availableIngredients,
          dietaryRestrictions,
          hasCookingFacilities,
          cookingTime,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate meal plan');
      const data: MealPlanResponse = await res.json();
      setMealPlan(data);

      // Initialize shopping checklist
      const anyData = data as any;
      if (Array.isArray(data.shoppingList)) {
        setShoppingList(data.shoppingList);
      } else if (Array.isArray(anyData.groceryList)) {
        // Fallback mapping
        setShoppingList(
          anyData.groceryList.map((g: any, i: number) => ({
            id: `shop-${i}`,
            name: g.item || g.name,
            neededQuantity: '1 phần',
            alreadyHave: false,
            estimatedPrice: g.estimatedPrice || 20000,
            isPurchased: false,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      alert('Không thể tạo thực đơn lúc này. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePurchased = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPurchased: !item.isPurchased } : item))
    );
  };

  const handleEditPrice = (id: string, newPriceStr: string) => {
    const raw = parseInt(newPriceStr.replace(/\D/g, ''), 10) || 0;
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, estimatedPrice: raw } : item))
    );
  };

  const handleAddMealToTracker = (meal: any, dayIndex: number, mealIndex: number) => {
    const key = `${dayIndex}-${mealIndex}`;
    const cost = meal.cost || meal.ingredients?.reduce((sum: number, ing: any) => sum + (ing.portionCostEstimate || 10000), 0) || 15000;

    onAddTransaction({
      title: `${meal.type}: ${meal.dish}`,
      amount: cost,
      type: 'expense',
      category: 'food',
      date: new Date().toISOString().split('T')[0],
      note: `Thực đơn Smart Meal (${meal.recipeShort || 'Tự nấu'})`,
      paymentMethod: 'cash',
    });

    setAddedMealKeys((prev) => new Set(prev).add(key));
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <UtensilsCrossed className="w-4 h-4 text-blue-600" />
            <span>SMART MEAL · THỰC ĐƠN TIẾT KIỆM THEO NGÂN SÁCH</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Ăn ngon, đủ chất, không lãng phí ví tiền
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Phân biệt giữa chi phí mua sắm tại chợ và chi phí phần nguyên liệu sử dụng thực tế cho từng bữa ăn.
          </p>
        </div>

        <div className="text-xs text-slate-700 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200 flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-blue-600" />
          <span>Ngân sách tham khảo: <strong>{formatVND(metrics.dailyReferenceBudget)}/ngày</strong></span>
        </div>
      </div>

      {/* Generator Control Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleGenerateMeal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Daily Budget */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngân sách ăn uống / ngày (VNĐ)
              </label>
              <input
                type="number"
                step="5000"
                min="20000"
                max="300000"
                required
                value={budgetInput}
                onChange={(e) => setBudgetInput(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* People Count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số người ăn
              </label>
              <select
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value={1}>1 người (Cá nhân)</option>
                <option value={2}>2 người (Cặp đôi / Bạn cùng phòng)</option>
                <option value={3}>3 người</option>
                <option value={4}>4 người (Gia đình nhỏ)</option>
              </select>
            </div>

            {/* Days Count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lập thực đơn mấy ngày?
              </label>
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value={1}>1 ngày (Hôm nay)</option>
                <option value={3}>3 ngày (Ngắn hạn)</option>
                <option value={5}>5 ngày (Trong tuần)</option>
                <option value={7}>7 ngày (Trọn 1 tuần)</option>
              </select>
            </div>

            {/* Available Ingredients */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nguyên liệu đã có sẵn ở nhà (Pantry)
              </label>
              <input
                type="text"
                value={availableIngredients}
                onChange={(e) => setAvailableIngredients(e.target.value)}
                placeholder="Ví dụ: Cơm nguội, trứng gà, nước mắm..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Quick Pantry Tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'Gạo sẵn',
                  'Dầu ăn & Gia vị',
                  'Trứng gà (còn 2-3 quả)',
                  'Hành tỏi',
                  'Cơm nguội',
                  'Mì tôm',
                  'Tủ lạnh trống',
                ].map((tag) => {
                  const isIncluded = availableIngredients.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (tag === 'Tủ lạnh trống') {
                          setAvailableIngredients('');
                          return;
                        }
                        if (isIncluded) {
                          setAvailableIngredients((prev) =>
                            prev
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s) => s !== tag)
                              .join(', ')
                          );
                        } else {
                          setAvailableIngredients((prev) =>
                            prev ? `${prev}, ${tag}` : tag
                          );
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-all cursor-pointer ${
                        isIncluded
                          ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isIncluded ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú sở thích / kiêng cữ / dị ứng
              </label>
              <input
                type="text"
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
                placeholder="Ví dụ: Ăn chay, không cay, không hành..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCookingFacilities}
                  onChange={(e) => setHasCookingFacilities(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Có bếp nấu tại phòng</span>
              </label>

              <select
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 ml-auto"
              >
                <option value="Dưới 20 phút">Dưới 20 phút (Nhanh gọn)</option>
                <option value="Dưới 30 phút">Dưới 30 phút</option>
                <option value="Thoải mái thời gian">Thoải mái thời gian</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              * Giá nguyên liệu ước tính theo giá chợ dân sinh bình dân tại Việt Nam. Bạn có thể sửa giá theo thực tế!
            </span>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'AI đang lên thực đơn tối ưu...' : 'Lập thực đơn tiết kiệm'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* RESULTS DISPLAY */}
      {mealPlan && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                  Kế hoạch ăn uống {mealPlan.days?.length} ngày ({mealPlan.numberOfPeople || numberOfPeople} người ăn)
                </span>
                <p className="text-sm font-bold mt-1 text-blue-50">{mealPlan.summary}</p>
              </div>

              <div className="flex flex-wrap items-center gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-blue-500/50">
                <div>
                  <span className="text-[11px] text-blue-200 block">🛒 Tiền đi chợ đợt này</span>
                  <div className="text-xl font-extrabold">{formatVND(mealPlan.totalMarketBudgetNeeded || (mealPlan as any).totalEstimatedCost || (budgetInput * days))}</div>
                  <span className="text-[10px] text-blue-300">Cần rút ví mua tại chợ</span>
                </div>
                <div>
                  <span className="text-[11px] text-blue-200 block">🍲 Chi phí tiêu thụ thực tế</span>
                  <div className="text-xl font-extrabold">{formatVND(mealPlan.totalIngredientCostUsed || Math.round((mealPlan.totalMarketBudgetNeeded || (budgetInput * days)) * 0.85))}</div>
                  <span className="text-[10px] text-blue-300">Tính theo phần ăn</span>
                </div>
                <div>
                  <span className="text-[11px] text-blue-200 block">Bình quân / ngày</span>
                  <div className="text-xl font-extrabold">{formatVND((mealPlan as any).dailyAverage || budgetInput)}</div>
                  <span className="text-[10px] text-blue-300">{(mealPlan as any).dailyAverage <= budgetInput ? '✓ Đạt ngân sách' : 'Cần tối ưu'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mealPlan.days?.map((day, dIdx) => (
              <div
                key={day.dayNumber || dIdx}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h3 className="font-bold text-sm text-slate-900">{day.dayTitle}</h3>
                    <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                      {formatVND(day.dailyUsedCost || (day as any).dailyCost || 0)}
                    </span>
                  </div>

                  {/* Meals */}
                  <div className="space-y-3">
                    {day.meals?.map((m: any, mIdx: number) => {
                      const mealKey = `${dIdx}-${mIdx}`;
                      const isAdded = addedMealKeys.has(mealKey);
                      const mealCost = m.cost || (m.ingredients?.reduce((s: number, ing: any) => s + (ing.portionCostEstimate || 10000), 0)) || 15000;

                      return (
                        <div key={mIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {m.type}
                              </span>
                              <h4 className="font-bold text-xs text-slate-900 mt-1">{m.dish}</h4>
                            </div>
                            <span className="font-bold text-xs text-slate-800 shrink-0">
                              {formatVND(mealCost)}
                            </span>
                          </div>

                          {m.recipeShort && (
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              {m.recipeShort}
                            </p>
                          )}

                          <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              ⏱ {m.preparationTimeMinutes || 20} phút
                            </span>

                            <button
                              type="button"
                              onClick={() => handleAddMealToTracker(m, dIdx, mIdx)}
                              disabled={isAdded}
                              className={`text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                isAdded ? 'text-emerald-600 font-bold' : 'text-slate-600 hover:text-blue-700'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Đã ghi chép</span>
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Ghi vào thu chi</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SHOPPING LIST WITH CHECKLIST (Section 10.5) */}
          {shoppingList.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Danh sách đi chợ gom chung ({shoppingList.length} món)</span>
                </h3>
                <span className="text-[11px] text-slate-400">Bấm để đánh dấu đã mua · Sửa giá theo thực tế chợ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {shoppingList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      item.isPurchased ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePurchased(item.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-all cursor-pointer ${
                          item.isPurchased
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-blue-500'
                        }`}
                      >
                        {item.isPurchased && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div>
                        <div className={`text-xs font-bold ${item.isPurchased ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {item.name}
                        </div>
                        <span className="text-[10px] text-slate-400">{item.neededQuantity}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <input
                        type="text"
                        defaultValue={new Intl.NumberFormat('vi-VN').format(item.estimatedPrice)}
                        onBlur={(e) => handleEditPrice(item.id, e.target.value)}
                        className="w-20 text-right text-xs font-extrabold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500"
                        title="Bấm để sửa giá thực tế"
                      />
                      <span className="text-[10px] text-slate-400 block">đ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
