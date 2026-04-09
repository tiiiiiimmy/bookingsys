# 测试说明

## 快速开始测试

### 1. 设置 MySQL 数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE bookingsys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 验证
SHOW DATABASES;

# 退出
EXIT;
```

### 2. 启动后端服务器

```bash
cd backend

# 首次运行前复制环境变量模板
cp .env.example .env

# 首次运行需要设置数据库
dotnet run --project BookingSystem.Api.csproj -- --migrate  # 运行数据库迁移
dotnet run --project BookingSystem.Api.csproj -- --seed     # 创建初始数据

# 启动服务器
dotnet watch run --project BookingSystem.Api.csproj
```

如需完整测试支付链路，请在 `.env` 中配置：
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_BASE_URL`
- `FRONTEND_URLS`

### 3. 启动前端服务器

在新终端窗口：

```bash
cd frontend
npm run dev
```

### 4. 测试管理员登录

- 访问: http://localhost:3000/admin/login
- 邮箱: `admin@massage.com`
- 密码: `admin123`

### 5. 测试预约与支付链路

- 访问: http://localhost:3000/booking
- 选择服务、时间、填写客户信息
- 进入 Stripe 支付步骤
- 支付成功后检查确认页状态是否变为 `confirmed`

### 6. 测试改期链路

- 通过客户管理链接打开 `/booking/manage/:token`
- 提交一条改期申请
- 管理员到 `/admin/bookings` 批准或拒绝该申请

## 数据库变更说明

✅ **已从 PostgreSQL 切换到 MySQL**

主要变更:
- 数据库驱动: `pg` → `mysql2`
- 使用 MySQL 8.0+ 的所有特性
- InnoDB 引擎 + utf8mb4 字符集

Phase 1 已完成！（MySQL 版本）✨
