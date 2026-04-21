import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { AuthService } from '../auth/auth.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messageTranslations: Record<string, string> = {
          'email must be an email': 'Formato de e-mail inválido',
          'password must be longer than or equal to 6 characters':
            'Senha deve ter pelo menos 6 caracteres',
          'name must be a string': 'Nome deve ser um texto',
          'name should not be empty': 'Nome é obrigatório',
          'email must be a string': 'E-mail deve ser um texto',
          'email should not be empty': 'E-mail é obrigatório',
          'password must be a string': 'Senha deve ser um texto',
          'password should not be empty': 'Senha é obrigatória',
          'phone must be a string': 'Telefone deve ser um texto',
        };

        const formattedErrors = errors.map((error) => {
          const constraints = error.constraints || {};
          const firstConstraintKey = Object.keys(constraints)[0];
          const firstConstraint =
            constraints[firstConstraintKey] || 'Erro de validação';

          return {
            campo: error.property,
            mensagem: messageTranslations[firstConstraint] || firstConstraint,
          };
        });

        return new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Dados de entrada inválidos',
          erros: formattedErrors,
        });
      },
    }),
  )
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-here' },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: 'João Silva' },
        phone: { type: 'string', example: '11999999999' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        error: { type: 'string', example: 'Bad Request' },
        message: { type: 'string', example: 'Dados de entrada inválidos' },
        erros: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              campo: { type: 'string', example: 'email' },
              mensagem: {
                type: 'string',
                example: 'Este campo é obrigatório',
              },
            },
          },
        },
      },
    },
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.usersService.signup(signupDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with existing user credentials' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'jwt-token-here' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-here' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'João Silva' },
            phone: { type: 'string', example: '11999999999' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
  }
}
