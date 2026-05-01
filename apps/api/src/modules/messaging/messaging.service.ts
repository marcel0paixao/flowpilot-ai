import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { type FlowPilotMessage, type FlowPilotRoutingKey } from "@flowpilot/contracts";
import { lastValueFrom } from "rxjs";

import { RABBITMQ_CLIENT } from "./messaging.tokens.js";

@Injectable()
export class MessagingService {
  constructor(@Inject(RABBITMQ_CLIENT) private readonly client: ClientProxy) {}

  async publishEvent<TMessage extends FlowPilotMessage>(
    routingKey: FlowPilotRoutingKey,
    message: TMessage
  ): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    await lastValueFrom(this.client.emit(routingKey, message));
  }
}
