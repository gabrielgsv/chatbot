'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { authenticate } from '../actions';

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

    const result = await authenticate(
      isLogin,
      formData.email,
      formData.password,
      formData.name,
      formData.phone
    );

    setIsLoading(false);

    if (result.errors && Object.keys(result.errors).length > 0) {
      setFieldErrors(result.errors);
    }

    if (result.message) {
      setGlobalMessage(result.message);
      setIsSuccess(result.success);
    }

    if (isLogin && result.success) {
      const redirectPath = result.user?.role === 'admin' ? '/admin/dashboard' : '/chat';
      router.push(redirectPath);
      return;
    }

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
          <Alert variant={isSuccess ? 'default' : 'destructive'} className="mb-4">
            <AlertTitle>{isSuccess ? 'Sucesso' : 'Erro'}</AlertTitle>
            <AlertDescription>{globalMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nome
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Seu nome completo"
              className={fieldErrors.name ? "border-destructive" : ""}
              required
            />
            {fieldErrors.name && (
              <p className="text-sm text-destructive">{fieldErrors.name}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="seu@email.com"
            className={fieldErrors.email ? "border-destructive" : ""}
            required
          />
          {fieldErrors.email && (
            <p className="text-sm text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Senha
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className={fieldErrors.password ? "border-destructive" : ""}
            required
          />
          {fieldErrors.password && (
            <p className="text-sm text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Telefone (opcional)
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="11999999999"
              className={fieldErrors.phone ? "border-destructive" : ""}
            />
            {fieldErrors.phone && (
              <p className="text-sm text-destructive">{fieldErrors.phone}</p>
            )}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="w-full mt-6"
        >
          {isLoading ? (
            <Spinner className="size-4" />
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
