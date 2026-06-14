# 测试用例清单 (Test Cases)

Date: 2026-06-15 · 模块: 前端 E2E (Playwright + BDD)

> 可执行用例为 `test/features/**/*.feature` 中的 Gherkin 场景，本文档是其人类可读版本。
> 状态来源: 最新运行 Run #005（54 场景全绿，含 1 个 xfail，见 `test/doc/reports/`）。
> 状态图例：✅ 已自动化且通过 ｜ ⚠️ 已自动化但记录为预期失败（xfail，后端缺陷）｜ ⬜ 未自动化（后端缺口）。
> 通用前置条件: 后端运行于 `:5001`（`STRIPE_FAKE_PAYMENTS=true`），前端运行于 `:3000`，
> 测试库 `bookingsys_test` 已 migrate + seed（管理员、3 个服务项目、营业时间 周一–周四 09:00–17:00）。
> 每个用例使用唯一化客户邮箱，结束后自动清理。

---

## 模块 A：在线预约 (Booking)

来源: `features/booking/booking.feature`

### TC-BK-01 预约成功并支付成功
- 前置: 在预约页 `/booking`。
- 步骤:
  1. 选择一个时长为 30 分钟倍数的服务（如 60 分钟）。
  2. 前进到下一周（默认周可能全部为过去日期）。
  3. 选择第一个可预约时段。
  4. 填写客户信息（姓名/邮箱/电话）并提交，捕获 `bookingId` + `clientSecret`。
  5. 伪造并发送已签名的 `payment_intent.succeeded` webhook。
- 预期: 确认页状态徽章 `data-status=confirmed`；数据库中该预约 `status=confirmed`。
- 自动化: `Booking › Customer books an available slot and payment succeeds`
- 状态: ✅（Run #003）

### TC-BK-02 支付失败时预约不被确认
- 前置: 在预约页。
- 步骤: 同 TC-BK-01 第 1–4 步；随后发送 `payment_intent.payment_failed` webhook。
- 预期: 数据库中该预约 `status` 不为 `confirmed`。
- 自动化: `Booking › Payment fails and the booking is not confirmed`
- 状态: ✅

### TC-BK-03 非法签名的 webhook 被拒绝
- 前置: 在预约页。
- 步骤: 同 TC-BK-01 第 1–4 步；随后发送签名非法的 webhook。
- 预期: webhook 接口返回 HTTP 400；数据库中该预约 `status` 不为 `confirmed`。
- 自动化: `Booking › A webhook with an invalid signature is rejected`
- 状态: ✅

---

## 模块 B：产品下单 (Product Order)

来源: `features/order/product-order.feature`

### TC-OD-01 产品下单并支付成功
- 前置: 在产品下单页 `/order?product=White Magic`。
- 步骤:
  1. 填写下单客户信息（姓名/邮箱）。
  2. 提交订单，捕获 `orderId` + `clientSecret`。
  3. 发送 `payment_intent.succeeded` webhook。
- 预期: 确认页状态徽章 `data-status=paid`；数据库中该订单 `status=paid`。
- 自动化: `Place a product order › Customer orders a product and payment succeeds`
- 状态: ✅

---

## 模块 C：管理员登录 (Admin Login)

来源: `features/admin/login.feature`

### TC-AD-01 正确凭据登录成功
- 前置: 在管理员登录页 `/admin/login`。
- 步骤: 以种子管理员 `admin@massage.com / admin123` 登录，等待登录响应。
- 预期: 跳转到 `/admin/dashboard`，并可访问 `/admin/bookings`。
- 自动化: `Admin login › Admin signs in with valid credentials`
- 状态: ✅（Run #003；此前失败原因与修复见 run-002 §4.2）

### TC-AD-02 错误密码登录失败并提示
- 前置: 在管理员登录页。
- 步骤: 以 `admin@massage.com` + 错误密码 `wrong-password` 登录。
- 预期: 显示登录错误提示 `data-testid=admin-login-error`。
- 自动化: `Admin login › Admin sign-in fails with wrong password`
- 状态: ✅（Run #003；此前失败原因与修复见 run-002 §4.1）

---

## 模块 D：改期 (Reschedule)

来源: `features/booking/reschedule.feature`

