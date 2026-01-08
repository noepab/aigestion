import { injectable } from 'inversify';
import { IEvent, IEventHandler } from '../../domain/events';

@injectable()
export class EventBus {
  private handlers = new Map<string, IEventHandler<IEvent>[]>();

  public subscribe<T extends IEvent>(eventName: string, handler: IEventHandler<T>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    // Cast to generic IEvent handler for storage
    this.handlers.get(eventName)!.push(handler as IEventHandler<IEvent>);
  }

  public async publish<T extends IEvent>(event: T): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this.handlers.get(eventName) ?? [];
    await Promise.all(handlers.map(h => h.handle(event)));
  }
}
