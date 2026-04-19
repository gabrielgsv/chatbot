'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Activity,
  Calendar,
  BarChart3,
  LogOut,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { adminTelemetry, TelemetryStats, TopUser, TelemetryEvent, FrequentQuestion } from '@/lib/admin-telemetry';

interface UserData {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin';
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentEvents, setRecentEvents] = useState<TelemetryEvent[]>([]);
  const [frequentQuestions, setFrequentQuestions] = useState<FrequentQuestion[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userEvents, setUserEvents] = useState<TelemetryEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/auth');
      return;
    }

    const userData: UserData = JSON.parse(userStr);
    if (userData.role !== 'admin') {
      router.push('/chat');
      return;
    }

    setUser(userData);
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsData, topUsersData, recentEventsData, frequentQuestionsData] = await Promise.all([
        adminTelemetry.getStats(),
        adminTelemetry.getTopUsers(10),
        adminTelemetry.getRecentEvents(50),
        adminTelemetry.getFrequentQuestions(10),
      ]);

      setStats(statsData);
      setTopUsers(topUsersData);
      setRecentEvents(recentEventsData);
      setFrequentQuestions(frequentQuestionsData);
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/auth');
  };

  const handleViewUserEvents = async (userId: string) => {
    if (selectedUser === userId) {
      setSelectedUser(null);
      setUserEvents([]);
      return;
    }

    try {
      const events = await adminTelemetry.getUserEvents(userId);
      setUserEvents(events);
      setSelectedUser(userId);
    } catch (err) {
      console.error('Erro ao carregar eventos do usuário:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user_data: 'Dados do Usuário',
      user_message: 'Mensagem do Usuário',
      bot_response: 'Resposta do Bot',
      user_location: 'Localização',
      return_rate: 'Taxa de Retorno',
      message_interval: 'Intervalo de Mensagens',
      feedback: 'Feedback',
      response_time: 'Tempo de Resposta',
      language: 'Idioma',
    };
    return labels[type] || type;
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      user_message: 'bg-blue-100 text-blue-800',
      bot_response: 'bg-green-100 text-green-800',
      feedback: 'bg-yellow-100 text-yellow-800',
      user_data: 'bg-purple-100 text-purple-800',
      user_location: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Spinner className="size-6" />
          <span className="text-gray-600">Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Painel Administrativo
              </h1>
              <Badge variant="secondary" className="ml-2">Admin</Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Eventos
              </CardTitle>
              <Activity className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalEvents.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Usuários
              </CardTitle>
              <Users className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalUsers.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ativos Hoje
              </CardTitle>
              <Calendar className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.activeUsersToday.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ativos na Semana
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.activeUsersThisWeek.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ativos no Mês
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.activeUsersThisMonth.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Taxa de Retenção
              </CardTitle>
              <Activity className="w-4 h-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalUsers
                  ? Math.round((stats.activeUsersThisMonth / stats.totalUsers) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events by Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Eventos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.eventsByType && Object.entries(stats.eventsByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getEventTypeColor(type)}>
                          {getEventTypeLabel(type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.max((count / (stats.totalEvents || 1)) * 100, 5)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-[3rem] text-right">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Frequent Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Perguntas Mais Frequentes</CardTitle>
            </CardHeader>
            <CardContent>
              {frequentQuestions.length > 0 ? (
                <div className="space-y-2">
                  {frequentQuestions.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="text-sm text-gray-700 truncate max-w-md">
                          {item.question}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {item.count}x
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma pergunta registrada ainda
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Users */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Usuários Mais Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Usuário</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">E-mail</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Eventos</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Última Atividade</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((user) => (
                    <React.Fragment key={user.userId}>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {user.name || 'Sem nome'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge variant="secondary">{user.eventCount.toLocaleString()}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDateTime(user.lastActivity)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUserEvents(user.userId)}
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                      {selectedUser === user.userId && userEvents.length > 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 px-4 bg-gray-50">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Eventos do usuário:
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {userEvents.slice(0, 20).map((event) => (
                                <div
                                  key={event.id}
                                  className="flex items-center justify-between py-2 px-3 bg-white rounded border"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge className={getEventTypeColor(event.eventType)}>
                                      {getEventTypeLabel(event.eventType)}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {formatDateTime(event.timestamp)}
                                    </span>
                                  </div>
                                  {event.pageUrl && (
                                    <span className="text-xs text-gray-400 truncate max-w-xs">
                                      {event.pageUrl}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getEventTypeColor(event.eventType)}>
                      {getEventTypeLabel(event.eventType)}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {event.user?.email || event.userId}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">
                      {formatDateTime(event.timestamp)}
                    </span>
                    {event.sessionId && (
                      <span className="text-xs text-gray-400">
                        {event.sessionId.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
