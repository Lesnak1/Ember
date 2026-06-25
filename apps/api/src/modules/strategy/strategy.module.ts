import { Module } from "@nestjs/common";
import { StrategyService } from "./strategy.service";
import { StrategyController } from "./strategy.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [StrategyController],
  providers: [StrategyService],
  exports: [StrategyService],
})
export class StrategyModule {}
