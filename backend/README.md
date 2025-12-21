# 按摩预约系统 - 后端 API

基于 Node.js + Express 的后端服务器，使用 MySQL 数据库和 Stripe 支付集成。

## 前置要求

- Node.js 18+
- **MySQL 8.0+** (或 MariaDB 10.5+)
- Stripe 账户（用于支付）

## 安装

1. 安装依赖:
```bash
npm install
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
npm run migrate
```

5. 种子数据:
```bash
npm run seed
```

这将创建:
- 服务类型（30/60/90分钟，价格）
- 营业时间（周四和周日，9 AM - 5 PM）
- 初始管理员用户

## 运行服务器

开发模式（自动重载）:
```bash
npm run dev
```

生产模式:
```bash
npm start
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

# 邮件（可选，用于开发）
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 管理员用户（用于初始种子）
ADMIN_EMAIL=admin@massage.com
ADMIN_PASSWORD=admin123
```

## API 端点

### 公共端点
- `GET /health` - 健康检查

### 管理员端点
- `POST /api/admin/auth/login` - 管理员登录
- `POST /api/admin/auth/refresh` - 刷新令牌
- `GET /api/admin/auth/me` - 获取当前管理员

更多端点将在后续阶段添加。

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
├── src/
│   ├── config/           # 数据库、Stripe 配置
│   ├── controllers/      # 请求处理器
│   ├── database/         # 迁移和种子
│   ├── middleware/       # 认证、验证、错误处理
│   ├── models/           # 数据模型
│   ├── routes/           # API 路由
│   ├── services/         # 业务逻辑
│   ├── utils/            # 工具函数和常量
│   └── server.js         # Express 应用入口
├── .env                  # 环境变量
├── .env.example          # 环境变量模板
└── package.json
```

## 开发进度

✅ **Phase 1: 基础架构（已完成）**
- 后端结构
- MySQL 数据库
- 管理员认证

🔜 **下一步:**
- 可用性管理 API
- 客户预约流程
- Stripe 支付集成

## 测试

```bash
npm test
```

（测试将在 Phase 7 添加）

## 安全注意事项

- 永远不要提交 `.env` 到版本控制
- 首次登录后立即更改默认管理员密码
- 生产环境使用强 JWT 密钥
- 生产环境启用 HTTPS（Stripe 要求）

## 许可证

ISC
