import { ExampleEntity } from './ExampleEntity';

export interface IExampleRepository {
  findById(id: string): Promise<ExampleEntity | null>;
  save(entity: ExampleEntity): Promise<void>;
}
