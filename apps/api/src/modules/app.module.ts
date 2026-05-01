import { Module } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module.js";
import { ConfigModule } from "./config/config.module.js";
import { HealthModule } from "./health/health.module.js";
import { MessagingModule } from "./messaging/messaging.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { WorkflowsModule } from "./workflows/workflows.module.js";
import { WorkspacesModule } from "./workspaces/workspaces.module.js";

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    HealthModule,
    MessagingModule,
    PrismaModule,
    WorkflowsModule,
    WorkspacesModule
  ]
})
export class AppModule {}
