'use client';

import { Button } from '@heroui/react';
import { trpc } from '@package/api/client';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { LuMessageSquare, LuSend, LuSparkles, LuX } from 'react-icons/lu';
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

  const t = useTranslations('AI.Public');
  const QUICK_ACTIONS = t.raw('quickActions') as { label: string; query: string }[];

  trpc.ai.askPublicAssistant.useSubscription(
    subscriptionInput || { prompt: '', history: [], locale },
    {
      enabled: !!subscriptionInput,
      onData: (data) => {
        if (data.type !== 'step') {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last) return prev;
            return [...prev.slice(0, -1), { ...last, content: data.content }];
          });
        }
      },
      onComplete: () => {
        setIsStreaming(false);
        setSubscriptionInput(null);
      },
      onError: () => {
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

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: isStreaming ? 'auto' : 'smooth',
      });
    }
  }, [messages, isStreaming]);

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-85 md:w-100 h-145 bg-white dark:bg-navy-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header: Public Style with Gradient */}
            <div className="bg-linear-to-r from-brand-500 to-indigo-600 p-6 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <LuSparkles className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{t('header.title')}</h3>
                  <p className="text-[10px] text-brand-100 opacity-90">{t('header.status')}</p>
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
                <div className="text-center mt-10 px-8 flex flex-col items-center gap-3 opacity-50">
                  <LuSparkles className="size-8 text-brand-500" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">{t('welcome')}</p>
                </div>
              )}

              {messages.map((m, i) => {
                return (
                  <div key={i} className="flex flex-col w-full gap-2">
                    <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`prose prose-sm dark:prose-invert max-w-[92%] p-3.5 rounded-2xl text-[13px] shadow-xs ${
                          m.role === 'user'
                            ? 'bg-brand-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-navy-800 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none'
                        }`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <div className="mb-2 last:mb-0 leading-relaxed text-[13px]">
                                {children}
                              </div>
                            ),
                            a: ({ href, children }) => {
                              const url = href || '';
                              const isDownload =
                                url.includes('/exports/') || /\.(csv|xlsx|pdf|zip)$/i.test(url);

                              if (isDownload) {
                                const fileName = url.split('/').pop() || 'file.csv';

                                return (
                                  <div className="my-3 block">
                                    <a
                                      href={url}
                                      download={fileName}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-3 px-5 py-3 bg-linear-to-r from-indigo-600 to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all no-underline border border-white/10"
                                    >
                                      <span className="text-base">📥</span>
                                      {fileName}
                                    </a>
                                  </div>
                                );
                              }
                              return (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-500 dark:text-indigo-400 font-semibold no-underline hover:text-indigo-600 transition-colors"
                                >
                                  {children}
                                </a>
                              );
                            },
                            ul: ({ children }) => (
                              <ul className="space-y-1.5 my-3 list-none p-0">{children}</ul>
                            ),
                            li: ({ children }) => (
                              <li className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                <span className="text-[13px]">{children}</span>
                              </li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-bold text-indigo-600 dark:text-indigo-400">
                                {children}
                              </strong>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>

                        {m.role === 'assistant' && !m.content && isStreaming && (
                          <div className="flex items-center gap-1 py-1 px-2">
                            <div className="size-1.5 bg-brand-500/50 rounded-full animate-bounce [animation-duration:0.8s]" />
                            <div className="size-1.5 bg-brand-500/50 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                            <div className="size-1.5 bg-brand-500/50 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-gray-100/50 dark:bg-navy-900 border-t border-gray-100 dark:border-white/10">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.query)}
                  className="text-[11px] font-medium whitespace-nowrap px-4 py-2 bg-white dark:bg-white/5 text-brand-600 dark:text-brand-400 rounded-full border border-brand-100 dark:border-brand-500/20 hover:bg-brand-500 hover:text-white transition-all active:scale-95"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-gray-100/50 dark:bg-navy-900 border-t border-gray-100 dark:border-white/10">
              <div className="relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('inputPlaceholder')}
                  className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3 pr-12 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white bg-white dark:bg-white/5 focus:bg-white dark:focus:bg-navy-800"
                />
                <Button
                  onPress={() => handleSend()}
                  isIconOnly
                  disabled={isStreaming || !input.trim()}
                  className="size-fit min-w-fit bg-transparent absolute right-2 p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg disabled:opacity-30"
                >
                  <LuSend className="size-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button: Public Style */}
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
