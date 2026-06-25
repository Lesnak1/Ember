import { Module } from "@nestjs/common";
import { ExecutionProcessor } from "./execution.processor";
import { AgentModule } from "../agent/agent.module";

@Module({
  imports: [AgentModule],
  providers: [ExecutionProcessor],
  exports: [],
})
export class ExecutionModule {}
