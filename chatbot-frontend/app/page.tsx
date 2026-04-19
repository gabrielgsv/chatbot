import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="mb-8 inline-flex items-center justify-center rounded-full bg-blue-100 px-4 py-2 dark:bg-blue-900">
              <Badge variant="secondary">Plataforma Chatbot</Badge>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Chatbot Inteligente
              <span className="text-blue-600"> Reimaginado</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Experimente o futuro das conversas automatizadas com nossa plataforma de chatbot inteligente.
              Construída com tecnologia de ponta para interações naturais e eficientes.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/auth">
                <Button size="lg" className="px-8 py-3 h-auto bg-blue-600 text-white hover:bg-blue-700">
                  Começar Agora
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" size="lg" className="px-8 py-3 h-auto">
                  Testar Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200 opacity-20 blur-3xl dark:bg-blue-800"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-200 opacity-20 blur-3xl dark:bg-indigo-800"></div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Recursos Poderosos
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Tudo que você precisa para conversas inteligentes e automação
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-none shadow-lg dark:bg-gray-800">
              <CardContent className="flex flex-col items-center pt-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Conversas Naturais</h3>
                <p className="text-center mt-4 text-gray-600 dark:text-gray-300">
                  Recursos avançados de PLN para interações humanas e compreensão contextual
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg dark:bg-gray-800">
              <CardContent className="flex flex-col items-center pt-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Autenticação Segura</h3>
                <p className="text-center mt-4 text-gray-600 dark:text-gray-300">
                  Autenticação baseada em JWT com transmissão de dados criptografada e proteção de privacidade
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg dark:bg-gray-800">
              <CardContent className="flex flex-col items-center pt-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Ultra Rápido</h3>
                <p className="text-center mt-4 text-gray-600 dark:text-gray-300">
                  Performance otimizada com respostas em tempo real e latência mínima
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg dark:bg-gray-800">
              <CardContent className="flex flex-col items-center pt-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                  <svg className="h-8 w-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Aprendizado Inteligente</h3>
                <p className="text-center mt-4 text-gray-600 dark:text-gray-300">
                  Melhora continuamente com as interações para fornecer respostas melhores ao longo do tempo
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg dark:bg-gray-800">
              <CardContent className="flex flex-col items-center pt-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                  <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Persistência de Dados</h3>
                <p className="text-center mt-4 text-gray-600 dark:text-gray-300">
                  Banco de dados PostgreSQL com armazenamento confiável e histórico de conversas
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg dark:bg-gray-800">
              <CardContent className="flex flex-col items-center pt-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900">
                  <svg className="h-8 w-8 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Integração de API</h3>
                <p className="text-center mt-4 text-gray-600 dark:text-gray-300">
                  API RESTful com documentação completa para integração perfeita
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Construído com Tecnologia Moderna
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Desenvolvido com frameworks e ferramentas líderes de mercado para performance otimizada
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="text-center">
              <h3 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">Frontend</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="outline" className="text-sm py-1 px-3">Next.js 16</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">React 19</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">shadcn/ui</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">Tailwind CSS</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">TypeScript</Badge>
              </div>
            </div>

            <div className="text-center">
              <h3 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">Backend</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="outline" className="text-sm py-1 px-3">NestJS</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">Node.js</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">PostgreSQL</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">TypeORM</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">JWT Auth</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="border-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-16">
              <div className="text-center">
                <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                  Pronto para Começar?
                </h2>
                <p className="mb-8 text-lg opacity-90">
                  Junte-se a milhares de usuários experimentando o futuro das conversas automatizadas
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Link href="/auth">
                    <Button size="lg" className="px-8 py-3 h-auto bg-white text-blue-600 hover:bg-gray-100">
                      Cadastrar Agora
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button variant="outline" size="lg" className="px-8 py-3 h-auto border-white text-white hover:bg-white hover:text-blue-600">
                      Saiba Mais
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
