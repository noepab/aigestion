import { IEvent } from './IEvent';

export abstract class DomainEvent implements IEvent {
  public readonly dateTimeOccurred: Date;

  constructor(dateTimeOccurred: Date = new Date()) {
    this.dateTimeOccurred = dateTimeOccurred;
  }

  abstract getEventName(): string;
}
