import 'reflect-metadata';
import { CreateExampleUseCase } from '../../../../src/modules/template/application/CreateExampleUseCase';
import { IExampleRepository } from '../../../../src/modules/template/domain/IExampleRepository';
import { ExampleEntity } from '../../../../src/modules/template/domain/ExampleEntity';

describe('CreateExampleUseCase', () => {
  let repository: jest.Mocked<IExampleRepository>;
  let useCase: CreateExampleUseCase;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    useCase = new CreateExampleUseCase(repository);
  });

  it('should create and save a new entity', async () => {
    repository.findById.mockResolvedValue(null);
    repository.save.mockResolvedValue();

    const result = await useCase.execute('1', 'Test Name');

    expect(result).toBeInstanceOf(ExampleEntity);
    expect(result.id).toBe('1');
    expect(result.name).toBe('Test Name');
    expect(repository.save).toHaveBeenCalledWith(result);
  });

  it('should throw error if entity already exists', async () => {
    repository.findById.mockResolvedValue(new ExampleEntity('1', 'Existing', new Date()));

    await expect(useCase.execute('1', 'New Name')).rejects.toThrow('Entity already exists');
    expect(repository.save).not.toHaveBeenCalled();
  });
});
