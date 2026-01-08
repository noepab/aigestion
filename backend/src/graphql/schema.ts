import { exec } from 'child_process';
import {
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import os from 'os';
import { promisify } from 'util';

import { User } from '../models/User';
import { getCache, setCache } from '../utils/redis';

const execAsync = promisify(exec);

/**
 * GraphQL User Type
 */
export const UserType = new GraphQLObjectType({
  name: 'User',
  description: 'Representa un usuario del sistema',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'ID único del usuario',
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Email del usuario',
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Nombre completo',
    },
    createdAt: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Timestamp de creación',
    },
    updatedAt: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Timestamp de actualización',
    },
  }),
});

/**
 * GraphQL System Metrics Type
 */
export const SystemMetricsType = new GraphQLObjectType({
  name: 'SystemMetrics',
  description: 'Métricas de rendimiento del sistema',
  fields: () => ({
    cpu: { type: GraphQLFloat },
    memory: { type: GraphQLFloat },
    network: { type: GraphQLFloat },
    disk: { type: GraphQLFloat },
    uptime: { type: GraphQLFloat },
    platform: { type: GraphQLString },
    hostname: { type: GraphQLString },
    timestamp: { type: GraphQLFloat },
  }),
});

/**
 * GraphQL Docker Container Type
 */
export const DockerContainerType = new GraphQLObjectType({
  name: 'DockerContainer',
  description: 'Información de un contenedor Docker',
  fields: () => ({
    ID: { type: GraphQLID },
    Names: { type: GraphQLString },
    Image: { type: GraphQLString },
    State: { type: GraphQLString },
    Status: { type: GraphQLString },
    Ports: { type: GraphQLString },
  }),
});

/**
 * GraphQL Git Commit Type
 */
export const GitCommitType = new GraphQLObjectType({
  name: 'GitCommit',
  description: 'Información de un commit de Git',
  fields: () => ({
    hash: { type: GraphQLString },
    author: { type: GraphQLString },
    date: { type: GraphQLString },
    message: { type: GraphQLString },
  }),
});

/**
 * GraphQL Git Contributor Type
 */
export const GitContributorType = new GraphQLObjectType({
  name: 'GitContributor',
  description: 'Información de un colaborador del proyecto',
  fields: () => ({
    name: { type: GraphQLString },
    commits: { type: GraphQLInt },
  }),
});

/**
 * GraphQL Git Stats Type
 */
export const GitStatsType = new GraphQLObjectType({
  name: 'GitStats',
  description: 'Estadísticas generales del repositorio Git',
  fields: () => ({
    totalCommits: { type: GraphQLInt },
    contributors: { type: new GraphQLList(GitContributorType) },
  }),
});

/**
 * GraphQL Root Query
 */
