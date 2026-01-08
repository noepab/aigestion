import { injectable, inject, Container } from 'inversify';
import { ICommand } from './messages';
import { ICommandHandler } from './handlers';

@injectable()
export class CommandBus {
  constructor(@inject('Container') private container: Container) {}

  execute<TResult = void>(commandId: string, command: ICommand): Promise<TResult> {
    const handler = this.container.get<ICommandHandler<ICommand, TResult>>(commandId);
    return handler.handle(command);
  }
}
