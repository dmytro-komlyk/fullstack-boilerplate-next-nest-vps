const AGENT_MESSAGES = {
  uk: {
    thinking: (step: number) => `Розмірковую (крок ${step})...`,
    calling: (tool: string) => `Викликаю: ${tool}`,
    received: (tool: string) => `Дані від ${tool} отримано`,
    adminOnly:
      '🛠️ Ця дія доступна лише в **Admin Dashboard**.\n\nПублічні користувачі не мають прав на керування акаунтами або перегляд статистики.',
    noPermission: '❌ У вас немає прав для виконання цієї дії.',
    userNotFound: 'Користувача не знайдено в базі даних.',
    maxSteps:
      '⚠️ Ой! Мені знадобилося забагато кроків, щоб знайти відповідь. Спробуйте уточнити запит або зверніться до документації.',
    systemError: (tool: string) => `Помилка: інструмент ${tool} не знайдено.`,
  },
  en: {
    thinking: (step: number) => `Thinking (step ${step})...`,
    calling: (tool: string) => `Calling: ${tool}`,
    received: (tool: string) => `Data from ${tool} received`,
    adminOnly:
      '🛠️ This action is only available in the **Admin Dashboard**.\n\nPublic users do not have permission to manage accounts or view system statistics.',
    noPermission: '❌ You do not have permission to perform this action.',
    userNotFound: 'User not found in the database.',
    maxSteps:
      '⚠️ Oops! It took too many steps to find an answer. Please try to clarify your request or check the documentation.',
    systemError: (tool: string) => `Error: Tool ${tool} not found.`,
  },
} as const;

type Language = keyof typeof AGENT_MESSAGES;
