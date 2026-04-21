import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the landing page correctly', async ({ page }) => {
    await page.goto('/');

    // Check for main heading
    await expect(page.getByRole('heading', { name: 'Chatbot Inteligente Reimaginado' })).toBeVisible();

    // Check for description text
    await expect(page.getByText('Experimente o futuro das conversas automatizadas')).toBeVisible();

    // Check for CTA buttons
    await expect(page.getByRole('link', { name: 'Começar Agora' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Testar Demo' })).toBeVisible();
  });

  test('should display all feature cards', async ({ page }) => {
    await page.goto('/');

    // Check for feature headings
    await expect(page.getByRole('heading', { name: 'Recursos Poderosos' })).toBeVisible();

    // Check for individual features
    await expect(page.getByRole('heading', { name: 'Conversas Naturais' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Autenticação Segura' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ultra Rápido' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aprendizado Inteligente' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Persistência de Dados' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Integração de API' })).toBeVisible();
  });

  test('should display technology stack section', async ({ page }) => {
    await page.goto('/');

    // Check for technology stack heading
    await expect(page.getByRole('heading', { name: 'Construído com Tecnologia Moderna' })).toBeVisible();

    // Check for Frontend section
    await expect(page.getByRole('heading', { name: 'Frontend' })).toBeVisible();
    await expect(page.getByText('Next.js 16')).toBeVisible();
    await expect(page.getByText('React 19')).toBeVisible();
    await expect(page.getByText('shadcn/ui')).toBeVisible();
    await expect(page.getByText('Tailwind CSS')).toBeVisible();
    await expect(page.getByText('TypeScript')).toBeVisible();

    // Check for Backend section
    await expect(page.getByRole('heading', { name: 'Backend' })).toBeVisible();
    await expect(page.getByText('NestJS')).toBeVisible();
    await expect(page.getByText('Node.js')).toBeVisible();
    await expect(page.getByText('PostgreSQL', { exact: true })).toBeVisible();
    await expect(page.getByText('TypeORM')).toBeVisible();
    await expect(page.getByText('JWT Auth')).toBeVisible();
  });

  test('should navigate to auth page when clicking "Começar Agora"', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Começar Agora' }).click();

    await expect(page).toHaveURL('/auth');
    await expect(page.getByRole('heading', { name: 'Acessar Plataforma' })).toBeVisible();
  });

  test('should navigate to chat page when clicking "Testar Demo"', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Testar Demo' }).click();

    // Note: Chat page requires authentication, so it will redirect to auth
    await expect(page).toHaveURL('/auth');
  });

  test('should navigate to auth page from CTA section', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Cadastrar Agora' }).click();

    await expect(page).toHaveURL('/auth');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that main elements are visible on mobile
    await expect(page.getByRole('heading', { name: 'Chatbot Inteligente Reimaginado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Começar Agora' })).toBeVisible();
  });
});
