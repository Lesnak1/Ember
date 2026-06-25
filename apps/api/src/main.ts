import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, "../../../.env") });

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Disable powered-by header for security
  const expressApp = app.getHttpAdapter().getInstance();
  if (typeof expressApp.disable === "function") {
    expressApp.disable("x-powered-by");
  }

  // Security headers middleware
  app.use((req: any, res: any, next: () => void) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none';");
    next();
  });

  // Enable CORS for Next.js frontend
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        "http://localhost:3000",
        "https://ember-web-weld.vercel.app"
      ];
      if (process.env.CORS_ORIGINS) {
        allowedOrigins.push(...process.env.CORS_ORIGINS.split(","));
      }
      const isAllowed = allowedOrigins.some(o => o.trim().toLowerCase() === origin.toLowerCase()) || 
                        /\.vercel\.app$/.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Ember Backend API is running on http://localhost:${port}`);
}
bootstrap();
