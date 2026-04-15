export const systemTools = {
  getWelcomeMessage: async () => 'Welcome! I am your virtual assistant. How can I help you?',
  getSystemStatus: async (): Promise<string> =>
    'All systems operational. Support response time: ~5 mins.',
};
