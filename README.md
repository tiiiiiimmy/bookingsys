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
- 在线支付确认预约
- 接收预约确认

**管理员功能:**
- 在自定义日历中查看所有预约
- 管理预约（改期、取消）
- 设置可用时间（屏蔽不工作的日期）
- 手动处理退款
- 查看客户历史记录

## 技术栈

- **后端**: Node.js + Express + MySQL
- **前端**: React (Vite)
- **支付**: Stripe
- **认证**: JWT

## 项目结构

```
bookingsys/
├── backend/          # Node.js API 服务器
│   ├── src/
│   │   ├── config/          # 数据库、Stripe 配置
│   │   ├── controllers/     # 请求处理器
│   │   ├── routes/          # API 路由
│   │   ├── services/        # 业务逻辑
│   │   ├── middleware/      # 认证、验证、错误处理
│   │   ├── database/        # 迁移和种子数据
│   │   └── server.js        # 服务器入口
│   └── package.json
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

- Node.js 18+
- MySQL 14+
- Stripe 账户（用于支付）

### 安装步骤

#### 1. 后端设置

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写数据库和 Stripe 配置

# 创建 MySQL 数据库
mysql -u root -p
CREATE DATABASE bookingsys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
\q

# 运行数据库迁移
npm run migrate

# 种子数据（创建服务类型、营业时间、管理员用户）
npm run seed

# 启动后端服务器
npm run dev
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
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bookingsys

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

# 前端 URL
FRONTEND_URL=http://localhost:3000
```

### 前端 (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## 开发进度

✅ **Phase 1: 基础架构（已完成）**
- ✅ 后端 Express 服务器
- ✅ MySQL 数据库和迁移
- ✅ 管理员认证 (JWT)
- ✅ React 前端框架
- ✅ 管理员登录页面和仪表板

🔜 **接下来的步骤 (Phase 2-8):**
- Phase 2: 可用时间管理
- Phase 3: 客户预约流程
- Phase 4: Stripe 支付集成
- Phase 5: 管理员预约管理
- Phase 6: 客户管理和邮件通知
- Phase 7: 优化和生产准备
- Phase 8: 部署

详细的实现计划请查看：[/root/.claude/plans/refactored-noodling-pearl.md](/root/.claude/plans/refactored-noodling-pearl.md)

## API 端点

### 公共端点（已实现）
- `GET /health` - 健康检查

### 管理员端点（已实现）
- `POST /api/admin/auth/login` - 管理员登录
- `POST /api/admin/auth/refresh` - 刷新令牌
- `GET /api/admin/auth/me` - 获取当前管理员信息

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
- 确认已运行 `npm run seed`
- 使用默认凭据：`admin@massage.com` / `admin123`
- 检查后端日志中的错误信息

## 许可证

ISC

## 支持

如有问题，请查看:
- 后端 README: [backend/README.md](backend/README.md)
- 实现计划: [/root/.claude/plans/refactored-noodling-pearl.md](/root/.claude/plans/refactored-noodling-pearl.md)
