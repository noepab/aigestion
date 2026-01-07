# Repository Layer

This folder contains a minimal **generic repository** implementation used throughout the backend.

## BaseRepository
- Provides an in‑memory CRUD API (`create`, `findById`, `findOne`, `findAll`, `update`, `delete`).
- Designed to be extended for concrete models.

## UserRepository
- Extends `BaseRepository<IUser>` and adds `findByEmail(email)`.
- Automatically seeds a default test user for the in‑memory store.

## Extending the Pattern
1. Create a new interface that extends `BaseRepository<T>` for the entity you need.
2. Implement a class that extends `BaseRepository<T>` and add any custom queries.
3. Bind the new repository in `src/config/inversify.config.ts` using `container.bind<IYourRepository>(TYPES.YourRepository).to(YourRepository)`.
4. Inject the repository into services via `@inject(TYPES.YourRepository)`.

The repository layer decouples business logic from the persistence mechanism, making it easy to swap Mongoose for another data source in the future.
