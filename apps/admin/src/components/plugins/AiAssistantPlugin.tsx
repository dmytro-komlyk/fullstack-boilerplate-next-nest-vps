'use client';

import { trpc } from '@package/api/client';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { LuChevronDown, LuDatabase, LuSend, LuTerminal, LuX } from 'react-icons/lu';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AgentThinkingSteps = ({ steps }: { steps: any[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const lastStep = steps[steps.length - 1];
  const stepsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && stepsEndRef.current) {
      stepsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps, isExpanded]);

  if (steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 ml-2 mb-4">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 bg-indigo-50/80 dark:bg-white/5 border border-indigo-100 dark:border-white/10 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-100 dark:hover:bg-white/10 transition-all w-fit max-w-[90%] shadow-xs"
      >
        <div className="relative flex items-center justify-center">
          <div className="size-2 bg-indigo-500 rounded-full animate-ping absolute" />
          <div className="size-2 bg-indigo-500 rounded-full relative" />
        </div>

        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest whitespace-nowrap">
            {lastStep.type}
          </span>
          <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate font-medium max-w-37.5 md:max-w-50">
            {lastStep.message}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-1 border-l border-indigo-200 dark:border-white/10 pl-2">
          <span className="text-[10px] font-mono text-indigo-400">{steps.length}</span>
          <LuChevronDown
            className={`size-3 text-indigo-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative ml-1.5 pl-4 border-l-2 border-indigo-500/20 py-1">
              <div className="max-h-48 overflow-y-auto pr-2 space-y-2 no-scrollbar scroll-smooth">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col gap-1 group">
                    <div className="flex items-start gap-2 text-[10px] font-mono">
                      <span className="text-indigo-500/40 font-bold shrink-0 mt-0.5">
                        [{idx + 1}]
                      </span>
                      <div className="flex flex-col">
                        <span className="text-gray-500 dark:text-gray-400 leading-tight">
                          {step.message}
                        </span>
                        {step.data && (
                          <div className="mt-1 text-[9px] font-mono bg-gray-100 dark:bg-white/5 p-1.5 rounded border border-gray-200/50 dark:border-white/5 text-gray-400 break-all overflow-x-hidden">
                            {JSON.stringify(step.data)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={stepsEndRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
  const [currentSteps, setCurrentSteps] = useState<any[]>([]);

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
      onData: (data) => {
        if (data.type === 'step') {
          setCurrentSteps((prev) => [...prev, data.content]);
        } else {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last) return prev;
            return [...prev.slice(0, -1), { ...last, content: data.content }];
          });
          setCurrentSteps([]);
        }
      },
      onComplete: () => {
        setIsStreaming(false);
        setSubscriptionInput(null);
        setTimeout(() => setCurrentSteps([]), 3000);
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
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-white/5 scroll-smooth no-scrollbar"
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
                        <div className="size-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-duration:0.8s]" />
                        <div className="size-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                        <div className="size-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && <AgentThinkingSteps steps={currentSteps} />}
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
            <div className="p-4 bg-gray-100 dark:bg-navy-900 border-t border-gray-100 dark:border-white/10">
              <div className="relative flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('inputPlaceholder')}
                  className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3 pr-12 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white bg-white dark:bg-white/5 focus:bg-white dark:focus:bg-navy-800"
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
