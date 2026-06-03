import { Controller, Get } from "@nestjs/common";

interface HealthResponse {
  status: "ok";
  uptime: number;
  timestamp: string;
}

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
