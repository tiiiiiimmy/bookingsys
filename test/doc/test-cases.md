# 测试用例清单 (Test Cases)

Date: 2026-06-14 · 模块: 前端 E2E (Playwright + BDD)

> 可执行用例为 `test/features/**/*.feature` 中的 Gherkin 场景，本文档是其人类可读版本。
> 状态来源: `test/doc/test-report.md`（✅ 通过 / ❌ 失败）。
> 通用前置条件: 后端运行于 `:5001`（`STRIPE_FAKE_PAYMENTS=true`），前端运行于 `:3000`，
> 测试库 `bookingsys_test` 已 migrate + seed（管理员、3 个服务项目、营业时间 周一–周四 09:00–17:00）。
> 每个用例使用唯一化客户邮箱，结束后自动清理。

---

## 模块 A：在线预约 (Booking)

来源: `features/booking/book-massage.feature`

### TC-BK-01 预约成功并支付成功
- 前置: 在预约页 `/booking`。
- 步骤:
  1. 选择一个时长为 30 分钟倍数的服务（如 60 分钟）。
  2. 前进到下一周（默认周可能全部为过去日期）。
  3. 选择第一个可预约时段。
  4. 填写客户信息（姓名/邮箱/电话）并提交，捕获 `bookingId` + `clientSecret`。
  5. 伪造并发送已签名的 `payment_intent.succeeded` webhook。
- 预期: 确认页状态徽章 `data-status=confirmed`；数据库中该预约 `status=confirmed`。
- 自动化: `Book a massage › Customer books an available slot and payment succeeds`
- 状态: ❌（提交捕获在首次执行时返回空，疑似顺序/首请求相关，见报告 §4.3）

### TC-BK-02 支付失败时预约不被确认
- 前置: 在预约页。
- 步骤: 同 TC-BK-01 第 1–4 步；随后发送 `payment_intent.payment_failed` webhook。
- 预期: 数据库中该预约 `status` 不为 `confirmed`。
- 自动化: `Book a massage › Payment fails and the booking is not confirmed`
- 状态: ✅

### TC-BK-03 非法签名的 webhook 被拒绝
- 前置: 在预约页。
- 步骤: 同 TC-BK-01 第 1–4 步；随后发送签名非法的 webhook。
- 预期: webhook 接口返回 HTTP 400；数据库中该预约 `status` 不为 `confirmed`。
- 自动化: `Book a massage › A webhook with an invalid signature is rejected`
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
- 状态: ❌（登录后仍停留在 `/admin/login`，疑与 401 拦截器硬跳转或种子凭据相关，见报告 §4.2）

### TC-AD-02 错误密码登录失败并提示
- 前置: 在管理员登录页。
- 步骤: 以 `admin@massage.com` + 错误密码 `wrong-password` 登录。
- 预期: 显示登录错误提示 `data-testid=admin-login-error`。
- 自动化: `Admin login › Admin sign-in fails with wrong password`
- 状态: ❌（应用 `api.js` 的 401 拦截器执行 `window.location.href='/admin/login'` 整页跳转，错误提示被清空，见报告 §4.1）

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
- 状态: ❌（依赖管理员鉴权，受 TC-AD-01/02 阻塞，见报告 §4.4）

---

## 覆盖汇总

| 用例 | 模块 | 自动化 | 状态 |
|---|---|---|---|
| TC-BK-01 | 预约 | ✓ | ❌ |
| TC-BK-02 | 预约 | ✓ | ✅ |
| TC-BK-03 | 预约 | ✓ | ✅ |
| TC-OD-01 | 产品下单 | ✓ | ✅ |
| TC-AD-01 | 管理员登录 | ✓ | ❌ |
| TC-AD-02 | 管理员登录 | ✓ | ❌ |
| TC-RS-01 | 改期 | ✓ | ❌ |

## 设计阶段列出但尚未实现的用例（来自 `test-design.md` §9 待办）

- 预约: 时段已被占用、表单校验错误。
- 管理员: 查看预约列表、管理可用时间。

> 这些用例在设计文档中规划，但本阶段未实现自动化；可作为后续补充。
