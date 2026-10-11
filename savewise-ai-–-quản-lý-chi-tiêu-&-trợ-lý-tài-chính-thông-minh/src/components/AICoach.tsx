import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { FinancialHealthMetrics, SavingsGoal, Transaction } from '../types';
import { formatVND } from '../utils/formatters';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isAiGenerated?: boolean;
}

interface AICoachProps {
  metrics: FinancialHealthMetrics;
  goals: SavingsGoal[];
  transactions: Transaction[];
  initialQuestion?: string;
}

export const AICoach: React.FC<AICoachProps> = ({
  metrics,
  goals,
  transactions,
  initialQuestion,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Xin chào! Tôi là **SAVEWISE AI Coach** – trợ lý tài chính cá nhân đồng hành cùng bạn.

Hiện tại tôi đã nắm bắt số liệu tài chính thực tế của bạn:
- **Số dư thực tế:** ${formatVND(metrics.realBalance)}
- **Tiền có thể chi tiêu:** ${formatVND(metrics.spendableMoney)} (sau khi giữ lại ${formatVND(metrics.unpaidMandatoryExpenses)} khoản bắt buộc và quỹ dự phòng)
- **Hạn mức tham khảo:** **${formatVND(metrics.dailyReferenceBudget)}/ngày** trong ${metrics.daysRemaining} ngày tới
${goals.length > 0 ? `- **Mục tiêu ưu tiên:** "${goals[0].title}" (còn thiếu ${formatVND(Math.max(0, goals[0].targetAmount - goals[0].currentAmount))})` : ''}

Bạn có thể hỏi tôi bất cứ điều gì về cách chi tiêu 5 ngày tới, đắn đo mua sắm, hoặc lên kế hoạch tiết kiệm nhé!`,
      timestamp: Date.now(),
      isAiGenerated: true,
    },
  ]);

  const [input, setInput] = useState(initialQuestion || '');
  const [loading, setLoading] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [showCompletenessDetails, setShowCompletenessDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingSeconds(0);
      interval = setInterval(() => {
        setLoadingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setLoadingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickQuestions = [
    'Tôi còn 200.000 đồng cho 5 ngày, nên phân chia thế nào?',
    'Vì sao tháng này tôi tiêu nhiều hơn tháng trước?',
    'Tôi có nên mua món đồ này không?',
    'Hãy giúp tôi tiết kiệm 500.000 đồng trong một tháng.',
    'Làm thế nào để giảm chi phí ăn uống mà vẫn ăn đủ chất?',
  ];

  const handleSend = async (messageText: string = input) => {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySpent = transactions
        .filter((t) => t.type === 'expense' && t.date === todayStr)
        .reduce((sum, t) => sum + t.amount, 0);

      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          financialContext: {
            totalBalance: metrics.realBalance,
            dailyBudget: metrics.dailyReferenceBudget,
            dailySpent: todaySpent,
            daysRemaining: metrics.daysRemaining,
            mandatoryExpenses: metrics.unpaidMandatoryExpenses,
            goals: goals.map((g) => ({
              title: g.title,
              targetAmount: g.targetAmount,
              currentAmount: g.currentAmount,
              targetDays: g.targetDays,
            })),
            recentTransactions: transactions.slice(0, 8),
          },
        }),
      });

      const data = await res.json();
      const replyText = data.reply || data.fallbackReply || 'Rất tiếc, tôi chưa thể trả lời lúc này. Bạn thử lại nhé!';

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: Date.now(),
        isAiGenerated: true,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        text: 'Đã có sự cố kết nối tới máy chủ AI. Xin bạn vui lòng thử lại sau giây lát!',
        timestamp: Date.now(),
        isAiGenerated: false,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: 'Cuộc trò chuyện đã được làm mới. Hãy nhập câu hỏi tài chính để tôi tư vấn cho bạn nhé!',
        timestamp: Date.now(),
        isAiGenerated: false,
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <Bot className="w-4 h-4 text-blue-600" />
            <span>AI MONEY COACH · TRỢ LÝ TÀI CHÍNH CÁ NHÂN</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Trò chuyện tư vấn chi tiêu & Ngân sách
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Đưa ra lời khuyên dựa trên số liệu thực tế, giải thích rõ nguyên nhân và không khuyến khích nhịn ăn hoặc bỏ bữa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Phản hồi siêu tốc ~1.5s</span>
          </div>

          <button
            onClick={() => setShowCompletenessDetails(!showCompletenessDetails)}
            className={`text-xs font-semibold p-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
              metrics.dataCompleteness.score >= 80
                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            }`}
            title="Độ đầy đủ dữ liệu tài chính"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dữ liệu: {metrics.dataCompleteness.score}%</span>
          </button>

          <button
            onClick={() => setShowPrivacyNotice(!showPrivacyNotice)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Dữ liệu nào được gửi đến AI?"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Minh bạch</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* DATA COMPLETENESS & ASSUMPTIONS BANNER */}
      {showCompletenessDetails && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Kiểm tra độ đầy đủ dữ liệu ({metrics.dataCompleteness.score}%/100%)</span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800">
              {metrics.dataCompleteness.score >= 80 ? 'Dữ liệu đầy đủ, lời khuyên sát thực tế' : 'Đang sử dụng một số giả định'}
            </span>
          </div>

          {metrics.dataCompleteness.missingItems.length > 0 && (
            <div>
              <span className="font-bold block text-amber-900">Thông tin chưa khai báo:</span>
              <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-amber-800">
                {metrics.dataCompleteness.missingItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {metrics.dataCompleteness.assumptions.length > 0 && (
            <div className="pt-1 border-t border-amber-200/60">
              <span className="font-bold block text-amber-900">Giả định của AI khi trả lời:</span>
              <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-amber-800 text-[11px]">
                {metrics.dataCompleteness.assumptions.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* PRIVACY TRANSPARENCY NOTICE (Section 9.2) */}
      {showPrivacyNotice && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Quy tắc bảo mật & Ngữ cảnh gửi đến AI (Gemini):</span>
          </div>
          <p className="leading-relaxed">
            SAVEWISE AI chỉ gửi các số liệu tài chính cần thiết cho câu hỏi: Số dư thực tế ({formatVND(metrics.realBalance)}), ngân sách ngày tham khảo, số ngày còn lại trong kỳ, tổng chi bắt buộc và các mục tiêu tiết kiệm.
            <strong> Tuyệt đối không có mật khẩu, thông tin ngân hàng hay dữ liệu định danh cá nhân nhạy cảm nào được truyền đi.</strong>
          </p>
        </div>
      )}

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col h-[650px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                  }`}
                >
                  {/* Basic markdown bold renderer */}
                  {m.text.split('\n').map((line, idx) => {
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                        {parts.map((p, pIdx) => {
                          if (p.startsWith('**') && p.endsWith('**')) {
                            return (
                              <strong
                                key={pIdx}
                                className={isUser ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold'}
                              >
                                {p.slice(2, -2)}
                              </strong>
                            );
                          }
                          return p;
                        })}
                      </p>
                    );
                  })}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white shrink-0 shadow-xs mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-2xl mr-auto animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-xs">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5 shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                <span className="font-medium">
                  {loadingSeconds < 2
                    ? '⚡ Đang đọc dữ liệu số dư và phân tích ngân sách...'
                    : loadingSeconds < 4
                    ? '💡 Đang tính toán giải pháp chi tiêu tối ưu...'
                    : '✨ Đang hoàn thiện lời khuyên cụ thể cho bạn...'}
                </span>
                <span className="text-[10px] text-blue-500 font-bold ml-1">({loadingSeconds}s)</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] font-bold text-slate-500 shrink-0">Gợi ý câu hỏi:</span>
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="text-[11px] font-medium text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-800 hover:border-blue-200 border border-slate-200 px-3 py-1 rounded-lg shrink-0 transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi tài chính (ví dụ: Còn 200k cho 5 ngày nên tiêu thế nào?)..."
              disabled={loading}
              className="flex-1 px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>Gửi</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
