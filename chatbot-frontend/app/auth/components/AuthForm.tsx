'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextField,
  Label,
  Input,
  FieldError,
  Button,
  Spinner,
  Alert,
} from '@heroui/react';
import { authenticate } from '../actions';
import {
  registerServiceWorker,
  setTokenInSW,
  debugSWStatus,
  isSWReady,
} from '../lib/serviceWorker';

interface ValidationErrors {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
}

interface AuthFormProps {
  initialMode?: 'login' | 'signup';
}

export function AuthForm({ initialMode = 'login' }: AuthFormProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isLoading, setIsLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [swReady, setSwReady] = useState(false);

  // Registra o Service Worker ao montar o componente
  useEffect(() => {
    registerServiceWorker().then(() => {
      setSwReady(isSWReady());
      console.log('[AuthForm] SW registrado. Pronto:', isSWReady());

      // Debug: verificar status do token no SW
      if (isSWReady()) {
        debugSWStatus();
      }
    });
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setGlobalMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGlobalMessage('');
    setFieldErrors({});

    console.log('[AuthForm] Enviando dados:', {
      isLogin,
      email: formData.email,
      password: '***',
      name: formData.name,
      phone: formData.phone,
    });

    const result = await authenticate(
      isLogin,
      formData.email,
      formData.password,
      formData.name,
      formData.phone
    );

    console.log('[AuthForm] Resultado:', result);

    setIsLoading(false);

    if (result.errors && Object.keys(result.errors).length > 0) {
      setFieldErrors(result.errors);
    }

    if (result.message) {
      setGlobalMessage(result.message);
      setIsSuccess(result.success);
    }

    // Se login deu sucesso, salva no Service Worker
    if (isLogin && result.success && result.access_token) {
      console.log('[AuthForm] Salvando token no Service Worker');
      await setTokenInSW(result.access_token, result.user);

      // Debug: verificar se salvou
      await debugSWStatus();

      console.log('[AuthForm] Redirecionando para:', result.redirect);
      router.push(result.redirect || '/');
      return;
    }

    // Se signup deu sucesso, volta para login e limpa senha
    if (!isLogin && result.success) {
      setIsLogin(true);
      setFormData((prev) => ({ ...prev, password: '', name: '', phone: '' }));
    }
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setFieldErrors({});
    setGlobalMessage('');
    setFormData({ email: '', password: '', name: '', phone: '' });
  };

  return (
    <>
      {globalMessage && (
        <div className="mb-6">
          <Alert status={isSuccess ? 'success' : 'danger'} className="mb-4">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{globalMessage}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <TextField
            isInvalid={!!fieldErrors.name}
            isRequired
            className="w-full"
          >
            <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nome
            </Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Seu nome completo"
              className="mt-1"
            />
            {fieldErrors.name && <FieldError>{fieldErrors.name}</FieldError>}
          </TextField>
        )}

        <TextField
          isInvalid={!!fieldErrors.email}
          isRequired
          className="w-full"
        >
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            E-mail
          </Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="seu@email.com"
            className="mt-1"
          />
          {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
        </TextField>

        <TextField
          isInvalid={!!fieldErrors.password}
          isRequired
          className="w-full"
        >
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Senha
          </Label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="mt-1"
          />
          {fieldErrors.password && (
            <FieldError>{fieldErrors.password}</FieldError>
          )}
        </TextField>

        {!isLogin && (
          <TextField
            isInvalid={!!fieldErrors.phone}
            className="w-full"
          >
            <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Telefone (opcional)
            </Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="11999999999"
              className="mt-1"
            />
            {fieldErrors.phone && (
              <FieldError>{fieldErrors.phone}</FieldError>
            )}
          </TextField>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isDisabled={isLoading}
          className="mt-6"
        >
          {isLoading ? (
            <Spinner size="sm" color="current" />
          ) : isLogin ? (
            'Entrar'
          ) : (
            'Criar Conta'
          )}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline"
          >
            {isLogin ? 'Criar conta' : 'Fazer login'}
          </button>
        </p>
      </div>
    </>
  );
}
