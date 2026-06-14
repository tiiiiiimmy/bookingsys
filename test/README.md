# 端到端测试套件 (E2E Test Suite)

本目录是预约系统（booking system）的**前端端到端（E2E）自动化测试**。测试用真实浏览器驱动前端，
打通到一个**真实运行的 .NET 后端**，并直接读取 **MySQL 测试库**做数据断言；第三方支付（Stripe）全程 mock。

> 文档全部在 `doc/`，测试代码全部在本目录。运行后报告见 `doc/reports/`（每次运行带编号+时间）。

---

## 1. 测什么 (Coverage)

四个业务模块，断言贯穿 **UI（界面状态）→ API（接口/webhook）→ DB（数据库记录）** 三层：

| 模块 | 场景 | 关键断言 |
|---|---|---|
| 预约 Booking | 下单 + 支付成功 / 支付失败 / 非法签名 webhook 被拒 | 确认页徽章 + `bookings.status` + `payments.status` |
| 改期 Reschedule | 客户申请改期 + 管理员审批通过 | `booking_reschedule_requests.status=approved` |
| 产品下单 Order | 下单 + 支付成功 | 确认页徽章 + `product_orders.status=paid` |
| 管理员登录 Admin | 正确凭据成功 / 错误密码失败 | 跳转 dashboard / 显示错误提示 |

当前已自动化 7 个场景（最新运行 Run #003 全绿）。完整用例清单与待实现 backlog 见
[`doc/test-cases.md`](doc/test-cases.md)，测试设计见 [`doc/test-design.md`](doc/test-design.md)。

---

## 2. 用什么技术 (Tech Stack)

- **Playwright** (`@playwright/test`) —— 浏览器自动化与测试执行器（仅用 Chromium）。
- **playwright-bdd** —— BDD：把 Gherkin `.feature` 编译成可执行 spec。`bddgen` 生成产物到 `.features-gen/`。
- **TypeScript**（ESM）—— 全套测试代码。
- **mysql2/promise** —— 测试内直连 MySQL 8 做数据库断言与清理。
- **.NET 10 + MySQL 8** —— 被测后端；测试自动用测试库拉起后端进程。
- 无 Jest / Vitest。统一用 Playwright 一套执行器。

---

## 3. 怎么设计 (Design)

### BDD 三层结构
```
features/**/*.feature   Gherkin 业务场景（人类可读的"测什么"）
        │  bddgen 编译
steps/**/*.ts           步骤定义：把 Gherkin 句子绑定到操作（Given/When/Then）
pages/*.ts              页面对象（Page Object）：封装某个页面的选择器与动作
support/*.ts            基础设施：环境、数据库、Stripe mock、后端控制、fixtures
```

- **页面对象**：每个页面（BookingPage / BookingConfirmationPage / AdminLoginPage / …）封装自己的
  `data-testid` 选择器和动作，步骤定义只调它们的方法，UI 改动只需改一处。
- **data-testid 优先**：测试触达的每个元素都加了 `data-testid`，状态徽章额外带 `data-status` 属性，
  断言不依赖文案/样式。
- **fixtures**（`support/fixtures.ts`）：注入页面对象、每个场景唯一的客户邮箱（`cust+<时间戳>@test.local`
  做数据隔离），并在浏览器层 `route.abort()` 掉 `stripe.com`（支付已全 mock，无需加载真实 Stripe.js）。

### Stripe 全程 mock（不调真实外部服务）
两段配合，测试完全确定、可离线：
1. **后端** `STRIPE_FAKE_PAYMENTS=true`：创建 PaymentIntent 时返回合成对象（`pi_fake_<guid>`），不打 Stripe API。
2. **测试** `support/stripe-mock.ts`：用我们自己掌握的 `STRIPE_WEBHOOK_SECRET` **伪造已签名的 webhook**
   （`payment_intent.succeeded` / `payment_intent.payment_failed`）POST 给后端，从而确定性地驱动支付结果；
   另有一条故意用非法签名验证后端返回 400。

### 串行执行
所有场景共享同一个测试库、争抢同样的预约时段，因此 `workers: 1`、`fullyParallel: false`
串行执行；`retries: 2`、单用例 `timeout: 90s` 作为冷启动/慢加载的容错。

---

### 测试分层 (Tagging)
用 Gherkin 标签分两档，不另设第三档：

- **`@smoke`** —— 每模块挑一条核心 happy path（预约支付成功 / 产品下单成功 / 管理员登录成功），
  跑得最快最稳，用于改动后快速验证与合并门禁。`npm run test:smoke`（即 `playwright test --grep @smoke`）。
- **回归 (regression)** —— 默认即全量，不带过滤就是回归。`npm run test:e2e` / `npm run test:regression`。

需要"验证某个具体功能"时用 `--grep` 按标题/标签临时筛选即可，不必固化成单独一类。
负例/边界类（表单校验、可用性负例等）**不进 @smoke**。

---

## 4. 怎么管理前后端 (Servers)

Playwright 的 `webServer` 自动管起两个服务（见 `playwright.config.ts`），**无需手动启动**：

| 服务 | 启动方式 | 端口 | 复用策略 |
|---|---|---|---|
| 后端 .NET | `dotnet run --project BookingSystem.Api.csproj`，注入测试环境变量 | `:5001`（取自 `API_URL`） | `reuseExistingServer: false` —— 永远拉起自己的测试后端 |
| 前端 Vite | `npm run dev`（在 `../frontend`） | `:3000` | `reuseExistingServer: true` —— `:3000` 未启动时自动拉起，已启动则直接复用 |

