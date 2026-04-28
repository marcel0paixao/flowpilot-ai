import { Module } from "@nestjs/common";

import { ConfigModule } from "./config/config.module.js";
import { HealthModule } from "./health/health.module.js";
import { MessagingModule } from "./messaging/messaging.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [ConfigModule, HealthModule, MessagingModule, PrismaModule]
})
export class AppModule {}
