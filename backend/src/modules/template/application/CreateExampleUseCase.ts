import { injectable, inject } from 'inversify';
import { IExampleRepository } from '../domain/IExampleRepository';
import { ExampleEntity } from '../domain/ExampleEntity';

@injectable()
export class CreateExampleUseCase {
  constructor(
    @inject('ExampleRepository') private repository: IExampleRepository
  ) {}

  async execute(id: string, name: string): Promise<ExampleEntity> {
    const existing = await this.repository.findById(id);
    if (existing) {
      throw new Error('Entity already exists');
    }

    const entity = new ExampleEntity(id, name, new Date());
    await this.repository.save(entity);
    return entity;
  }
}
