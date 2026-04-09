# 按摩预约系统 - 后端 API

基于 .NET 10 + ASP.NET Core 的后端服务器，使用 MySQL 数据库和 Stripe 支付集成。

## 前置要求

- .NET SDK 10.0
- **MySQL 8.0+** (或 MariaDB 10.5+)
- Stripe 账户（用于支付）

## 安装

1. 恢复 .NET 依赖:
```bash
dotnet restore BookingSystem.Api.csproj
```

2. 配置环境变量:
```bash
cp .env.example .env
# 编辑 .env 填写配置
```

3. 创建 MySQL 数据库:
```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE bookingsys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 退出
EXIT;
```

4. 运行数据库迁移:
```bash
dotnet run --project BookingSystem.Api.csproj -- --migrate
```

5. 种子数据:
```bash
dotnet run --project BookingSystem.Api.csproj -- --seed
```

这将创建:
- 服务类型（30/60/90分钟，价格）
- 营业时间（周四和周日，9 AM - 5 PM）
- 初始管理员用户

## 运行服务器

开发模式（自动重载）:
```bash
dotnet watch run --project BookingSystem.Api.csproj
```

生产模式:
```bash
dotnet run --no-launch-profile --project BookingSystem.Api.csproj
```

服务器默认运行在 `http://localhost:5000`

## 环境变量

关键环境变量（查看 `.env.example` 获取完整列表）:

```env
# MySQL 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bookingsys
DB_USER=root
DB_PASSWORD=your_password

# JWT 密钥（生产环境必须更改！）
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_key

# 邮件（可选，用于开发）
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App / 前端
APP_BASE_URL=http://localhost:3000
SUPPORT_EMAIL=support@example.com
FRONTEND_URLS=http://localhost:3000,http://localhost:3001

# 管理员用户（用于初始种子）
ADMIN_EMAIL=admin@massage.com
ADMIN_PASSWORD=admin123
```

## API 端点

### 公共端点
- `GET /health` - 健康检查
- `GET /api/bookings/service-types`
- `POST /api/bookings`
- `GET /api/bookings/:id`
- `GET /api/bookings/manage/:token`
- `POST /api/bookings/manage/:token/reschedule-request`
- `GET /api/availability/slots`
- `POST /api/webhooks/stripe`

### 管理员端点
- `POST /api/admin/auth/login` - 管理员登录
- `POST /api/admin/auth/refresh` - 刷新令牌
- `GET /api/admin/auth/me` - 获取当前管理员
- `GET /api/admin/dashboard/stats`
- `GET /api/admin/bookings`
- `GET /api/admin/bookings/:id`
- `PATCH /api/admin/bookings/:id/status`
- `POST /api/admin/bookings/:id/reschedule`
- `GET /api/admin/customers`
- `GET /api/admin/customers/:id`
- `POST /api/admin/reschedule-requests/:id/approve`
- `POST /api/admin/reschedule-requests/:id/reject`

## 数据库架构

### 表结构
- `customers` - 客户信息
- `bookings` - 预约记录
- `payments` - Stripe 支付记录
- `availability_blocks` - 屏蔽时间段
- `business_hours` - 每周营业时间
- `admins` - 管理员用户
- `service_types` - 服务类型和价格

### 主要特性
- 外键约束防止数据不一致
- CHECK 约束验证数据
- 自动更新 updated_at 时间戳
- 索引提升查询性能

## 项目结构

```
backend/
├── Controllers/          # API 控制器
├── Services/             # 业务逻辑
├── Models/               # 请求和响应模型
├── Middleware/           # 错误处理等中间件
├── Database/             # MySQL 连接、迁移、种子
├── Configuration/        # .env 和配置读取
├── src/database/         # SQL 迁移和种子文件
├── .env                  # 环境变量
├── .env.example          # 环境变量模板
├── BookingSystem.Api.csproj
└── Program.cs            # ASP.NET Core 应用入口
```

## 开发进度

✅ **Phase 1-6 准上线版（已完成）**
- 后端结构
- MySQL 数据库和迁移
- 管理员认证
- 客户预约与支付初始化
- Stripe Webhook 回写
- 管理员预约管理
- 客户改期申请
- 基础邮件通知

## 测试

```bash
dotnet build BookingSystem.Api.csproj
```

（当前以 `dotnet build` 验证为主）

## 安全注意事项

- 永远不要提交 `.env` 到版本控制
- 首次登录后立即更改默认管理员密码
- 生产环境使用强 JWT 密钥
- 生产环境启用 HTTPS（Stripe 要求）

## 许可证

ISC
