/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

interface AuthUser {
  role?: string;
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const user: AuthUser | undefined = request?.user;

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Acesso restrito a administrador');
    }

    return true;
  }
}
