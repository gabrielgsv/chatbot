import ky, { HTTPError } from "ky";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ValidationErrors {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
}

interface AuthResponse {
  access_token?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    role?: "user" | "admin";
    createdAt?: string;
    updatedAt?: string;
  };
  erros?: Array<{ campo: string; mensagem: string }>;
  message?: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 6;
}

function validateName(name: string): boolean {
  return name.trim().length > 0;
}

function validateForm(
  email: string,
  password: string,
  name: string | undefined,
  isLogin: boolean,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!email.trim()) {
    errors.email = "E-mail é obrigatório";
  } else if (!validateEmail(email)) {
    errors.email = "Formato de e-mail inválido";
  }

  if (!password.trim()) {
    errors.password = "Senha é obrigatória";
  } else if (!validatePassword(password)) {
    errors.password = "Senha deve ter pelo menos 6 caracteres";
  }

  if (!isLogin && (!name || !validateName(name))) {
    errors.name = "Nome é obrigatório";
  }

  return errors;
}

export interface AuthResult {
  errors: ValidationErrors;
  message: string;
  success: boolean;
  redirect?: string;
  access_token?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    role?: "user" | "admin";
    createdAt?: string;
    updatedAt?: string;
  };
}

export async function authenticate(
  isLogin: boolean,
  email: string,
  password: string,
  name?: string,
  phone?: string,
): Promise<AuthResult> {
  const validationErrors = validateForm(email, password, name, isLogin);

  if (Object.keys(validationErrors).length > 0) {
    return {
      errors: validationErrors,
      message: "",
      success: false,
    };
  }

  const endpoint = isLogin ? "users/login" : "users/signup";
  const body = isLogin
    ? { email, password }
    : {
        email,
        password,
        name,
        ...(phone && { phone }),
      };

  try {
    const data = await ky
      .post(`${API_URL}/${endpoint}`, { json: body })
      .json<AuthResponse>();

    if (data.erros && Array.isArray(data.erros)) {
      const serverErrors: ValidationErrors = {};
      data.erros.forEach((err: { campo: string; mensagem: string }) => {
        serverErrors[err.campo as keyof ValidationErrors] = err.mensagem;
      });
      return {
        errors: serverErrors,
        message: data.message || "Ocorreu um erro. Tente novamente.",
        success: false,
      };
    }

    if (isLogin && data.access_token) {
      return {
        errors: {},
        message: "",
        success: true,
        redirect: "/",
        access_token: data.access_token,
        user: data.user,
      };
    }

    return {
      errors: {},
      message: "Conta criada com sucesso! Faça login para continuar.",
      success: true,
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      const status = error.response.status;

      let errorMessage =
        error.data?.message || "Ocorreu um erro. Tente novamente.";
      let fieldErrorsResult: ValidationErrors = {};

      try {
        const errorResponse = error.response.clone();
        const errorData = await errorResponse.json();

        if (errorData.message) {
          errorMessage = errorData.message;
        }

        if (errorData.erros && Array.isArray(errorData.erros)) {
          errorData.erros.forEach(
            (err: { campo: string; mensagem: string }) => {
              fieldErrorsResult[err.campo as keyof ValidationErrors] =
                err.mensagem;
            },
          );
        }
      } catch (parseError) {
        // Usar mensagem padrão
      }

      if (Object.keys(fieldErrorsResult).length > 0) {
        return {
          errors: fieldErrorsResult,
          message: errorMessage,
          success: false,
        };
      }

      return {
        errors: {},
        message: errorMessage,
        success: false,
      };
    }

    return {
      errors: {},
      message: "Erro de conexão. Verifique sua internet e tente novamente.",
      success: false,
    };
  }
}
