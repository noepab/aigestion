import 'reflect-metadata';
import { Container } from 'inversify';
import { CommandBus } from '../../../shared/cqrs/CommandBus';
import { ICommand } from '../../../shared/cqrs/messages';
import { ICommandHandler } from '../../../shared/cqrs/handlers';

class TestCommand implements ICommand {
  constructor(public readonly payload: string) { }
}

class TestCommandHandler implements ICommandHandler<TestCommand> {
  async handle(command: TestCommand): Promise<void> {
    // handled
  }
}

describe('CommandBus', () => {
  let container: Container;
  let commandBus: CommandBus;

  beforeEach(() => {
    container = new Container();
    container.bind('Container').toConstantValue(container);
    container.bind(CommandBus).to(CommandBus);
    container.bind('TestCommand').to(TestCommandHandler).inSingletonScope();
    commandBus = container.get(CommandBus);
  });

  it('should dispatch command to the correct handler', async () => {
    const handler = container.get<TestCommandHandler>('TestCommand');
    const spy = jest.spyOn(handler, 'handle');
    const command = new TestCommand('test');

    await commandBus.execute('TestCommand', command);

    expect(spy).toHaveBeenCalledWith(command);
  });
});
