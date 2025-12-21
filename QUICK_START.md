# 快速启动指南

## MySQL 数据库迁移完成！✅

系统已从 PostgreSQL 成功迁移到 MySQL。

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

# 运行数据库迁移
npm run migrate

# 创建初始数据（管理员、服务类型、营业时间）
npm run seed

# 启动开发服务器
npm run dev
```

**预期输出:**
```
✓ MySQL database connection successful
✓ Server running on port 5000 in development mode
```

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

- ✅ Node.js + Express
- ✅ **MySQL 8.0+** (已从 PostgreSQL 迁移)
- ✅ React 19
- ✅ React Router v7
- ✅ Axios
- ✅ Stripe (待配置)
- ✅ JWT 认证

## 下一步

系统已准备就绪！您可以：

1. **测试当前功能**: 登录管理后台查看仪表板
2. **继续开发**: Phase 2 - 时间可用性管理
3. **配置 Stripe**: 添加真实的支付密钥

祝开发顺利！🚀
