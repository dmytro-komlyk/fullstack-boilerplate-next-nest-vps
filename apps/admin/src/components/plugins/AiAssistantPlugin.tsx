'use client';

import { trpc } from '@package/api/client';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { LuChevronDown, LuDatabase, LuSend, LuTerminal, LuX } from 'react-icons/lu';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  const t = useTranslations('AI.Admin');
  const QUICK_ACTIONS = t.raw('quickActions') as { label: string; query: string }[];

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: isStreaming ? 'auto' : 'smooth',
      });
    }
  }, [messages, isStreaming]);

  trpc.ai.askAdminAssistant.useSubscription(
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

  const handleSend = (overrideQuery?: string) => {
    const query = overrideQuery || input;
    if (!query.trim() || isStreaming) return;

    const userMsg = { role: 'user', content: query };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setSubscriptionInput({ prompt: query, history, locale });
    setInput('');
    setIsStreaming(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="mb-4 w-96 md:w-110 h-150 bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-white/5 flex flex-col overflow-hidden"
          >
            <div className="bg-linear-to-r from-indigo-600 to-indigo-800 p-5 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <LuTerminal className="size-5 text-indigo-100" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{t('header.title')}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-[10px] text-indigo-100/80 font-medium">
                      {t('header.status')}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <LuX className="size-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-navy-950/30 no-scrollbar"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-40 text-center px-10">
                  <LuDatabase className="size-10 mb-3 text-indigo-500" />
                  <p className="text-xs font-medium italic">{t('welcome')}</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`prose prose-sm dark:prose-invert max-w-[92%] p-3.5 rounded-2xl text-[13px] shadow-xs ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-navy-800 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none'
                    }`}
                  >
                    {m.role === 'assistant' && !m.content && isStreaming ? (
                      <div className="flex items-center gap-1 py-1 px-2">
                        <div className="size-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-duration:0.8s]" />
                        <div className="size-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                        <div className="size-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                      </div>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => {
                            const content = String(children);
                            const buttonRegex = /\[DOWNLOAD_BUTTON\|(.*?)\|(.*?)\]/;
                            const match = content.match(buttonRegex);

                            if (match) {
                              const [, url, filename] = match;
                              return (
                                <div className="flex flex-col gap-2 my-2">
                                  <a
                                    href={url}
                                    download={filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-indigo-600 to-indigo-800 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all active:scale-95 no-underline border border-indigo-400/20"
                                  >
                                    <span className="text-base">📥</span>
                                    Скачать {filename}
                                  </a>
                                </div>
                              );
                            }
                            return <p className="leading-relaxed">{children}</p>;
                          },
                          a: ({ ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              className="text-indigo-600 underline decoration-indigo-300 hover:text-indigo-800"
                            >
                              {props.children}
                            </a>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar bg-white dark:bg-navy-900 border-t border-gray-50 dark:border-white/5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.query)}
                  className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap px-3 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-lg border border-transparent hover:border-indigo-500/50 hover:text-indigo-600 transition-all active:scale-95"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-white/5">
              <div className="relative flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('inputPlaceholder')}
                  className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500/20 bg-gray-50 dark:bg-white/5 outline-none transition-all dark:text-white"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isStreaming || !input.trim()}
                  className="absolute right-2 p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg disabled:opacity-30"
                >
                  <LuSend className="size-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button: Admin Style */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center text-white transition-all duration-500 ${
          isOpen ? 'bg-navy-800 rotate-90' : 'bg-indigo-600'
        } border-2 border-white/20`}
      >
        {isOpen ? (
          <LuChevronDown className="size-8" />
        ) : (
          <div className="relative">
            <LuTerminal className="size-8" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-indigo-600" />
          </div>
        )}
      </motion.button>
    </div>
  );
};