### TC-RS-01 客户申请改期，管理员审批通过
- 前置: 已存在一个已确认的预约（复用 TC-BK-01 的创建+成功 webhook），并取得其管理 token。
- 步骤:
  1. 打开 `/booking/manage/:token`，选择新日期 → 选择时段 → 提交改期申请。
  2. 通过管理员 API（`POST /admin/reschedule-requests/{id}/approve`，需管理员令牌）审批通过。
- 预期: 数据库中该改期申请 `status=approved`。
- 自动化: `Reschedule a booking › Customer requests a reschedule and admin approves it`
- 状态: ✅（Run #003）

---

## 覆盖汇总（Run #005，54 个可执行场景）

前文 TC-*-01 为各模块的核心 happy path（含 `@smoke` 标签），其余扩展用例见下方 backlog；
两者均已自动化。按 feature 文件统计的可执行场景数：

| 模块 | 来源 feature | 场景数 | 状态 |
|---|---|---|---|
| 预约 Booking | `booking/booking.feature` | 17 | ✅ |
| 预约并发/hold 过期 | `booking/concurrency.feature` | 3 | ✅ |
| 改期 Reschedule | `booking/reschedule.feature` | 11 | ✅（1 个 xfail：TC-RS-10） |
| 产品下单 Order | `order/product-order.feature` | 11 | ✅ |
| 管理员登录 Admin | `admin/login.feature` | 2 | ✅ |
| 管理员会话 Admin | `admin/session.feature` | 5 | ✅ |
| 管理员后台管理 Admin | `admin/management.feature` | 5 | ✅ |
| **合计** | | **54** | **53 通过 + 1 xfail** |

## 扩展用例 Backlog（实现状态）

> 状态图例：✅ 已自动化且通过 ｜ ⚠️ 已自动化但为预期失败（xfail，后端缺陷）｜ ⬜ 未自动化（后端缺口）。
> 截至 Run #005，下列扩展场景除标注外均已自动化。

### 模块 A：预约 (Booking)

| ID | 场景 | 预期要点 | 状态 |
|---|---|---|---|
| TC-BK-01 | 单时段成功支付 | UI confirmed + `bookings.status=confirmed` + `payments.status=succeeded` | ✅ |
| TC-BK-02 | 支付失败不确认 | DB payment failed + booking 未确认 | ✅ |
| TC-BK-03 | 非法签名 webhook 被拒 | webhook 400 + booking 未确认 | ✅ |
| TC-BK-04 | 一次结账多时段 | 成功支付后组内每个 booking 均 confirmed | ✅ |
| TC-BK-05 | 支付失败 UI 文案 | UI 显示 payment-failed 文案（DB 层已由 TC-BK-02 覆盖） | ✅ |
| TC-BK-06 | 支付成功后立即看确认页 | webhook 未到时为 processing/pending，轮询后转 confirmed | ✅ |
| TC-BK-07 | 选已被占用时段 | confirmed/pending 占用的时段从可用列表消失（UI 不再提供，见 Phase 0.1） | ✅ |
| TC-BK-08 | 两客户同时抢同一时段（支付前） | A 先建 pending；B 在到达支付前被拦截（"no longer available"/冲突） | ✅ |
| TC-BK-09 | 两客户都到支付（并发确认） | A webhook 成功 confirm；B 后到 webhook 成功但 booking → cancelled（冲突/过期复核），非 confirmed | ✅ |
| TC-BK-10 | pending hold 过期后支付成功 | webhook 成功不 confirm；booking → cancelled，payment → succeeded（待人工复核/退款） | ✅ |
| TC-BK-11 | 表单校验 | 缺服务/时段、缺名/姓/邮箱/电话、邮箱格式、过去日期、非 30 分钟时长 | ✅ |
| TC-BK-12 | 可用性边界 | 休息日、封锁时段重叠、正好营业开始/结束的时段 | ✅ |

### 模块 D：改期 (Reschedule)

