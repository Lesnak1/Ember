import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SiweMessage } from "siwe";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async verifySiweAndLogin(address: string, message: string, signature: string): Promise<{ token: string; user: any }> {
    try {
      const siweMessage = new SiweMessage(message);
      const verification = await siweMessage.verify({ signature });
      
      if (!verification.success) {
        throw new UnauthorizedException("SIWE verification failed");
      }

      const verifiedAddress = verification.data.address.toLowerCase();
      if (verifiedAddress !== address.toLowerCase()) {
        throw new UnauthorizedException("Signature address mismatch");
      }

      // Upsert user
      const user = await this.prisma.user.upsert({
        where: { mainAddress: verifiedAddress },
        update: {},
        create: {
          mainAddress: verifiedAddress,
          settings: {},
        },
      });

      // Generate JWT
      const payload = { sub: user.id, address: user.mainAddress };
      const token = this.jwtService.sign(payload);

      return {
        token,
        user,
      };
    } catch (error: any) {
      throw new UnauthorizedException(error.message || "Failed to authenticate with SIWE");
    }
  }
}
