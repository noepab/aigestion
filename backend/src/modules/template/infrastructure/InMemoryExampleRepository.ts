import { injectable } from 'inversify';
import { IExampleRepository } from '../domain/IExampleRepository';
import { ExampleEntity } from '../domain/ExampleEntity';

@injectable()
export class InMemoryExampleRepository implements IExampleRepository {
  private storage: Map<string, ExampleEntity> = new Map();

  async findById(id: string): Promise<ExampleEntity | null> {
    return this.storage.get(id) || null;
  }

  async save(entity: ExampleEntity): Promise<void> {
    this.storage.set(entity.id, entity);
  }
}
