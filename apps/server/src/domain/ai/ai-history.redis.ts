import Redis from 'ioredis';

export type RedisClient = Redis;

type Role = 'user' | 'assistant';

type Message = {
  role: Role;
  content: string;
  createdAt: number;
};

const TTL = 60 * 60 * 24;

const getKey = (userId: string) => `ai:history:${userId}`;

export async function getAiHistory(redis: RedisClient, userId: string): Promise<Message[]> {
  const data = await redis.get(getKey(userId));
  return data ? JSON.parse(data) : [];
}

export async function saveAiMessage(
  redis: RedisClient,
  userId: string,
  role: Role,
  content: string
) {
  const key = getKey(userId);

  const history = await getAiHistory(redis, userId);

  history.push({
    role,
    content,
    createdAt: Date.now(),
  });

  const trimmed = history.slice(-20);

  await redis.set(key, JSON.stringify(trimmed), 'EX', TTL);
}
