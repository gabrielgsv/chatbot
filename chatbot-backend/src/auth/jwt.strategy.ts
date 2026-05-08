/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const options = {
      jwtFromRequest: (req: any) => {
        const authHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (authHeader) return authHeader;

        const cookieToken = req?.cookies?.auth_token;
        if (cookieToken) return cookieToken;

        return null;
      },
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    };
    super(options as never);
  }

  validate(payload: JwtPayload): {
    userId: string;
    email: string;
    role: string;
  } {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
