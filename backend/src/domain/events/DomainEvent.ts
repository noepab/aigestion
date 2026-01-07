export interface IEvent {}

export abstract class DomainEvent implements IEvent {
  public readonly occurredAt: Date = new Date();
}
