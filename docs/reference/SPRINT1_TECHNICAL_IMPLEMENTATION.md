# 🔧 Sprint 1 Implementation Plan - Backend Technical Deep-Dive

**Target:** Ejecutable, paso a paso
**Fecha Inicio:** 16 Diciembre 2025 (kickoff)
**Fecha Ejecución Sprint:** 16-31 Enero 2026

---

## Fase 0: Preparación Inmediata (Hoy - Dic 16)

### 0.1 Setup del Ambiente

```bash
# Clone/update repository
cd ~/NEXUS V1
git fetch origin
git checkout -b feat/sprint1-backend origin/main

# Install latest dependencies
pnpm install
pnpm run build

# Database backup
pg_dump NEXUS V1_db > backups/NEXUS V1_db_2025-12-16.sql

# Start infrastructure
docker-compose -f docker-compose.dev.yml up -d postgres redis rabbitmq

# Verify connectivity
pnpm exec tsc --noEmit  # TypeScript check
pnpm run lint           # Linting check
```

### 0.2 Feature Branch & Documentation

```bash
# Create dedicated branch
git checkout -b feat/sprint1-api-refactor
git push origin feat/sprint1-api-refactor

# Document baseline metrics
curl -s http://localhost:3000/metrics | grep api_duration_seconds
# Capture in: docs/SPRINT1_BASELINE_METRICS.md
```

### 0.3 Architecture Decision Record (ADR)

Crear `docs/adr/001-api-versioning.md`:

```markdown
# ADR 001: API Versioning Strategy

## Decisión
Usar URL versioning (`/api/v1/`, `/api/v2/`) en lugar de header versioning

## Rationale
- Más claro para desarrollo
- Facilita migration gradual
- Compatible con OpenAPI/Swagger

## Alternativas Consideradas
- Header versioning (rechazada: menos visible)
- Accept header (rechazada: requiere docs)
- Subdomain (rechazada: infraestructura compleja)
```

---

## Task 1.1: REST API Refactoring (Semana 1)

### Paso 1.1.1: Baseline Current APIs

```bash
# Documentar APIs actuales
curl -s http://localhost:3000/api/docs > docs/CURRENT_APIS.json

# Listar todos endpoints
grep -r "@Get\|@Post\|@Put\|@Delete" backend/src --include="*.ts" | \
  awk -F: '{print $1, $2}' | sort | uniq > docs/ENDPOINT_INVENTORY.txt
```

**Output esperado:**

```
backend/src/users/users.controller.ts @Get users/:id
backend/src/users/users.controller.ts @Post users
backend/src/products/products.controller.ts @Get products
...
```

### Paso 1.1.2: Crear Controlador Base Estándar

**Archivo:** `backend/src/common/controllers/base.controller.ts`

```typescript
import { Controller, Get, Post, Body, Param, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

export class BaseController {
  /**
   * Respuesta estándar para todos los endpoints
   */
  protected buildResponse<T>(data: T, status: number = 200) {
    return {
      status,
      data,
      timestamp: new Date().toISOString(),
      requestId: this.getRequestId(),
    };
  }

  /**
   * Error estándar
   */
  protected buildError(message: string, code: string, statusCode: number = 400) {
    return {
      status: statusCode,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(),
      },
    };
  }

  private getRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Paso 1.1.3: Refactor Endpoints a Naming Convención Estándar

**Antes:**

```typescript
@Controller('api/users')
export class UserController {
  @Get(':user_id')
  getUser(@Param('user_id') id: string) { ... }

