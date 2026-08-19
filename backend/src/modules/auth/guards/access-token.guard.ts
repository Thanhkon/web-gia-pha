import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { UsersService } from '../../users/users.service';

export type AccessTokenPayload = {
  sub: number;
  username?: string;
  iat: number;
  exp: number;
};

export type AuthenticatedRequest = Request & {
  user: {
    id: number;
    username?: string;
    isAdmin?: boolean;
    sub?: number;
  };
};

@Injectable()
export class AccessTokenGuard implements CanActivate {
  private readonly jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-key';

  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    const payload = this.verifyJwt(token);
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid access token');
    }

    request.user = this.usersService.toPublicUser(user);
    return true;
  }

  private extractBearerToken(request: Request) {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private verifyJwt(token: string): AccessTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid access token');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = createHmac('sha256', this.jwtSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (!this.safeCompare(signature, expectedSignature)) {
      throw new UnauthorizedException('Invalid access token');
    }

    const payload = this.decodePayload(encodedPayload);
    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (!payload.sub || !payload.exp || payload.exp <= nowInSeconds) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return payload;
  }

  private decodePayload(encodedPayload: string): AccessTokenPayload {
    try {
      return JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as AccessTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private safeCompare(value: string, expectedValue: string) {
    const valueBuffer = Buffer.from(value);
    const expectedValueBuffer = Buffer.from(expectedValue);

    if (valueBuffer.length !== expectedValueBuffer.length) {
      return false;
    }

    return timingSafeEqual(valueBuffer, expectedValueBuffer);
  }
}
