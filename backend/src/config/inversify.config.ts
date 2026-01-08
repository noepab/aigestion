import 'reflect-metadata';

import { Container } from 'inversify';

import { DockerService } from '../infrastructure/docker/DockerService';
import { TwoFactorService } from '../services/twoFactor.service';
import { RegisterUserUseCase } from '../application/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '../application/usecases/LoginUserUseCase';
import { IUserRepository, UserRepository } from '../infrastructure/repository/UserRepository';
import { AIService } from '../services/ai.service';
import { AlertingService } from '../services/alerting.service';
import { AnalyticsService } from '../services/analytics.service';
import { AuthService } from '../services/auth.service';
import { BackupService } from '../services/backup.service';
import { BackupSchedulerService } from '../services/backup-scheduler.service';
import { CredentialManagerService } from '../services/credential-manager.service';
import { EmailService } from '../services/email.service';
import { GoogleDriveService } from '../services/google/google-drive.service';
import { GoogleSecretManagerService } from '../services/google/secret-manager.service';
import { HistoryService } from '../services/history.service';
import { InstagramService } from '../services/instagram.service';
import { LinkedInService } from '../services/linkedin.service';
import { RagService } from '../services/rag.service';
import { SearchService } from '../services/search.service';
import { StripeService } from '../services/stripe.service';
import { SystemMetricsService } from '../services/system-metrics.service';
import { TelegramService } from '../services/telegram.service';
import { TikTokService } from '../services/tiktok.service';
import { UserService } from '../services/user.service';
import { UsageService } from '../services/usage.service';
import { XService } from '../services/x.service';
import { TYPES } from '../types';

const container = new Container();

container.bind<HistoryService>(TYPES.HistoryService).to(HistoryService).inSingletonScope();
container.bind<TelegramService>(TYPES.TelegramService).to(TelegramService).inSingletonScope();
container
  .bind<SystemMetricsService>(TYPES.SystemMetricsService)
  .to(SystemMetricsService)
  .inSingletonScope();
container.bind<AlertingService>(TYPES.AlertingService).to(AlertingService).inSingletonScope();
container
  .bind<GoogleSecretManagerService>(TYPES.GoogleSecretManagerService)
  .to(GoogleSecretManagerService)
  .inSingletonScope();
container
  .bind<CredentialManagerService>(TYPES.CredentialManagerService)
  .to(CredentialManagerService)
  .inSingletonScope();
container.bind('Container').toConstantValue(container);

import { CommandBus } from '../shared/cqrs/CommandBus';
import { QueryBus } from '../shared/cqrs/QueryBus';
import { EventBus } from '../infrastructure/eventbus/EventBus';
import { Enable2FAUseCase } from '../application/usecases/Enable2FAUseCase';
import { Verify2FAUseCase } from '../application/usecases/Verify2FAUseCase';

container.bind<TwoFactorService>(TYPES.TwoFactorService).to(TwoFactorService).inSingletonScope();
container.bind<Enable2FAUseCase>(TYPES.Enable2FAUseCase).to(Enable2FAUseCase).inSingletonScope();
container.bind<Verify2FAUseCase>(TYPES.Verify2FAUseCase).to(Verify2FAUseCase).inSingletonScope();

container.bind<CommandBus>(TYPES.CommandBus).to(CommandBus).inSingletonScope();
container.bind<QueryBus>(TYPES.QueryBus).to(QueryBus).inSingletonScope();
container.bind<EventBus>(TYPES.EventBus).to(EventBus).inSingletonScope();
container.bind<AIService>(TYPES.AIService).to(AIService).inSingletonScope();
container.bind<AnalyticsService>(TYPES.AnalyticsService).to(AnalyticsService).inSingletonScope();
container.bind<AuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
container.bind<DockerService>(TYPES.DockerService).to(DockerService).inSingletonScope();
container.bind<EmailService>(TYPES.EmailService).to(EmailService).inSingletonScope();
container.bind<InstagramService>(TYPES.InstagramService).to(InstagramService).inSingletonScope();
container.bind<LinkedInService>(TYPES.LinkedInService).to(LinkedInService).inSingletonScope();
container.bind<RagService>(TYPES.RagService).to(RagService).inSingletonScope();
container.bind<StripeService>(TYPES.StripeService).to(StripeService).inSingletonScope();
container.bind<TikTokService>(TYPES.TikTokService).to(TikTokService).inSingletonScope();
container.bind<XService>(TYPES.XService).to(XService).inSingletonScope();
container.bind<SearchService>(TYPES.SearchService).to(SearchService).inSingletonScope();
container.bind<UsageService>(TYPES.UsageService).to(UsageService).inSingletonScope();
container.bind<GoogleDriveService>(GoogleDriveService).toSelf().inSingletonScope();
container.bind<BackupService>(TYPES.BackupService).to(BackupService).inSingletonScope();
container
  .bind<BackupSchedulerService>(TYPES.BackupSchedulerService)
  .to(BackupSchedulerService)
  .inSingletonScope();
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
container
  .bind<RegisterUserUseCase>(TYPES.RegisterUserUseCase)
  .to(RegisterUserUseCase)
  .inSingletonScope();
container.bind<LoginUserUseCase>(TYPES.LoginUserUseCase).to(LoginUserUseCase).inSingletonScope();
container.bind<UserService>(TYPES.UserService).to(UserService).inSingletonScope();

import { JobQueue } from '../infrastructure/jobs/JobQueue';
container.bind<JobQueue>(TYPES.JobQueue).to(JobQueue).inSingletonScope();

export { container, TYPES };
