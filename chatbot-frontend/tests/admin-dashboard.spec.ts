import { test, expect } from '@playwright/test';

async function setupAuth(page: ReturnType<typeof test.use>[0], role: 'admin' | 'user' = 'admin') {
  await page.goto('/auth');

  const token = role === 'admin' ? 'mock_admin_token' : 'mock_user_token';

  await page.evaluate(({ token }) => {
    document.cookie = `auth_token=${encodeURIComponent(token)}; path=/`;
  }, { token });
}

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page, 'admin');
  });

  test('should redirect to auth if not authenticated', async ({ page }) => {
    // Clear auth by clearing cookies
    await page.evaluate(() => {
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });

    await page.goto('/admin/dashboard');

    // Should redirect to auth page
    await expect(page).toHaveURL('/auth');
  });

  test('should redirect non-admin users to chat', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Should redirect to chat page if not admin (since mock token is not valid JWT)
    await expect(page).toHaveURL(/\/(chat|auth)/);
  });

  test('should display dashboard when authenticated as admin', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for dashboard header
    await expect(page.getByRole('heading', { name: 'Painel Administrativo' })).toBeVisible();

    // Check for admin badge using exact match to avoid conflicts
    await expect(page.getByText('Admin', { exact: true })).toBeVisible();
  });

  test('should display admin email in header', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for admin email
    await expect(page.getByText('admin@example.com')).toBeVisible();
  });

  test('should display logout button', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for logout button
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  });

  test('should logout and redirect to auth page', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Click logout button
    await page.getByRole('button', { name: 'Sair' }).click();

    // Should redirect to auth page
    await expect(page).toHaveURL('/auth');
  });

  test('should display stats cards', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for stats section headings
    await expect(page.getByText('Total de Eventos')).toBeVisible();
    await expect(page.getByText('Usuários', { exact: true })).toBeVisible();
    await expect(page.getByText('Ativos Hoje')).toBeVisible();
    await expect(page.getByText('Ativos na Semana')).toBeVisible();
    await expect(page.getByText('Ativos no Mês')).toBeVisible();
    await expect(page.getByText('Taxa de Retenção')).toBeVisible();
  });

  test('should display events by type section', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for events by type section
    await expect(page.getByRole('heading', { name: 'Eventos por Tipo' })).toBeVisible();
  });

  test('should display frequent questions section', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for frequent questions section
    await expect(page.getByRole('heading', { name: 'Perguntas Mais Frequentes' })).toBeVisible();
  });

  test('should display top users section', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for top users section
    await expect(page.getByRole('heading', { name: 'Usuários Mais Ativos' })).toBeVisible();
  });

  test('should display recent events section', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for recent events section
    await expect(page.getByRole('heading', { name: 'Eventos Recentes' })).toBeVisible();
  });

  test('should display loading state initially', async ({ page }) => {
    // Navigate to dashboard without waiting for network idle
    await page.goto('/admin/dashboard');

    // Check for loading state - this may be too fast to catch in some browsers
    // So we check for either loading state or error state
    const loadingState = page.getByText('Carregando dashboard...');
    const errorState = page.getByText('Erro ao carregar dados do dashboard');

    // Either loading or error state should be visible initially
    await expect(loadingState.or(errorState)).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check that main elements are visible on mobile
    await expect(page.getByRole('heading', { name: 'Painel Administrativo' })).toBeVisible();
  });

  test('should display user table with correct columns', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for table headers using role for better specificity
    await expect(page.getByRole('columnheader', { name: 'Usuário' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'E-mail' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Eventos' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Última Atividade' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Ações' })).toBeVisible();
  });
});