  @Post('create-user')
  createUserEndpoint(@Body() dto: CreateUserDto) { ... }
}
```

**Después:**

```typescript
@Controller('api/v1/users')
@ApiTags('Users')
export class UsersController extends BaseController {
  @Get(':userId')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved' })
  getUser(@Param('userId') userId: string) {
    return this.buildResponse(await this.userService.findById(userId));
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  createUser(@Body(ValidationPipe) dto: CreateUserDto) {
    return this.buildResponse(await this.userService.create(dto), 201);
  }
}
```

**Reglas Aplicadas:**

- ✅ Rutas en kebab-case: `/users`, `/orders`, no `/user_list`
- ✅ Parámetros en camelCase: `:userId`, no `:user_id`
- ✅ Métodos simple: `GET /users/:userId`, no `/users/:userId/get`
- ✅ Versionado explícito: `/api/v1/`, `/api/v2/`
- ✅ Documentación Swagger automática

### Paso 1.1.4: Centralizar Error Handling

**Archivo:** `backend/src/common/filters/exception.filter.ts`

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse['message'] || message;
        errorCode = exceptionResponse['error'] || errorCode;
      }
    }

    response.status(status).json({
      status,
      error: {
        code: errorCode,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
```

**Integración en main.ts:**

```typescript
import { NestFactory } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(3000);
}

bootstrap();
```

### Paso 1.1.5: Input Validation con Decorators

**Archivo:** `backend/src/users/dto/create-user.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
```

**Uso en Controller:**

```typescript
@Post()
@UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
async createUser(@Body() dto: CreateUserDto) {
  return await this.userService.create(dto);
}
```

### Paso 1.1.6: Performance Testing

```bash
# Instalar k6 si no existe
brew install k6  # or choco install k6

# Crear test file: backend/tests/load/api-baseline.js
cat > backend/tests/load/api-baseline.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3000/api/v1/users/1');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
EOF

# Ejecutar baseline
k6 run backend/tests/load/api-baseline.js

# Capturar métricas
# http_reqs: X requests
# http_req_duration: mean=50ms, p95=180ms
```

**Registrar en:** `docs/SPRINT1_TASK1_METRICS.md`

---

## Task 1.2: GraphQL Implementation (Semana 1)

### Paso 1.2.1: Setup Apollo Server

```bash
pnpm add @apollo/server graphql-tag graphql
pnpm add @nestjs/graphql @apollo/server
```

**Archivo:** `backend/src/graphql/graphql.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      playground: process.env.NODE_ENV === 'development',
      introspection: true,
      context: ({ req }) => ({ req }),
    }),
  ],
})
export class GraphqlModuleConfig {}
```

### Paso 1.2.2: Define GraphQL Schema

**Archivo:** `backend/src/graphql/schemas/user.schema.ts`

```typescript
import { ObjectType, Field, ID, Resolver, Query, Arg, Mutation } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field(() => Date)
  createdAt: Date;
}

@Resolver(() => User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  async user(@Arg('id', () => ID) id: string) {
    // Resolver implementation
  }

  @Query(() => [User])
  async users(@Arg('limit', () => Int, { defaultValue: 10 }) limit: number) {
    // Resolver implementation
  }

  @Mutation(() => User)
  async createUser(
    @Arg('email') email: string,
    @Arg('name') name: string,
  ) {
    // Resolver implementation
  }
}
```

### Paso 1.2.3: DataLoader para Batch Queries

```bash
pnpm add dataloader
```

**Archivo:** `backend/src/graphql/loaders/user.loader.ts`

```typescript
import DataLoader from 'dataloader';
import { Injectable } from '@nestjs/common';
import { UserService } from '../../users/users.service';

@Injectable()
export class UserLoader {
  constructor(private userService: UserService) {}

  createUserLoader() {
    return new DataLoader(async (userIds: string[]) => {
      const users = await this.userService.findByIds(userIds);
      // Retornar en el mismo orden que userIds
      return userIds.map((id) => users.find((u) => u.id === id));
    });
  }
}
```

### Paso 1.2.4: GraphQL Query Performance Testing

```bash
# Test query: queries/user.graphql
cat > backend/tests/graphql/queries/user.graphql << 'EOF'
query GetUser($id: ID!) {
  user(id: $id) {
    id
    email
    name
    createdAt
  }
}
EOF

# Run con Lighthouse
pnpm add apollo-client graphql-request

# Script: backend/tests/graphql/perf-test.ts
import { request, gql } from 'graphql-request';

const QUERY = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      name
    }
  }
`;

const start = Date.now();
const result = await request('http://localhost:3000/graphql', QUERY, { id: '1' });
console.log(`Response time: ${Date.now() - start}ms`);
```

---

## Task 1.3: Database Query Optimization (Semana 1)

### Paso 1.3.1: Query Audit con EXPLAIN ANALYZE

```sql
-- Conectar a PostgreSQL
psql NEXUS V1_db

-- Habilitar timing
\timing

-- Auditar queries lentes
EXPLAIN ANALYZE
SELECT u.id, u.email, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id;

-- Output esperado:
-- Seq Scan on users u  (cost=0.00..1000.00 rows=100)
-- Hash Join (cost=500.00..1500.00)
-- Total runtime: 250ms (LENTO - necesita índice)
```

### Paso 1.3.2: Crear Índices Faltantes

```sql
-- Crear índices para queries frecuentes
CREATE INDEX CONCURRENTLY idx_users_created_at ON users (created_at DESC);
CREATE INDEX CONCURRENTLY idx_users_email_lower ON users (LOWER(email));
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders (user_id);
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders (created_at DESC);

-- Compound index para queries comunes
CREATE INDEX CONCURRENTLY idx_orders_user_created
ON orders (user_id, created_at DESC);

-- Análisis post-índice
ANALYZE;
```

### Paso 1.3.3: Connection Pooling con PgBouncer

```bash
# Install PgBouncer
brew install pgbouncer  # macOS
apt-get install pgbouncer  # Linux

# Configurar: /etc/pgbouncer/pgbouncer.ini
[databases]
NEXUS V1_db = host=localhost port=5432 dbname=NEXUS V1_db

[pgbouncer]
pool_mode = transaction
min_pool_size = 10
max_pool_size = 100
default_pool_size = 25
timeout = 600
idle_in_transaction_session_timeout = 600

# Start PgBouncer
pgbouncer /etc/pgbouncer/pgbouncer.ini -d

# Update app connection string
DATABASE_URL=postgresql://user:pass@localhost:6432/NEXUS V1_db
```

### Paso 1.3.4: Query Caching con Redis

**Archivo:** `backend/src/database/cache.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';

@Injectable()
export class QueryCacheService {
  constructor(private redis: RedisService) {}

