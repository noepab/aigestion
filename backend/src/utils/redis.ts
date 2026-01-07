import { getCache as gc, getRedisClient, setCache as sc } from '../cache/redis';

export const getCache = gc;
export const setCache = sc;
export const getClient = getRedisClient;

export default getRedisClient;
