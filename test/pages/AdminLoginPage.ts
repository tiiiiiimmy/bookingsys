import { Page } from '@playwright/test';

export class AdminLoginPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('/admin/login');
  }

  async login(email: string, password: string) {
    await this.page.getByTestId('admin-login-email').fill(email);
    await this.page.getByTestId('admin-login-password').fill(password);
    await this.page.getByTestId('admin-login-submit').click();
  }
}
