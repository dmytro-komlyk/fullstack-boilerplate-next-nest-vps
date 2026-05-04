export const systemTools = {
  getWelcomeMessage: async () => {
    return {
      message: 'Welcome! I am your virtual assistant.',
      capabilities: ['statistics', 'user management', 'security alerts', 'exports'],
      status: 'ready',
    };
  },

  getSystemStatus: async () => {
    return {
      status: 'operational',
      responseTime: '5 mins',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  },
};
