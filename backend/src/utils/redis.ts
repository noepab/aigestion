import { getCache as gc, setCache as sc, getRedisClient } from '../cache/redis';

export const getCache = gc;
export const setCache = sc;
export const redisClient = getRedisClient();

export default redisClient;
