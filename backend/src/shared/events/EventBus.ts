import { injectable, inject, Container } from 'inversify';
import { IEvent } from './IEvent';
import { IEventHandler } from './IEventHandler';

@injectable()
export class EventBus {
  constructor(@inject('Container') private container: Container) {}

  async publish(event: IEvent): Promise<void> {
    const eventName = event.getEventName();
    const handlerIdentifier = `EventHandler:${eventName}`;

    if (this.container.isBound(handlerIdentifier)) {
      const handlers = this.container.getAll<IEventHandler<IEvent>>(handlerIdentifier);
      await Promise.all(handlers.map(handler => handler.handle(event)));
    }
  }
}
