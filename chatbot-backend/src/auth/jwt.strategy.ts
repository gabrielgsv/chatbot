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

interface JwtStrategyOptions {
  jwtFromRequest: any;
  ignoreExpiration: boolean;
  secretOrKey: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const options: JwtStrategyOptions = {
      jwtFromRequest: (ExtractJwt as any).fromAuthHeaderAsBearerToken(),
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
