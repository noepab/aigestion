import { cache } from '../../utils/cacheManager';
import { getCache, setCache } from '../../utils/redis';
import { logger } from '../../utils/logger';

jest.mock('../../utils/redis');
jest.mock('../../utils/logger');

describe('Cache Manager (Layered)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.close(); // Clears L1
  });

  it('should return value from L1 on second call (L1 HIT)', async () => {
    const key = 'test-key';
    const value = { foo: 'bar' };

    (getCache as jest.Mock).mockResolvedValueOnce(value);

    // First call: L2 HIT, populates L1
    const res1 = await cache.get(key);
    expect(res1).toEqual(value);
    expect(getCache).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(expect.any(Object), 'Cache L2 HIT');

    // Second call: L1 HIT, should NOT call getCache
    const res2 = await cache.get(key);
    expect(res2).toEqual(value);
    expect(getCache).toHaveBeenCalledTimes(1); // Still 1
    expect(logger.debug).toHaveBeenCalledWith(expect.any(Object), 'Cache L1 HIT');
  });

  it('should set value in both L1 and L2', async () => {
    const key = 'set-key';
    const value = 'set-value';

    await cache.set(key, value, { ttl: 100 });

    expect(setCache).toHaveBeenCalledWith(key, value, 100);

    // Verify L1 hit immediately
    const res = await cache.get(key);
    expect(res).toEqual(value);
    expect(getCache).not.toHaveBeenCalled();
  });

  it('should clear L1 and L2 on delete', async () => {
    const key = 'del-key';
    const value = 'del-value';

    await cache.set(key, value);
    await cache.delete(key);

    (getCache as jest.Mock).mockResolvedValue(null);
    const res = await cache.get(key);
    expect(res).toBeNull();
    expect(getCache).toHaveBeenCalled(); // Should hit L2 because L1 was cleared
  });
});
