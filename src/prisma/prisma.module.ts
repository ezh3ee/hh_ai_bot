import { Module } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';
import { ConfigType } from '@nestjs/config';
import mainConfig from '../config/main.config';

@Module({
  providers: [
    {
      provide: 'PRISMA_CLIENT',
      inject: [mainConfig.KEY],
      useFactory: (config: ConfigType<typeof mainConfig>) => {
        const adapter = new PrismaBetterSqlite3({
          url: config.DATABASE_URL,
        });
        return new PrismaClient({ adapter });
      },
    },
  ],
  exports: ['PRISMA_CLIENT'],
})
export class PrismaModule {}
