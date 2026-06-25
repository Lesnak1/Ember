import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common";
import { AgentService } from "./agent.service";
import { JwtAuthGuard, AuthenticatedRequest } from "../auth/jwt-auth.guard";
import { RegisterAgentInput, RegisterAgentSchema } from "@ember/types";

@Controller("agent")
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private agentService: AgentService) {}

  @Post("generate")
  async generateAgent(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.agentService.createAgentKeyPair(userId);
  }

  @Post("register")
  async registerAgent(@Req() req: AuthenticatedRequest, @Body() body: RegisterAgentInput) {
    const userId = req.user.sub;
    const payload = RegisterAgentSchema.parse(body);
    
    return this.agentService.registerAgent(
      userId,
      payload.agentAddress,
      payload.validUntil,
      payload.signature as `0x${string}`,
      payload.nonce
    );
  }

  @Post("revoke")
  async revokeAgent(
    @Req() req: AuthenticatedRequest,
    @Body("agentAddress") agentAddress: string,
    @Body("signature") signature: string,
    @Body("nonce") nonce: number
  ) {
    const userId = req.user.sub;
    return this.agentService.revokeAgent(
      userId,
      agentAddress,
      signature as `0x${string}`,
      nonce
    );
  }
}
