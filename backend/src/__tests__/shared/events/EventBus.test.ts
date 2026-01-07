import 'reflect-metadata';
import { Container } from 'inversify';
import { EventBus } from '../../../shared/events/EventBus';
import { DomainEvent } from '../../../shared/events/DomainEvent';
import { IEventHandler } from '../../../shared/events/IEventHandler';

class TestEvent extends DomainEvent {
    constructor(public readonly payload: string) {
        super();
    }
    getEventName(): string {
        return 'TestEvent';
    }
}

class TestEventHandler implements IEventHandler<TestEvent> {
    public static handleMock = jest.fn();
    async handle(event: TestEvent): Promise<void> {
        TestEventHandler.handleMock(event);
    }
}

describe('EventBus', () => {
    let container: Container;
    let eventBus: EventBus;

    beforeEach(() => {
        container = new Container();
        container.bind('Container').toConstantValue(container);
        container.bind(EventBus).to(EventBus);

        // Bind Handler
        container.bind('EventHandler:TestEvent').to(TestEventHandler);

        eventBus = container.get(EventBus);
        TestEventHandler.handleMock.mockClear();
    });

    it('should dispatch event to registered handler', async () => {
        const event = new TestEvent('test-payload');
        await eventBus.publish(event);

        expect(TestEventHandler.handleMock).toHaveBeenCalledTimes(1);
        expect(TestEventHandler.handleMock).toHaveBeenCalledWith(event);
    });

    it('should dispatch to multiple handlers if registered', async () => {
        // Bind another handler for the same event
        class AnotherHandler implements IEventHandler<TestEvent> {
            public static handleMock = jest.fn();
            async handle(event: TestEvent): Promise<void> {
                AnotherHandler.handleMock(event);
            }
        }
        container.bind('EventHandler:TestEvent').to(AnotherHandler);

        const event = new TestEvent('multi-dispatch');
        await eventBus.publish(event);

        expect(TestEventHandler.handleMock).toHaveBeenCalledWith(event);
        expect(AnotherHandler.handleMock).toHaveBeenCalledWith(event);
    });

    it('should define getEventName', () => {
        const event = new TestEvent('foo');
        expect(event.getEventName()).toBe('TestEvent');
    });
});
