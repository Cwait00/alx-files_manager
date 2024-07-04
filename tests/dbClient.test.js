const dbClient = require('../utils/db');

describe('dbClient', () => {
  it('should connect to the database', async () => {
    const connection = await dbClient.db;
    expect(connection).toBeDefined();
  });

  it('should insert a document into collection', async () => {
    const collection = dbClient.db.collection('test');
    const result = await collection.insertOne({ name: 'test' });
    expect(result.insertedCount).toBe(1);
  });

  it('should find a document in collection', async () => {
    const collection = dbClient.db.collection('test');
    await collection.insertOne({ name: 'test' });
    const result = await collection.findOne({ name: 'test' });
    expect(result.name).toBe('test');
  });
});
