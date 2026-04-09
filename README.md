# 按摩预约系统 (Massage Booking System)

专为按摩师设计的在线预约和支付系统，支持客人在线预约并通过 Stripe 支付。

## 项目概述

### 您的配置
- **营业时间**: 每周四和周日，9:00 AM - 5:00 PM
- **服务价格**: 30分钟 ($50)，60分钟 ($90)，90分钟 ($130)
- **支付方式**: Stripe 在线支付（预约前必须支付）
- **退款政策**: 手动处理（管理员根据情况决定）
- **客户账户**: 不需要注册（游客结账）
- **日历系统**: 自定义应用内日历

### 功能特性

**客户端功能:**
- 浏览可用时间段（30/60/90分钟服务）
- 无需注册即可预约
- 创建待支付预约并通过 Stripe 完成支付
- 查看预约确认页真实状态
- 通过安全管理链接发起改期申请

**管理员功能:**
- 在后台列表中查看所有预约和详情
- 管理预约（改期、取消、完成、未到店）
- 设置可用时间（屏蔽不工作的日期）
- 查看客户历史记录
- 审核客户改期申请

## 技术栈

- **后端**: .NET 10 + ASP.NET Core + MySQL
- **前端**: React (Vite)
- **支付**: Stripe
- **认证**: JWT

## 项目结构

```
bookingsys/
├── backend/          # ASP.NET Core API 服务器
│   ├── Controllers/       # API 控制器
│   ├── Services/          # 业务逻辑
│   ├── Models/            # 请求和响应模型
│   ├── Middleware/        # 认证、错误处理
│   ├── Database/          # MySQL 连接、迁移、种子
│   ├── Configuration/     # .env 和配置读取
│   ├── src/database/      # SQL 迁移和种子数据
│   ├── BookingSystem.Api.csproj
│   └── Program.cs
│
├── frontend/         # React 前端应用
│   ├── src/
│   │   ├── components/      # UI 组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API 客户端
│   │   ├── hooks/           # 自定义 hooks
│   │   ├── context/         # Context providers
│   │   └── App.jsx          # 主应用
│   └── package.json
│
└── README.md         # 本文件
```

## 快速开始

### 前置要求

- .NET SDK 10.0
- Node.js 18+（前端）
- MySQL 8.0+
- Stripe 账户（用于支付）

### 安装步骤

#### 1. 后端设置

```bash
cd backend

# 恢复 .NET 依赖
dotnet restore BookingSystem.Api.csproj

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写数据库和 Stripe 配置

# 创建 MySQL 数据库
mysql -u root -p
CREATE DATABASE bookingsys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
\q

# 运行数据库迁移
dotnet run --project BookingSystem.Api.csproj -- --migrate

# 种子数据（创建服务类型、营业时间、管理员用户）
dotnet run --project BookingSystem.Api.csproj -- --seed

# 启动后端服务器
dotnet watch run --project BookingSystem.Api.csproj
```

后端将运行在 `http://localhost:5000`

**默认管理员凭据:**
- 邮箱: `admin@massage.com`
- 密码: `admin123`
- ⚠️ **请在首次登录后立即更改密码！**

#### 2. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 API URL 和 Stripe 公钥

# 启动前端开发服务器
npm run dev
```

前端将运行在 `http://localhost:3000`

## 环境变量配置

### 后端 (.env)

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bookingsys
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT 密钥（生产环境请更改！）
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production

# Stripe（测试模式）
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# 邮件（可选，用于通知）
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App / 前端
APP_BASE_URL=http://localhost:3000
SUPPORT_EMAIL=support@example.com
FRONTEND_URLS=http://localhost:3000,http://localhost:3001
```

### 前端 (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## 开发进度

✅ **Phase 1: 基础架构（已完成）**
- ✅ 后端 ASP.NET Core 服务器
- ✅ MySQL 数据库和迁移
- ✅ 管理员认证 (JWT)
- ✅ React 前端框架
- ✅ 管理员登录页面和仪表板

✅ **Phase 2: 时间可用性管理（已完成）**
- ✅ 营业时间管理
- ✅ 屏蔽时间管理
- ✅ 客户端可预约时间查询

✅ **Phase 3-6: 准上线版主链路（已完成）**
- ✅ 预约创建改为先支付后确认
- ✅ Stripe PaymentIntent + Webhook 回写
- ✅ 管理员预约列表、详情、状态更新、直接改期
- ✅ 客户列表与详情
- ✅ 客户改期申请与管理员审核
- ✅ 基础邮件通知

## API 端点

### 公共端点（已实现）
- `GET /health` - 健康检查
- `GET /api/bookings/service-types`
- `POST /api/bookings`
- `GET /api/bookings/:id`
- `GET /api/bookings/manage/:token`
- `POST /api/bookings/manage/:token/reschedule-request`
- `GET /api/availability/slots`
- `POST /api/webhooks/stripe`

### 管理员端点（已实现）
- `POST /api/admin/auth/login` - 管理员登录
- `POST /api/admin/auth/refresh` - 刷新令牌
- `GET /api/admin/auth/me` - 获取当前管理员信息
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

### 核心表
- `customers` - 客户信息
- `bookings` - 预约记录（带排他约束防止重复预订）
- `payments` - Stripe 支付记录
- `availability_blocks` - 屏蔽时间段
- `business_hours` - 每周营业时间
- `admins` - 管理员用户
- `service_types` - 服务类型和价格

## 测试

访问应用:
- **客户页面**: http://localhost:3000
- **管理员登录**: http://localhost:3000/admin/login
- **管理员仪表板**: http://localhost:3000/admin/dashboard

## 安全注意事项

- ✅ 永远不要将 `.env` 文件提交到版本控制
- ✅ 首次登录后立即更改默认管理员密码
- ✅ 生产环境使用强 JWT 密钥
- ✅ 生产环境必须启用 HTTPS（Stripe 要求）
- ✅ 使用 Stripe 测试密钥进行开发

## 故障排除

### 后端无法连接数据库
- 确保 MySQL 正在运行
- 检查 `.env` 中的数据库凭据
- 确认数据库 `bookingsys` 已创建

### 前端无法连接后端
- 确保后端服务器正在运行
- 检查 `VITE_API_URL` 是否正确
- 检查 CORS 设置

### 管理员无法登录
- 确认已运行 `dotnet run --project BookingSystem.Api.csproj -- --seed`
- 使用默认凭据：`admin@massage.com` / `admin123`
- 检查后端日志中的错误信息

## 许可证

ISC

## 支持

如有问题，请查看:
- 后端 README: [backend/README.md](backend/README.md)