  async getCachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = 3600,
  ): Promise<T> {
    const cached = await this.redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const result = await queryFn();
    await this.redis.setex(key, ttl, JSON.stringify(result));
    return result;
  }

  async invalidateCache(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

**Uso en Service:**

```typescript
@Injectable()
export class UsersService {
  constructor(
    private cache: QueryCacheService,
    private db: Database,
  ) {}

  async getUserById(id: string) {
    return this.cache.getCachedQuery(
      `user:${id}`,
      () => this.db.users.findById(id),
      3600, // 1 hora
    );
  }

  async updateUser(id: string, data: any) {
    const result = await this.db.users.update(id, data);
    await this.cache.invalidateCache(`user:${id}`);
    return result;
  }
}
```

### Paso 1.3.5: N+1 Query Detection

```bash
pnpm add typeorm-query-performance-issues
```

**Habilitar en desarrollo:**

```typescript
if (process.env.NODE_ENV === 'development') {
  AppDataSource.subscribers.push(QueryPerformanceSubscriber);
}
```

**Capturar logs:**

```bash
# Run API y buscar warnings
pnpm run start:dev 2>&1 | grep "N+1 Query"

# Output esperado:
# ⚠️ N+1 Query detected: SELECT * FROM orders
#    Called 100 times in single request
#    Use DataLoader or .leftJoinAndSelect()
```

---

## Task 1.4: Event Bus Implementation (Semana 1-2)

### Paso 1.4.1: Setup RabbitMQ o Kafka

```bash
# Via Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 \
  rabbitmq:3-management

# O Kafka
docker run -d --name kafka -p 9092:9092 \
  confluentinc/cp-kafka:7.5.0
```

### Paso 1.4.2: Event Publisher Service

**Archivo:** `backend/src/events/event-publisher.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AmqpConnection } from '@nestjs-modules/rabbitmq';

@Injectable()
export class EventPublisher {
  constructor(
    private amqp: AmqpConnection,
    private eventEmitter: EventEmitter2,
  ) {}

  async publishEvent<T>(eventType: string, payload: T) {
    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Publish to RabbitMQ for external consumers
    await this.amqp.publish(
      'events',
      `event.${eventType}`,
      Buffer.from(JSON.stringify(event)),
    );

    // Emit locally for immediate handlers
    this.eventEmitter.emit(`event.${eventType}`, event);
  }
}
```

### Paso 1.4.3: Event Consumers

**Archivo:** `backend/src/events/consumers/user-created.consumer.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RabbitSubscribe } from '@nestjs-modules/rabbitmq';

@Injectable()
export class UserCreatedConsumer {
  @OnEvent('event.user.created')
  async handleUserCreated(event: any) {
    console.log('User created:', event.payload.userId);

    // Send welcome email
    // Update analytics
    // Trigger notifications
  }

  @RabbitSubscribe({
    exchange: 'events',
    routingKey: 'event.user.created',
    queue: 'user-created-queue',
  })
  async consumeFromRabbitMQ(msg: any) {
    const event = JSON.parse(msg.content.toString());
    await this.handleUserCreated(event);
  }
}
```

### Paso 1.4.4: Dead-Letter Queue Handling

```typescript
await this.amqp.channel.assertQueue('user-created-queue', {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'events-dlx',
    'x-dead-letter-routing-key': 'dlq.user-created',
    'x-message-ttl': 3600000, // 1 hora
  },
});
```

---

## Task 1.5: Service Decoupling (Semana 2)

### Paso 1.5.1: Identificar Service Boundaries

```markdown
# SERVICES TO DECOUPLE

## Antes (Monolítico)
```

User Service
├─ create user
├─ send email (sync)
├─ update analytics (sync)
├─ create profile (sync)
└─ send notification (sync)

```

## Después (Event-Driven)
```

User Service
├─ create user
└─ publish UserCreated event

Email Service (consumer)
├─ listen UserCreated
└─ send email (async)

Analytics Service (consumer)
├─ listen UserCreated
└─ update analytics (async)

Profile Service (consumer)
├─ listen UserCreated
└─ create profile (async)

```
```

### Paso 1.5.2: Refactor a Async

**Antes:**

```typescript
@Injectable()
export class UserService {
  constructor(
    private db: Database,
    private emailService: EmailService,
    private analyticsService: AnalyticsService,
  ) {}

  async createUser(dto: CreateUserDto) {
    const user = await this.db.users.create(dto);

    // Problemas: bloqueante, si falla email falla todo
    await this.emailService.sendWelcome(user.email);
    await this.analyticsService.trackUserCreated(user.id);

    return user;
  }
}
```

**Después:**

```typescript
@Injectable()
export class UserService {
  constructor(
    private db: Database,
    private publisher: EventPublisher,
  ) {}

  async createUser(dto: CreateUserDto) {
    const user = await this.db.users.create(dto);

    // Publicar evento - retorna inmediatamente
    await this.publisher.publishEvent('user.created', {
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });

    return user;
  }
}
```

### Paso 1.5.3: Saga Pattern para Transacciones Distribuidas

```typescript
// Escenario: Crear orden requiere validación de inventario y pago

@Injectable()
export class CreateOrderSaga {
  constructor(private publisher: EventPublisher) {}

  async execute(command: CreateOrderCommand) {
    try {
      // Paso 1: Reservar inventario
      await this.publisher.publishEvent('inventory.reserve', {
        orderId: command.orderId,
        items: command.items,
      });

      // Paso 2: Procesar pago (esperar confirmación)
      await this.waitForEvent('payment.succeeded', 5000);

      // Paso 3: Confirmar orden
      await this.publisher.publishEvent('order.confirmed', {
        orderId: command.orderId,
      });
    } catch (error) {
      // Compensación: deshacer cambios
      await this.publisher.publishEvent('inventory.release', {
        orderId: command.orderId,
      });
      throw error;
    }
  }
}
```

---

## Task 1.6: Distributed Cache Layer (Semana 2)

### Paso 1.6.1: Redis Cluster Setup

```bash
# Docker compose: docker-compose.cache.yml
version: '3.8'
services:
  redis-1:
    image: redis:7-alpine
    command: redis-server --port 6379 --cluster-enabled yes
    ports:
      - "6379:6379"

  redis-2:
    image: redis:7-alpine
    command: redis-server --port 6380 --cluster-enabled yes
    ports:
      - "6380:6380"

  redis-3:
    image: redis:7-alpine
    command: redis-server --port 6381 --cluster-enabled yes
    ports:
      - "6381:6381"
```

```bash
docker-compose -f docker-compose.cache.yml up -d
redis-cli --cluster create localhost:6379 localhost:6380 localhost:6381
```

### Paso 1.6.2: Cache Invalidation Strategy

```typescript
@Injectable()
export class CacheInvalidationService {
  constructor(
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
  ) {
    this.setupInvalidationListeners();
  }

  private setupInvalidationListeners() {
    // Invalidar cache cuando datos cambien
    this.eventEmitter.on('user.updated', (event) => {
      this.redis.del(`user:${event.userId}`);
      this.redis.del('users:*'); // Invalidar listas
    });

    this.eventEmitter.on('inventory.changed', (event) => {
      this.redis.del(`product:${event.productId}`);
    });
  }
}
```

### Paso 1.6.3: Cache Warmup

```typescript
@Injectable()
export class CacheWarmupService implements OnModuleInit {
  constructor(private cache: QueryCacheService) {}

  async onModuleInit() {
    if (process.env.WARMUP_CACHE === 'true') {
      console.log('Warming up cache...');

      // Precarga datos frecuentes
      await this.cache.getCachedQuery('products:popular', () =>
        this.db.products.findPopular(100),
      );

      console.log('Cache warmed up');
    }
  }
}
```

---

## 🎬 Ejecución Diaria

### Daily Standup (30 min)

```bash
# Revisar progreso
git log --oneline -10

# Check metrics
curl http://localhost:3000/metrics

# Ver PRs abiertas
gh pr list --state open
```

### Code Review Checklist

- [ ] Tests pasan (unit + integration)
- [ ] Coverage >85%
- [ ] Performance metrics met (<200ms p95)
- [ ] Documentación Swagger actualizada
- [ ] No breaking changes sin migration path

### Friday Sprint Review

```bash
# Demo de features
pnpm run demo

# Benchmark vs baseline
pnpm run benchmark

# Generar report
pnpm run sprint-report > sprint1_results.md
```

---

## 📊 Success Criteria Checklist

**Sprint 1 Completado cuando:**

- [ ] REST APIs refactored a v1 standard (12h)
- [ ] GraphQL endpoint functional con schema (16h)
- [ ] Database indexed y connection pooled (14h)
- [ ] Event bus live con consumers (18h)
- [ ] Services decoupled con sagas (20h)
- [ ] Redis cluster con invalidation (10h)
- [ ] API p95 response: <200ms
- [ ] Cache hit rate: >70%
- [ ] Test coverage: >85%
- [ ] Zero production incidents
- [ ] Todos tests pasando
- [ ] Code review approved por 2 developers

---

**Último Update:** 2025-12-16 20:58
**Responsable:** Alejandro
**Status:** 🚀 KICKOFF - READY TO EXECUTE

