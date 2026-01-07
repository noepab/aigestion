// src/infrastructure/repository/BaseRepository.ts

export interface IEntity {
  id: string;
}

export class BaseRepository<T extends IEntity> {
  private items = new Map<string, T>();

  // Supports both create(item) and create(id, item)
  async create(idOrItem: string | T, maybeItem?: T): Promise<T> {
    let item: T;
    if (typeof idOrItem === 'string' && maybeItem) {
      // Ensure the item has the correct id
      (maybeItem as any).id = idOrItem;
      item = maybeItem;
    } else {
      item = idOrItem as T;
    }
    this.items.set(item.id, item);
    return item;
  }

  async findAll(): Promise<T[]> {
    return Array.from(this.items.values());
  }

  async findById(id: string): Promise<T | null> {
    return this.items.get(id) ?? null;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const existing = this.items.get(id);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, ...data } as T;
    this.items.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
}