| ID | 场景 | 预期要点 | 状态 |
|---|---|---|---|
| TC-RS-01 | 申请 + 管理员审批通过 | DB 改期申请 `status=approved` | ✅ |
| TC-RS-02 | manage 页展示当前预约+历史并提交 | DB 一条 pending 改期申请 | ✅ |
| TC-RS-03 | 非法/未知 manage token | 显示加载错误，无表单操作 | ✅ |
| TC-RS-04 | cancelled/completed/no-show/arrived 预约 | 不能提交改期 | ✅ |
| TC-RS-05 | 同一预约二次 pending 申请 | 收到 existing-pending 冲突 | ✅ |
| TC-RS-06 | 打开后目标时段变不可用 | 提交被拒，不创建 pending | ✅ |
| TC-RS-07 | 管理员通过 UI 批准 | admin UI / 客户 manage UI / DB dates 三处一致 | ✅ |
| TC-RS-08 | 管理员拒绝 | 申请 rejected，DB dates 完全不变 | ✅ |
| TC-RS-09 | 复核已复核的申请 | 报错；dates 不再变 | ✅ |
| TC-RS-10 | 两管理员并发复核 | 先成功者胜；后者 already-reviewed/not-found（后端未加锁读，并发两次均成功 → xfail，详见 run-005 §4） | ⚠️ |
| TC-RS-11 | 存在多个 pending（种子/历史） | 批准其一会拒绝同 booking 其余 pending | ✅ |

### 模块 B：产品下单 (Product Order)

| ID | 场景 | 预期要点 | 状态 |
|---|---|---|---|
| TC-OD-01 | White Magic 成功支付 | UI + `product_orders.status=paid` | ✅ |
| TC-OD-02 | 各商品成功路径 | White Magic / Love Spell / Money Spell（可参数化） | ✅ |
| TC-OD-03 | 未知 product 查询 | 显示 "Product not found"，不创建 DB 行 | ✅ |
| TC-OD-04 | 即时 Stripe 确认失败 | 订单保持 pending，确认页保持 processing | ✅ |
| TC-OD-05 | 产品订单支付失败处理 | 设计上无 failed 状态：失败/未发 webhook 时订单保持 pending、UI 保持 processing（见 Phase 0.4） | ✅ |
| TC-OD-06 | 表单校验 | 必填名/姓/邮箱；可选电话/intention；邮箱格式错 | ✅ |

### 模块 C：管理员 (Admin)

| ID | 场景 | 预期要点 | 状态 |
|---|---|---|---|
| TC-AD-01 | 登录成功 | 跳转 dashboard + 存 token | ✅ |
| TC-AD-02 | 登录失败 | 留在登录页 + "Invalid credentials" | ✅ |
| TC-AD-03 | 无 token 访问 admin 路由 | 重定向 `/admin/login` | ✅ |
| TC-AD-04 | access 过期 + refresh 有效 | 自动刷新并停留在 bookings | ✅ |
| TC-AD-05 | refresh 过期/无效 | 清 token + 重定向 `/admin/login` | ✅ |
| TC-AD-06 | 同浏览器双 admin 页登出 | A 登出后 B 执行操作 → B 在 401 后重定向登录 | ✅ |
| TC-AD-07 | 预约列表筛选 | 按状态 + 搜索邮箱命中/排除目标行 | ✅ |
| TC-AD-08 | 预约详情 | 客户/服务/时间/支付状态/manage token/改期申请 | ✅ |
| TC-AD-09 | 管理员手动改期 | 校验时长；成功更新 DB，时长不匹配被拒且 DB 不变 | ✅ |
| TC-AD-10 | 管理可用性 | 营业日开关、起止时间、建/删封锁；公开时段反映变化 | ✅ |
| TC-AD-11 | 可用性负例 | 封锁 end<start（400）、删已删封锁（404）已覆盖；营业时间 start>end 后端**未校验**，作为已知缺口暂不自动化 | ⬜ |

> 说明：截至 Run #005，上述 backlog 已全部自动化，仅余两处与后端相关的缺口：
> - **TC-RS-10（⚠️ xfail）**：后端 `ApproveRescheduleRequestAsync` 用不加锁 `SELECT` 读取申请状态，并发两次批准均成功；断言保留为正确预期，场景打 `@fail`，待后端改加锁读后摘除。
> - **TC-AD-11（⬜ 部分）**：营业时间 `start > end` 后端当前不校验（见 Phase 0.4），该子例暂不自动化；其余可用性负例（block end<start、删已删 block）已覆盖。
