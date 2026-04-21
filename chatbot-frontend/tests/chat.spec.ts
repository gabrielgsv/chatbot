import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test('should redirect to auth if not authenticated', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/auth');
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    await page.goto('/chat');
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth');
  });

  test.beforeEach(async ({ page }) => {
    // Set up authentication in localStorage before navigating to chat
    await page.goto('/auth');
    
    // Mock authentication by setting localStorage directly
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock_token_for_testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user'
      }));
    });
  });

  test('should display chat interface when authenticated', async ({ page }) => {
    await page.goto('/chat');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for chat header
    await expect(page.getByRole('heading', { name: 'Hand Talk Assistant' })).toBeVisible();
    
    // Check for logout button
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  });

  test('should display welcome message when no messages exist', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Check for welcome message
    await expect(page.getByText('Bem-vindo ao Hand Talk Chatbot!')).toBeVisible();
    await expect(page.getByText('Como posso ajudar você hoje?')).toBeVisible();
  });

  test('should display message input field', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Check for input field
    const input = page.getByPlaceholder('Digite sua mensagem...');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test('should display send button', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Check for send button
    const sendButton = page.getByRole('button', { name: /Enviar mensagem/ });
    await expect(sendButton).toBeVisible();
    
    // Send button should be disabled when input is empty
    await expect(sendButton).toBeDisabled();
  });

  test('should enable send button when typing', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    const input = page.getByPlaceholder('Digite sua mensagem...');
    const sendButton = page.getByRole('button', { name: /Enviar mensagem/ });
    
    // Type a message
    await input.fill('Hello');
    
    // Send button should now be enabled
    await expect(sendButton).toBeEnabled();
  });

  test('should send message when pressing Enter', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    const input = page.getByPlaceholder('Digite sua mensagem...');
    
    // Type a message and press Enter
    await input.fill('Test message');
    await input.press('Enter');
    
    // Input should be cleared
    await expect(input).toHaveValue('');
  });

  test('should send message when clicking send button', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    const input = page.getByPlaceholder('Digite sua mensagem...');
    const sendButton = page.getByRole('button', { name: /Enviar mensagem/ });
    
    // Type a message and click send
    await input.fill('Test message');
    await sendButton.click();
    
    // Input should be cleared
    await expect(input).toHaveValue('');
  });

  test('should logout and redirect to auth page', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Click logout button
    await page.getByRole('button', { name: 'Sair' }).click();
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth');
  });

  test('should display helper text', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Check for helper text
    await expect(page.getByText('Pressione Enter para enviar')).toBeVisible();
    await expect(page.getByText('Dados de uso são coletados anonimamente')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Check that main elements are visible on mobile
    await expect(page.getByRole('heading', { name: 'Hand Talk Assistant' })).toBeVisible();
    await expect(page.getByPlaceholder('Digite sua mensagem...')).toBeVisible();
  });

  test('should redirect admin users to dashboard', async ({ page }) => {
    // Set admin role in localStorage
    await page.goto('/auth');
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock_admin_token');
      localStorage.setItem('user', JSON.stringify({
        id: 'admin-user-id',
        email: 'admin@example.com',
        role: 'admin'
      }));
    });
    
    await page.goto('/chat');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin/dashboard');
  });
});
