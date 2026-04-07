'use client';

import { trpc } from '@package/api/client';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
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
    if (isStreaming) return;
    setInput('');

    const userMsg = { role: 'user', content: query };
    const historyForAi = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setSubscriptionInput({ prompt: query, history: historyForAi, locale });
    setIsStreaming(true);
  };

  const ADMIN_QUICK_ACTIONS = [
    { label: '📈 Stats', query: 'Show growth stats and total users' },
    { label: '👥 Admins', query: 'List all administrators' },
    { label: '🆕 Recent', query: 'Who are the last 5 registered users?' },
    { label: '📊 Roles', query: 'Show user distribution by roles' },
    { label: '📊 Export CSV', query: 'Export all users as a CSV report' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-100 h-150 bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-indigo-600 to-indigo-900 p-5 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  🤖
                </div>
                <div>
                  <h3 className="font-bold text-sm">Admin Copilot</h3>
                  <p className="text-[10px] text-indigo-100 opacity-80">Online | Connected to DB</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-1 rounded-lg transition-colors"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth"
            >
              {messages.length === 0 && (
                <div className="text-center mt-10 text-gray-400 text-sm italic">
                  How can I help you with admin tasks today?
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm transition-all ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none wrap-break-word overflow-hidden prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-white prose-invert-0">
                      <ReactMarkdown
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
                    </div>
                    {isStreaming && i === messages.length - 1 && !m.content && (
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 p-2 flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
              {ADMIN_QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.query)}
                  className="text-[11px] font-semibold whitespace-nowrap px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Query system stats or users..."
                  className="w-full text-sm border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={isStreaming}
                  className="absolute right-2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-30"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
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
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 ${
          isOpen ? 'bg-gray-800 rotate-90' : 'bg-linear-to-tr from-indigo-600 to-indigo-900'
        }`}
      >
        {isOpen ? (
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <div className="relative">
            <span className="absolute -top-4 -right-4 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-indigo-500 text-[10px] items-center justify-center font-bold">
                1
              </span>
            </span>
            <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
        )}
      </motion.button>
    </div>
  );
};
