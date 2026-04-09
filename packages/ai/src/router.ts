type Intent = 'DATA' | 'ACTION' | 'GENERAL' | 'PRIVATE';

export function detectIntent(prompt: string): Intent {
  const p = prompt.toLowerCase();

  if (
    p.includes('админ') ||
    p.includes('admin') ||
    p.includes('user') ||
    p.includes('пользователь') ||
    p.includes('email') ||
    p.includes('роль')
  ) {
    return 'PRIVATE';
  }

  if (p.includes('сколько') || p.includes('count') || p.includes('покажи') || p.includes('list')) {
    return 'DATA';
  }

  if (p.includes('заблокируй') || p.includes('update') || p.includes('delete')) {
    return 'ACTION';
  }

  return 'GENERAL';
}
