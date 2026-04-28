import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { appConfig } from "../config/app.config.js";

type HealthResponse = {
  status: "ok";
  service: "api";
  environment: string;
  timestamp: string;
};

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOkResponse({ description: "API service health status." })
  getHealth(): HealthResponse {
    return {
      status: "ok",
      service: "api",
      environment: appConfig.nodeEnv,
      timestamp: new Date().toISOString()
    };
  }
}
