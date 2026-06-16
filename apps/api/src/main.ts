import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { join } from "path";

import { AppModule } from "./app.module";
import type { Environment } from "./config/environment";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService<Environment, true>);

  app.setGlobalPrefix("api");
  app.useBodyParser("json", { limit: "7mb" });
  app.use(helmet());
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads/",
  });
  app.enableCors({
    credentials: true,
    origin: configService.get("WEB_ORIGIN", { infer: true }),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(configService.get("API_PORT", { infer: true }));
}

void bootstrap();
