import { Module } from "@nestjs/common";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AgentModule } from "./modules/agent/agent.module";
import { StrategyModule } from "./modules/strategy/strategy.module";
import { ExecutionModule } from "./modules/execution/execution.module";
import { PortfolioModule } from "./modules/portfolio/portfolio.module";
import { BrokerModule } from "./modules/broker/broker.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AgentModule,
    StrategyModule,
    ExecutionModule,
    PortfolioModule,
    BrokerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
