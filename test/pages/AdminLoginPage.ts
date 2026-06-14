import { Page, Response } from '@playwright/test';

export class AdminLoginPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('/admin/login');
  }

  /** Fills credentials, submits, and waits for the auth request to complete. */
  async login(email: string, password: string): Promise<Response> {
    await this.page.getByTestId('admin-login-email').fill(email);
    await this.page.getByTestId('admin-login-password').fill(password);
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/admin/auth/login') && r.request().method() === 'POST',
      ),
      this.page.getByTestId('admin-login-submit').click(),
    ]);
    return response;
  }
}
