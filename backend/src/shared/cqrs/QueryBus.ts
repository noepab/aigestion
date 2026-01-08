import { injectable, inject, Container } from 'inversify';
import { IQuery } from './messages';
import { IQueryHandler } from './handlers';

@injectable()
export class QueryBus {
  constructor(@inject('Container') private container: Container) {}

  execute<TResult = any>(queryId: string, query: IQuery): Promise<TResult> {
    const handler = this.container.get<IQueryHandler<IQuery, TResult>>(queryId);
    return handler.handle(query);
  }
}
