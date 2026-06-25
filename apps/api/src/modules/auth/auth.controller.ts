import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthLoginInput, AuthLoginSchema } from "@ember/types";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: AuthLoginInput) {
    // Validate request using Shared Zod Schema
    const payload = AuthLoginSchema.parse(body);
    return this.authService.verifySiweAndLogin(payload.address, payload.message, payload.signature);
  }
}