export const RootQuery = new GraphQLObjectType({
  name: 'Query',
  description: 'Queries raíz disponibles',
  fields: {
    user: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_obj, args, context) => {
        // Resolver implementation - conectar a DB
        return context.dataloaders.userLoader.load(args.id);
      },
    },
    users: {
      type: new GraphQLNonNull(new GraphQLList(UserType)),
      args: {
        limit: { type: GraphQLString, defaultValue: '10' },
        offset: { type: GraphQLString, defaultValue: '0' },
      },
      resolve: async (_obj, args) => {
        const limit = parseInt(args.limit) || 10;
        const offset = parseInt(args.offset) || 0;
        return User.find().skip(offset).limit(limit);
      },
    },
    systemMetrics: {
      type: SystemMetricsType,
      resolve: async () => {
        try {
          const cacheKey = 'system:metrics';
          const cachedData = await getCache(cacheKey);

          if (cachedData) {
            return cachedData;
          }

          const cpus = os.cpus();
          const totalMem = os.totalmem();
          const freeMem = os.freemem();
          const usedMem = totalMem - freeMem;

          const cpuUsage =
            cpus.reduce((acc, cpu) => {
              const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
              const idle = cpu.times.idle;
              return acc + ((total - idle) / total) * 100;
            }, 0) / cpus.length;

          const metrics = {
            cpu: parseFloat(cpuUsage.toFixed(2)),
            memory: parseFloat(((usedMem / totalMem) * 100).toFixed(2)),
            network: Math.random() * 100, // Placeholder
            disk: 0, // Placeholder
            uptime: os.uptime(),
            platform: os.platform(),
            hostname: os.hostname(),
            timestamp: Date.now(),
          };

          await setCache(cacheKey, JSON.stringify(metrics), 2);
          return metrics;
        } catch (error) {
          console.error('GraphQL SystemMetrics Error:', error);
          throw new Error('Failed to fetch system metrics');
        }
      },
    },
    containers: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DockerContainerType))),
      resolve: async () => {
        try {
          const cacheKey = 'docker:containers';
          const cachedData = await getCache(cacheKey);

          if (cachedData) {
            return cachedData;
          }

          const { stdout } = await execAsync('docker ps -a --format "{{json .}}"');
          const containers = stdout
            .trim()
            .split('\n')
            .filter(line => line)
            .map(line => {
              try {
                return JSON.parse(line);
              } catch {
                return null;
              }
            })
            .filter(Boolean);

          await setCache(cacheKey, JSON.stringify(containers), 5);
          return containers;
        } catch (error) {
          console.error('GraphQL DockerContainers Error:', error);
          return [];
        }
      },
    },
    recentCommits: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GitCommitType))),
      args: {
        limit: { type: GraphQLInt, defaultValue: 10 },
      },
      resolve: async (_obj, args) => {
        try {
          const { stdout } = await execAsync(
            `git log -${args.limit} --pretty=format:"%H|%an|%ai|%s"`,
          );

          return stdout
            .trim()
            .split('\n')
            .filter(line => line)
            .map(line => {
              const [hash, author, date, message] = line.split('|');
              return { hash, author, date, message };
            });
        } catch (error: any) {
          console.error('GraphQL recentCommits Error:', error);
          if (error.message?.includes('not a git repository')) {
            return [
              {
                hash: 'demo',
                author: 'Dev',
                date: new Date().toISOString(),
                message: 'Demo commit',
              },
            ];
          }
          return [];
        }
      },
    },
    gitBranches: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
      resolve: async () => {
        try {
          const { stdout } = await execAsync('git branch -a');
          return stdout
            .trim()
            .split('\n')
            .map(branch => branch.trim().replace('* ', ''))
            .filter(branch => branch);
        } catch (error) {
          console.error('GraphQL gitBranches Error:', error);
          return ['main'];
        }
      },
    },
    gitStats: {
      type: GitStatsType,
      resolve: async () => {
        try {
          const { stdout: commitCount } = await execAsync('git rev-list --count HEAD');
          const { stdout: contributorsRaw } = await execAsync('git shortlog -sn HEAD');

          const contributors = contributorsRaw
            .trim()
            .split('\n')
            .map(line => {
              const [commits, ...nameParts] = line.trim().split(/\s+/);
              return {
                name: nameParts.join(' '),
                commits: parseInt(commits),
              };
            });

          return {
            totalCommits: parseInt(commitCount.trim()),
            contributors,
          };
        } catch (error) {
          console.error('GraphQL gitStats Error:', error);
          return { totalCommits: 0, contributors: [] };
        }
      },
    },
  },
});

/**
 * GraphQL Mutations
 */
export const RootMutation = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Mutaciones disponibles',
  fields: {
    createUser: {
      type: UserType,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        name: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_obj, args) => {
        return User.create({
          email: args.email,
          name: args.name,
          password: 'AIGestion123!', // Default password for now
          loginAttempts: 0,
        });
      },
    },
  },
});

/**
 * GraphQL Schema
 */
export const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: RootMutation,
});
