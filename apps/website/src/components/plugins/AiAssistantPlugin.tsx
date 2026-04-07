'use client';

import { trpc } from '@package/api/client';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { LuMessageSquare, LuSend, LuSparkles, LuX } from 'react-icons/lu';
import ReactMarkdown from 'react-markdown';

export const AiAssistantPlugin = () => {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [subscriptionInput, setSubscriptionInput] = useState<{
    prompt: string;
    history: any[];
    locale: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  trpc.ai.askPublicAssistant.useSubscription(
    subscriptionInput || { prompt: '', history: [], locale },
    {
      enabled: !!subscriptionInput,
      onData: (token) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last) return prev;

          const newRawContent = last.content + token;
          const cleanContent = newRawContent
            .replace(/\[\[CALL:.*?\]\]/g, '')
            .replace(/🔍 _Fetching real-time data\.\.\._/g, '')
            .trimStart();

          return [...prev.slice(0, -1), { ...last, content: cleanContent }];
        });
      },
      onComplete: () => {
        setIsStreaming(false);
        setSubscriptionInput(null);
      },
      onError: (err) => {
        console.error(err);
        setIsStreaming(false);
        setSubscriptionInput(null);
      },
    }
  );

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;

    const userMsg = { role: 'user', content: input };
    const historyForAi = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setSubscriptionInput({ prompt: input, history: historyForAi, locale });
    setInput('');
    setIsStreaming(true);
  };

  const handleQuickAction = (query: string) => {
    if (!input.trim() || isStreaming) return;

    const userMsg = { role: 'user', content: query };
    const historyForAi = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setSubscriptionInput({ prompt: query, history: historyForAi, locale });
    setInput('');
    setIsStreaming(true);
  };

  const PUBLIC_QUICK_ACTIONS = [
    { label: '🚀 Стек технологий', query: 'Какой технологический стек используется в Omni-Stack?' },
    { label: '🛠 Возможности', query: 'Расскажи о главных фишках этого проекта' },
    { label: '📱 Mobile', query: 'Есть ли поддержка мобильного приложения?' },
    { label: '🛡 Безопасность', query: 'Как реализована авторизация и защита?' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 md:w-96 h-137.5 bg-white dark:bg-navy-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col overflow-hidden"
          >
            <div className="bg-linear-to-r from-brand-500 to-blue-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <LuSparkles className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Omni Guide</h3>
                  <p className="text-[10px] text-blue-100 opacity-90">AI Assistant • Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-2 rounded-xl transition-colors"
              >
                <LuX className="size-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30 dark:bg-white/5 scroll-smooth no-scrollbar"
            >
              {messages.length === 0 && (
                <div className="text-center mt-10">
                  <p className="text-gray-500 dark:text-gray-400 text-sm px-6">
                    Привет! Я помогу тебе разобраться в возможностях Omni-tRPC-Stack. Что тебя
                    интересует?
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`prose prose-sm dark:prose-invert max-w-[90%] p-4 rounded-3xl text-sm shadow-sm ${
                      m.role === 'user'
                        ? 'bg-brand-500 text-white rounded-br-none'
                        : 'bg-white dark:bg-navy-800 border border-gray-100 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-bl-none'
                    }`}
                  >
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
              {PUBLIC_QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.query)}
                  className="text-[11px] font-medium whitespace-nowrap px-4 py-2 bg-white dark:bg-white/5 text-brand-600 dark:text-brand-400 rounded-full border border-brand-100 dark:border-brand-500/20 hover:bg-brand-500 hover:text-white transition-all active:scale-95"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-white/10">
              <div className="relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Задать вопрос..."
                  className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3 pr-12 focus:ring-2 focus:ring-brand-500/20 bg-transparent outline-none transition-all dark:text-white"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isStreaming}
                  className="absolute right-2 p-2 text-brand-500 hover:bg-brand-50 rounded-xl disabled:opacity-30"
                >
                  <LuSend className="size-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-4xl shadow-2xl flex items-center justify-center text-white transition-all duration-500 ${
          isOpen ? 'bg-navy-800 rotate-90' : 'bg-brand-500'
        }`}
      >
        {isOpen ? <LuX className="size-8" /> : <LuMessageSquare className="size-8" />}
      </motion.button>
    </div>
  );
};
