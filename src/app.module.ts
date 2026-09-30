import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { createFormatError } from './common/graphql/format-error.js';
import { type Env, validateEnv } from './config/env.schema.js';
import { ExperienceModule } from './experience/experience.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfileModule } from './profile/profile.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const isProduction =
          config.get('NODE_ENV', { infer: true }) === 'production';

        return {
          autoSchemaFile: isProduction ? true : 'schema.gql',
          sortSchema: true,
          playground: false,
          introspection: true,
          plugins: [ApolloServerPluginLandingPageLocalDefault()],
          formatError: createFormatError(isProduction),
        };
      },
    }),
    PrismaModule,
    ProfileModule,
    ExperienceModule,
  ],
})
export class AppModule {}
