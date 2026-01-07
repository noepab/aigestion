import 'reflect-metadata';
import { Container } from 'inversify';
import { QueryBus } from '../../../shared/cqrs/QueryBus';
import { IQuery } from '../../../shared/cqrs/messages';
import { IQueryHandler } from '../../../shared/cqrs/handlers';

class TestQuery implements IQuery {
  constructor(public readonly id: string) { }
}

class TestQueryHandler implements IQueryHandler<TestQuery, string> {
  async handle(query: TestQuery): Promise<string> {
    return 'result-' + query.id;
  }
}

describe('QueryBus', () => {
  let container: Container;
  let queryBus: QueryBus;

  beforeEach(() => {
    container = new Container();
    container.bind('Container').toConstantValue(container);
    container.bind(QueryBus).to(QueryBus);
    container.bind('TestQuery').to(TestQueryHandler);
    queryBus = container.get(QueryBus);
  });

  it('should dispatch query to the correct handler and return result', async () => {
    const query = new TestQuery('123');

    const result = await queryBus.execute<string>('TestQuery', query);

    expect(result).toBe('result-123');
  });
});
