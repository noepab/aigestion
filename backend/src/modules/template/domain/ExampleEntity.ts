export class ExampleEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly createdAt: Date,
  ) {}

  updateName(newName: string): void {
    if (newName.length < 3) {
      throw new Error('Name must be at least 3 characters long');
    }
    this.name = newName;
  }
}
