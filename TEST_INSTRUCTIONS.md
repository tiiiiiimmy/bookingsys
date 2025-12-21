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

# 首次运行需要设置数据库
npm run migrate  # 运行数据库迁移
npm run seed     # 创建初始数据

# 启动服务器
npm run dev
```

**预期输出:**
```
✓ MySQL database connection successful
✓ Server running on port 5000 in development mode
```

### 3. 启动前端服务器

在新终端窗口：

```bash
cd frontend
npm run dev
```

### 4. 测试管理员登录

- 访问: http://localhost:5173/admin/login
- 邮箱: `admin@massage.com`
- 密码: `admin123`

## 数据库变更说明

✅ **已从 PostgreSQL 切换到 MySQL**

主要变更:
- 数据库驱动: `pg` → `mysql2`
- 使用 MySQL 8.0+ 的所有特性
- InnoDB 引擎 + utf8mb4 字符集

Phase 1 已完成！（MySQL 版本）✨
