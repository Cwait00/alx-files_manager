const redisClient = require('../utils/redis');

describe('redisClient', () => {
  beforeAll(() => {
    jest.spyOn(redisClient.client, 'set').mockImplementation();
    jest.spyOn(redisClient.client, 'get').mockImplementation();
    jest.spyOn(redisClient.client, 'del').mockImplementation();
  });

  it('should set a value in redis', async () => {
    redisClient.client.set.mockResolvedValue('OK');
    const result = await redisClient.set('key', 'value');
    expect(result).toBe('OK');
  });

  it('should get a value from redis', async () => {
    redisClient.client.get.mockResolvedValue('value');
    const result = await redisClient.get('key');
    expect(result).toBe('value');
  });

  it('should delete a value from redis', async () => {
    redisClient.client.del.mockResolvedValue(1);
    const result = await redisClient.del('key');
    expect(result).toBe(1);
  });
});
