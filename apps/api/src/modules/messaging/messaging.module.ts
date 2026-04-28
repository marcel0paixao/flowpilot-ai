import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { appConfig } from "../config/app.config.js";

export const RABBITMQ_CLIENT = Symbol("RABBITMQ_CLIENT");

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
  exports: [ClientsModule]
})
export class MessagingModule {}
