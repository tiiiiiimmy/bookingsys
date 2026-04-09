# 快速启动指南

## 当前版本

当前仓库已完成：
- .NET 10 + MySQL 8 后端
- React/Vite 前端
- Stripe 先支付后确认链路
- 管理员预约/客户管理
- 客户改期申请

## 启动步骤

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

### 2. 启动后端

```bash
# 进入后端目录
cd /var/www/bookingsys/backend

# 复制环境变量模板
cp .env.example .env
# 至少配置 DB_*、JWT_*、FRONTEND_URLS
# 如需完整支付演示，还要配置 Stripe 和 SMTP

# 运行数据库迁移
dotnet run --project BookingSystem.Api.csproj -- --migrate

# 创建初始数据（管理员、服务类型、营业时间）
dotnet run --project BookingSystem.Api.csproj -- --seed

# 启动开发服务器
dotnet watch run --project BookingSystem.Api.csproj
```

后端默认运行在 `http://localhost:5000`

### 3. 启动前端

**打开新终端窗口:**

```bash
# 进入前端目录
cd /var/www/bookingsys/frontend

# 启动开发服务器
npm run dev
```

**预期输出:**
```
VITE v7.x.x ready in XXX ms

➜  Local:   http://localhost:3000/
```

### 4. 访问应用

- **客户主页**: http://localhost:3000/
- **管理员登录**: http://localhost:3000/admin/login
- **客户预约确认页**: http://localhost:3000/booking/confirmation/:bookingId
- **客户预约管理页**: 通过邮件里的 `/booking/manage/:token` 链接访问

### 5. 管理员登录凭据

```
邮箱: admin@massage.com
密码: admin123
```

⚠️ **首次登录后请更改密码！**

## 验证数据库

```bash
# 查看所有表
mysql -u root -p bookingsys -e "SHOW TABLES;"

# 查看管理员
mysql -u root -p bookingsys -e "SELECT id, email, first_name FROM admins;"

# 查看服务类型
mysql -u root -p bookingsys -e "SELECT * FROM service_types;"

# 查看营业时间
mysql -u root -p bookingsys -e "SELECT * FROM business_hours;"
```

## 常见问题

### 前端 React 错误

如果看到 "React is not defined" 错误：

```bash
cd frontend
npm install
# 然后重启: npm run dev
```

### MySQL 连接失败

检查:
1. MySQL 正在运行: `sudo service mysql status`
2. 数据库已创建: 见步骤 1
3. `.env` 文件中的凭据正确

### 端口已被占用

如果端口 5000 或 3000 被占用：

**后端 (.env):**
```
PORT=5001
```

**前端 (vite.config.js):**
```javascript
server: { port: 3001 }
```

## 技术栈

- ✅ .NET 10 + ASP.NET Core
- ✅ **MySQL 8.0+** (已从 PostgreSQL 迁移)
- ✅ React 19
- ✅ React Router v7
- ✅ Axios
- ✅ Stripe (待配置)
- ✅ JWT 认证

## 建议验证顺序

1. 管理员登录后台，确认仪表板、预约管理、客户管理可以打开
2. 创建一条预约，确认能拿到 Stripe 支付页
3. 通过 Stripe 测试卡完成支付，检查预约是否变为 `confirmed`
4. 打开客户管理链接，提交一条改期申请，再到后台审核
