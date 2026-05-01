import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { appConfig } from "../config/app.config.js";
import { MessagingService } from "./messaging.service.js";
import { RABBITMQ_CLIENT } from "./messaging.tokens.js";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: RABBITMQ_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [appConfig.rabbitmqUrl],
          queue: "flowpilot.api.events",
          queueOptions: {
            durable: true
          }
        }
      }
    ])
  ],
  providers: [MessagingService],
  exports: [ClientsModule, MessagingService]
})
export class MessagingModule {}
