
import 'reflect-metadata';

import { BaseRepository, IEntity } from '../BaseRepository';

interface TestEntity extends IEntity {
  name: string;
}

class TestRepository extends BaseRepository<TestEntity> {}

describe('BaseRepository', () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
  });

  it('should create and retrieve an item', async () => {
    const item: TestEntity = { id: '1', name: 'Test' };
    await repository.create(item);
    const retrieved = await repository.findById('1');
    expect(retrieved).toEqual(item);
  });

  it('should return null if item not found', async () => {
    const retrieved = await repository.findById('non-existent');
    expect(retrieved).toBeNull();
  });

  it('should find all items', async () => {
    const item1: TestEntity = { id: '1', name: 'Test 1' };
    const item2: TestEntity = { id: '2', name: 'Test 2' };
    await repository.create(item1);
    await repository.create(item2);

    const all = await repository.findAll();
    expect(all).toHaveLength(2);
    expect(all).toContainEqual(item1);
    expect(all).toContainEqual(item2);
  });

  it('should update an item', async () => {
    const item: TestEntity = { id: '1', name: 'Original' };
    await repository.create(item);

    const updated = await repository.update('1', { name: 'Updated' });
    expect(updated).toEqual({ id: '1', name: 'Updated' });

    const retrieved = await repository.findById('1');
    expect(retrieved?.name).toBe('Updated');
  });

  it('should return null when updating non-existent item', async () => {
    const updated = await repository.update('non-existent', { name: 'Updated' });
    expect(updated).toBeNull();
  });

  it('should delete an item', async () => {
    const item: TestEntity = { id: '1', name: 'To Delete' };
    await repository.create(item);

    const result = await repository.delete('1');
    expect(result).toBe(true);

    const retrieved = await repository.findById('1');
    expect(retrieved).toBeNull();
  });

  it('should return false when deleting non-existent item', async () => {
    const result = await repository.delete('non-existent');
    expect(result).toBe(false);
  });
});