- 后端就绪探针用 `/health`（不依赖 DB），因为后端在 `globalSetup` 跑 migrate+seed **之前**就启动。
- 后端进程通过 `backendProcessEnv()` 注入测试专用的 `DB_*`、`STRIPE_*`、`ADMIN_*`、`PORT`、
  `STRIPE_FAKE_PAYMENTS=true`。配合后端 `EnvLoader`「环境变量优先于 .env」的修复，**无需改动
  `backend/.env`** 即可让测试后端指向测试库。
- 本地若有 HTTP 代理（如 Clash `127.0.0.1:7897`），config 会自动把 `localhost` 加入 `NO_PROXY`，
  避免就绪探测被代理 502。

> ⚠️ 运行前请**停掉占用 `:5001` 的开发后端**（否则测试拉不起自己的后端）。前端 `:3000` 可保留复用，
> 但若长时间运行 / 大量 HMR 后偶发白屏，重启前端 dev server 即可（详见 Run #003 报告 §4）。

---

## 5. 怎么管理数据 (Test Data)

- **独立测试库**：通过 `DB_NAME`（如 `bookingsys_test`）隔离。`support/env.ts` 有**硬性安全护栏**：
  库名不含 `test` 直接抛错拒绝运行，杜绝误伤开发/生产库。
- **migrate + seed**：`support/global-setup.ts` 在整套测试开始前（且早于 webServer）跑一次
  `dotnet run -- --migrate` 和 `-- --seed`，建立基线数据：管理员账号、3 个服务项目、营业时间（周一–周四 09:00–17:00）。
- **唯一化 + 自动清理**：每个场景用唯一客户邮箱；`support/db.ts` 提供按邮箱清理的 `cleanupCustomer()` /
  `cleanupProductOrder()`（按外键级联顺序删 payments → reschedule_requests → bookings → customers）。
- **直连断言**：`support/db.ts` 用 mysql2 连接池提供 `getBookingByEmail()`、`getProductOrderByEmail()`、
  `getRescheduleRequestByBookingId()`、`getManageToken()` 等，对关键流程校验真实库记录。

---

## 6. 怎么启动 (Quick Start)

### 前置条件
- Node.js（含 npm）、.NET 10 SDK、可访问的 MySQL 8。
- 已创建测试库（库名需包含 `test`），账号有读写权限。

### 步骤
```bash
cd test

# 1. 安装依赖（含 Playwright 浏览器）
npm install
npx playwright install chromium

# 2. 配置环境：复制示例并按本机填写
cp .env.test.example .env.test
#   重点：DB_NAME（含 test）、DB_USER/DB_PASSWORD、API_URL(端口=5001)、
#         STRIPE_WEBHOOK_SECRET（任意值，测试自洽）、ADMIN_EMAIL/PASSWORD（与 seed 一致）
#   注意示例里 API_URL 端口是 5000，本项目后端用 5001，请改为 http://localhost:5001/api

# 3. 确保 :5001 没有开发后端占用；MySQL 已启动

# 4. 运行全部 E2E（先 bddgen 生成 spec，再跑 Playwright）
npm run test:e2e

# 可选：UI 模式调试 / 查看上次 HTML 报告
npm run test:e2e:ui
npm run test:report
```

### npm scripts
| 命令 | 作用 |
|---|---|
| `npm run test:e2e` | `bddgen` 生成 spec → `playwright test` 跑全部场景 |
| `npm run test:smoke` | 仅跑 `@smoke` 标签的核心场景（快速验证 / 门禁） |
| `npm run test:regression` | 全量回归（等同 `test:e2e`） |
| `npm run test:e2e:ui` | Playwright UI 模式（可视化调试） |
| `npm run test:report` | 打开最近一次 Playwright HTML 报告 |

---

## 7. 目录结构 (Layout)

```
test/
├── README.md                 本文件
├── package.json              依赖与脚本
├── playwright.config.ts      执行器配置：webServer / globalSetup / 串行 / 重试 / 代理绕过
├── tsconfig.json             TS（ESM, moduleResolution: Bundler）
├── .env.test(.example)       环境变量（真实值不入库，见 .gitignore）
├── features/                 Gherkin 场景（.feature）
│   ├── booking/  booking.feature, reschedule.feature
│   ├── order/    product-order.feature
│   └── admin/    login.feature
├── steps/                    步骤定义（*.steps.ts）
├── pages/                    页面对象（Page Object）
├── support/                  基础设施
│   ├── env.ts                环境配置 + 测试库安全护栏 + backendProcessEnv()
│   ├── global-setup.ts       套件级 migrate + seed
│   ├── backend.ts            一次性 dotnet 命令 / URL 轮询
│   ├── db.ts                 mysql2 连接池 + 查询/清理助手
│   ├── stripe-mock.ts        伪造并签名 Stripe webhook
│   ├── api.ts                后端 API 助手（管理员登录 / 审批改期）
│   └── fixtures.ts           Playwright/BDD fixtures（页面对象、唯一邮箱、拦截 stripe.com）
└── doc/                      所有测试文档
    ├── test-design.md            测试设计
    ├── test-cases.md             人类可读用例清单 + 待实现 backlog
    ├── test-implementation-plan.md      1.0 实施计划
    ├── test-implementation-plan-2.0.md  2.0 实施计划（扩展场景 + 免登录 fixture）
    ├── test-report.md            报告索引（最新在上）
    └── reports/                  每次运行的报告（run-NNN-YYYY-MM-DD.md）
```

---

## 8. 运行报告 (Reports)

每次运行产出一份带**运行编号 + 时间**的报告，存于 `doc/reports/`，并登记在索引
[`doc/test-report.md`](doc/test-report.md)。最新 **Run #003**：7 passed / 0 failed / 0 flaky，
覆盖预约、改期、产品下单、管理员登录，全程 mock Stripe、不调外部服务。
