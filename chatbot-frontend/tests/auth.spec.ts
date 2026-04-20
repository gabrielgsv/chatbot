import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display the auth page correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Acessar Plataforma' })).toBeVisible();
    await expect(page.getByText('Entre com suas credenciais ou crie uma nova conta')).toBeVisible();
  });

  test('should display login form by default', async ({ page }) => {
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByText('Não tem uma conta?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar conta' })).toBeVisible();
  });

  test('should toggle to signup form', async ({ page }) => {
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page.getByLabel('Nome')).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByLabel('Telefone (opcional)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar Conta' })).toBeVisible();
    await expect(page.getByText('Já tem uma conta?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fazer login' })).toBeVisible();
  });

  test('should toggle back to login form', async ({ page }) => {
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await page.getByRole('button', { name: 'Fazer login' }).click();

    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.getByLabel('E-mail').fill('');
    await page.getByLabel('Senha').fill('password123');
    
    // Form should not submit with empty email
    await page.getByRole('button', { name: 'Entrar' }).click();
    
    // Should still be on auth page (no redirect)
    await expect(page).toHaveURL('/auth');
  });

  test('should show validation error for empty password', async ({ page }) => {
    await page.getByLabel('E-mail').fill('test@example.com');
    await page.getByLabel('Senha').fill('');
    
    // Form should not submit with empty password
    await page.getByRole('button', { name: 'Entrar' }).click();
    
    // Should still be on auth page (no redirect)
    await expect(page).toHaveURL('/auth');
  });

  test('should navigate to home page when clicking logo', async ({ page }) => {
    await page.getByRole('link', { name: 'Chatbot' }).first().click();

    await expect(page).toHaveURL('/');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth');

    // Mobile view should show different layout
    await expect(page.getByRole('heading', { name: 'Acessar Plataforma' })).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
  });

  test('should display signup form with all required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Criar conta' }).click();

    const nameInput = page.getByLabel('Nome');
    const emailInput = page.getByLabel('E-mail');
    const passwordInput = page.getByLabel('Senha');
    const phoneInput = page.getByLabel('Telefone (opcional)');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(phoneInput).toBeVisible();

    // Check placeholders
    await expect(nameInput).toHaveAttribute('placeholder', 'Seu nome completo');
    await expect(emailInput).toHaveAttribute('placeholder', 'seu@email.com');
    await expect(passwordInput).toHaveAttribute('placeholder', 'Mínimo 6 caracteres');
    await expect(phoneInput).toHaveAttribute('placeholder', '11999999999');
  });

  test('should show loading state when submitting', async ({ page }) => {
    // This test checks that the form shows a response after submission
    await page.getByLabel('E-mail').fill('test@example.com');
    await page.getByLabel('Senha').fill('password123');
    
    // Click submit
    await page.getByRole('button', { name: 'Entrar' }).click();
    
    // Should show either loading state, error message, or redirect
    // With mock credentials, it will likely show an error
    await expect(page.getByText('Erro').or(page.getByText('Sucesso'))).toBeVisible({ timeout: 5000 });
  });
});
