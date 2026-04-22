import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Hand Talk Chatbot - Chatbot Inteligente",
  description: "Plataforma de chatbot inteligente com coleta de dados para análise e melhoria de acessibilidade",
};

const TELEMETRY_FEATURES = [
  {
    title: "Conversas Naturais",
    description: "Recursos avançados de PLN para interações humanas e compreensão contextual",
    icon: (
      <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    title: "Telemetria Inteligente",
    description: "Coleta anonimamente dados de uso para treinamento de IA e melhoria contínua",
    icon: (
      <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Respostas em Tempo Real",
    description: "Performance otimizada com latência mínima e respostas instantâneas",
    icon: (
      <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Persistência de Dados",
    description: "Histórico completo de conversas armazenado de forma segura",
    icon: (
      <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
  {
    title: "Integração de API",
    description: "API RESTful com documentação completa para integração perfeita",
    icon: (
      <svg className="h-8 w-8 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: "Privacidade de Dados",
    description: "Dados coletados anonimamente com transparência e consentimento",
    icon: (
      <svg className="h-8 w-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="text-center">
            {/* Logo Hand Talk */}
            <div className="mb-6 flex justify-center">
              <Image
                src="/handtalk.png"
                alt="Hand Talk"
                width={120}
                height={60}
                className="h-auto w-28 sm:w-36"
                priority
              />
            </div>
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-blue-100 px-4 py-2 dark:bg-blue-900" role="status" aria-label="Status da plataforma">
              <Badge variant="secondary">Plataforma Chatbot</Badge>
            </div>
            <h1 id="hero-title" className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Chatbot Inteligente
              <span className="text-blue-600 dark:text-blue-400"> Hand Talk</span>
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Experimente o futuro das conversas automatizadas com nossa plataforma de chatbot inteligente.
              Construída com tecnologia de ponta para interações naturais e eficientes.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/chat" aria-label="Criar uma conta para acessar o chatbot">
                <Button size="lg" className="px-8 py-3 h-auto bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Começar Agora
                </Button>
              </Link>
              <Link href="/chat" aria-label="Testar o chatbot sem login">
                <Button variant="outline" size="lg" className="px-8 py-3 h-auto focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                  Testar Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200 opacity-20 blur-3xl dark:bg-blue-800" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-200 opacity-20 blur-3xl dark:bg-indigo-800" aria-hidden="true" />
      </section>

      {/* Privacy Notice */}
      <section className="py-6 bg-white/50 dark:bg-gray-800/50" aria-labelledby="privacy-title">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <svg className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p>
              <strong className="font-medium">Privacidade:</strong> Coletamos dados de uso anonimamente para melhorar a acessibilidade e o produto. 
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20" aria-labelledby="features-title">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 id="features-title" className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Recursos Poderosos
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Tudo que você precisa para conversas inteligentes e automação de dados
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TELEMETRY_FEATURES.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg dark:bg-gray-800">
                <CardContent className="flex flex-col items-center pt-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white text-center">
                    {feature.title}
                  </h3>
                  <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-12 bg-white dark:bg-gray-900" aria-labelledby="tech-stack-title">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 id="tech-stack-title" className="mb-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Construído com Tecnologia Moderna
            </h2>
            <p className="mx-auto max-w-xl text-base text-gray-600 dark:text-gray-300">
              Frameworks e ferramentas líderes de mercado para performance otimizada
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
            <div className="text-center">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Frontend</h3>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="text-sm py-1 px-3">Next.js</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">React</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">TypeScript</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">Tailwind CSS</Badge>
              </div>
            </div>

            <div className="text-center">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Backend</h3>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="text-sm py-1 px-3">NestJS</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">PostgreSQL</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">WebSocket</Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">JWT</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16" aria-labelledby="cta-title">
        <div className="container mx-auto px-4">
          <Card className="border-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center">
                <h2 id="cta-title" className="mb-4 text-2xl font-bold sm:text-3xl">
                  Pronto para Começar?
                </h2>
                <p className="mb-8 text-base opacity-90 max-w-lg mx-auto">
                  Junte-se a milhares de usuários experimentando o futuro das conversas automatizadas
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Link href="/auth" aria-label="Criar conta">
                    <Button size="lg" className="px-8 py-3 h-auto bg-white text-blue-600 hover:bg-gray-100 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600">
                      Cadastrar Agora
                    </Button>
                  </Link>
                  <Link href="/chat" aria-label="Testar demo">
                    <Button variant="outline" size="lg" className="px-8 py-3 h-auto border-white text-blue-600 hover:bg-white hover:text-blue-600 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600">
                      Testar Demo
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
