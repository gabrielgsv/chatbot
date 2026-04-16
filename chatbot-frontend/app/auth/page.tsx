import { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from './components';

export const metadata: Metadata = {
  title: 'Autenticação | Chatbot',
  description: 'Entre ou crie uma conta para acessar o chatbot',
};

export default function AuthPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Chatbot
            </Link>
          </div>
          <div className="space-y-6 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight">
              Bem-vindo de volta
            </h2>
            <p className="text-lg text-blue-100">
              Acesse sua conta para continuar suas conversas inteligentes e explorar todas as funcionalidades da nossa plataforma.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <span className="text-sm">Chat Inteligente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-sm">Seguro</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-blue-200">
            © Chatbot. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-16 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Chatbot
            </Link>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 sm:p-10">
            <div className="mb-8 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                Acessar Plataforma
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Entre com suas credenciais ou crie uma nova conta
              </p>
            </div>

            <AuthForm />
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Ao continuar, você concorda com nossos{' '}
            <Link href="#" className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
              Termos de Serviço
            </Link>{' '}
            e{' '}
            <Link href="#" className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
