# CREDO W — FINAL EXECUTION PLAN
### الديدلاين: 15 مايو 2026 | 10 أيام | 50K Load Test

---

> **القاعدة الأساسية:**  
> كل يوم له deliverable واحد واضح — إما بيشتغل أو ما بيشتغلش.  
> مفيش "في process" في آخر اليوم. كل task إما ✅ أو 🔴 blocked.

---

## 📋 TECH STACK — النهائي (مش بنتغير)

```
Frontend:   Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
Backend:    Fastify + TypeScript + Prisma ORM
Database:   PostgreSQL 16
Cache:      Redis 7
Queue:      BullMQ (on Redis)
Realtime:   Socket.io
Auth:       JWT (15min) + Refresh Token (Redis, 30 days)
PIN:        argon2id
Monorepo:   Turborepo
Container:  Docker + Docker Compose
Deploy:     Railway / Render / VPS (DigitalOcean Droplet $24/mo)
Load Test:  k6
Monitoring: Sentry (errors) + Prometheus + Grafana (metrics)
```

---

## 🗂️ MONOREPO STRUCTURE

```
credo-w/
├── apps/
│   ├── web/          → Next.js frontend
│   └── api/          → Fastify backend
├── packages/
│   ├── db/           → Prisma schema + migrations + seed
│   ├── shared/       → Types, constants, utils (shared between web + api)
│   └── config/       → ESLint, TypeScript, Tailwind configs
├── docker-compose.yml
├── docker-compose.prod.yml
├── turbo.json
└── .env.example
```

---

## ⚡ MVP SCOPE — ما بنبنيه في 10 أيام

### ✅ في الـ MVP (Core Business)
| Feature | |
|---|---|
| Registration via referral link (side A/B/Auto) | ✅ |
| Login / Logout / Change Password | ✅ |
| Binary Tree Placement (atomic, race-condition safe) | ✅ |
| Admin activation / suspend / view users | ✅ |
| Product catalog + Categories | ✅ |
| Cart + Checkout (C Money payment) | ✅ |
| Orders management | ✅ |
| BV Flow on purchase (fan-out to all ancestors) | ✅ |
| Personal Volume tracking | ✅ |
| My Team (referrals table + genealogy table) | ✅ |
| Business Volume report (L vs R) | ✅ |
| Referral links (side selector + copy) | ✅ |
| Tree view (table-based, fast) | ✅ |
| Weekly Commission (team commission + carry) | ✅ |
| Direct Commission on package purchase | ✅ |
| Earnings Wallet + C Money Wallet | ✅ |
| Wallet transactions history | ✅ |
| C Money transfer (PIN-protected, atomic) | ✅ |
| Withdrawal request + admin processing | ✅ |
| Rank display (read-only, progress bar) | ✅ |
| Admin: commission run trigger + results | ✅ |
| Admin: manual bonus grant | ✅ |
| Vouchers (generate + redeem at checkout) | ✅ |
| Support ticket (basic form) | ✅ |
| In-app notifications (bell icon + WebSocket) | ✅ |
| Dashboard (BV widgets, rank card, quick actions) | ✅ |
| Audit log (all financial operations) | ✅ |
| System settings (commission rates, caps — DB-based) | ✅ |

### ❌ مش في الـ MVP (Post-May 15)
| Feature | |
|---|---|
| Interactive binary tree visualization (D3/ReactFlow) | Post-MVP |
| Pearls Wallet + Membership | Post-MVP |
| Level Bonus | Post-MVP |
| Fast Start Bonus | Post-MVP |
| Subscriptions | Post-MVP |
| Live Chat | Post-MVP |
| Marketing Tools | Post-MVP |
| Quick Coach integration | Post-MVP |
| Mobile App | Post-MVP |

---

## 📅 DAY-BY-DAY EXECUTION PLAN

---

### DAY 1 — 5 مايو (اليوم) | INFRASTRUCTURE
**Target:** الكود يشتغل locally — DB تشتغل، API ترد، Frontend يفتح

#### صباحاً (4 ساعات)
```bash
# 1. إنشاء الـ monorepo
npx create-turbo@latest credo-w
cd credo-w

# 2. إنشاء apps
# apps/api → Fastify + TypeScript
# apps/web → Next.js 14

# 3. packages/db → Prisma setup
```

**Schema كامل (packages/db/schema.prisma):**

```prisma
// كل التعديلات من الـ Audit Report مدمجة هنا

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ENUMS
enum UserRole    { CUSTOMER AMBASSADOR ADMIN }
enum UserStatus  { PENDING ACTIVE INACTIVE SUSPENDED }
enum Side        { LEFT RIGHT }
enum WalletType  { EARNINGS CMONEY }
enum OrderStatus { PENDING PROCESSING SHIPPED DELIVERED CANCELLED }
enum PayStatus   { PENDING PAID PARTIAL REFUNDED }
enum TxCategory  {
  DEPOSIT PURCHASE COMMISSION DIRECT_COMMISSION
  TEAM_COMMISSION RANK_BONUS TRANSFER_IN TRANSFER_OUT
  WITHDRAWAL REFUND ADJUSTMENT
}
enum CycleStatus { PENDING RUNNING COMPLETED FAILED }
enum WithdrawStatus { REQUESTED PROCESSING PAID REJECTED CANCELLED }
enum TicketStatus   { OPEN IN_PROGRESS RESOLVED CLOSED }

model User {
  id               String    @id @default(uuid())
  userId           String    @unique @map("user_id") // USR-XXXXXX
  username         String    @unique
  email            String    @unique
  passwordHash     String    @map("password_hash")
  cmoneyPinHash    String?   @map("cmoney_pin_hash")
  cmoneyPinAttempts Int      @default(0) @map("cmoney_pin_attempts")
  cmoneyLockedUntil DateTime? @map("cmoney_locked_until")
  role             UserRole  @default(AMBASSADOR)
  status           UserStatus @default(PENDING)
  title            String?
  fullName         String?   @map("full_name")
  nationalId       String?   @unique @map("national_id")
  phone            String?   @unique
  country          String?
  currency         String    @default("EGP")
  sponsorId        String?   @map("sponsor_id")
  profileImage     String?   @map("profile_image")
  totalPv          Int       @default(0) @map("total_pv")  // denormalized
  activeDate       DateTime? @map("active_date")
  lastLoginAt      DateTime? @map("last_login_at")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  sponsor         User?      @relation("Sponsorship", fields: [sponsorId], references: [id])
  referrals       User[]     @relation("Sponsorship")
  treeNode        TreeNode?
  wallets         Wallet[]
  orders          Order[]
  withdrawals     Withdrawal[]
  notifications   Notification[]
  adminPermission AdminPermission?

  @@map("users")
}

model TreeNode {
  id          String    @id @default(uuid())
  userId      String    @unique @map("user_id")
  parentId    String?   @map("parent_id")
  side        Side?
  depthLevel  Int       @default(0) @map("depth_level")
  path        String    // e.g. "/root_id/parent_id/this_id"
  placedAt    DateTime  @default(now()) @map("placed_at")

  user        User      @relation(fields: [userId], references: [id])
  parent      TreeNode? @relation("TreeChildren", fields: [parentId], references: [id])
  children    TreeNode[] @relation("TreeChildren")

  @@index([parentId, side])
  @@index([path])
  @@map("tree_nodes")
}

model ProductCategory {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  sortOrder Int      @default(0) @map("sort_order")
  products  Product[]
  @@map("product_categories")
}

model Product {
  id          String   @id @default(uuid())
  categoryId  String?  @map("category_id")
  name        String
  description String?
  priceEgp    Decimal  @map("price_egp") @db.Decimal(12,2)
  taxRate     Decimal  @default(14.0) @map("tax_rate") @db.Decimal(5,2)
  bvPoints    Int      @default(0) @map("bv_points")
  pvPoints    Int      @default(0) @map("pv_points")
  imageUrl    String?  @map("image_url")
  isActive    Boolean  @default(true) @map("is_active")
  isPackage   Boolean  @default(false) @map("is_package")
  stock       Int      @default(-1)
  createdAt   DateTime @default(now()) @map("created_at")

  category    ProductCategory? @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  @@map("products")
}

model Cart {
  id          String     @id @default(uuid())
  userId      String     @unique @map("user_id")
  voucherCode String?    @map("voucher_code")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  items       CartItem[]
  @@map("carts")
}

model CartItem {
  id        String  @id @default(uuid())
  cartId    String  @map("cart_id")
  productId String  @map("product_id")
  quantity  Int     @default(1)
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  @@unique([cartId, productId])
  @@map("cart_items")
}

model ShippingAddress {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  name           String?
  phone          String?
  country        String?
  governorate    String?
  city           String?
  zipCode        String?  @map("zip_code")
  address        String?
  isDefault      Boolean  @default(false) @map("is_default")
  createdAt      DateTime @default(now()) @map("created_at")
  orders         Order[]
  @@index([userId])
  @@map("shipping_addresses")
}

model Order {
  id              String     @id @default(uuid())
  orderRef        String     @unique @map("order_ref")
  userId          String     @map("user_id")
  shippingAddrId  String?    @map("shipping_addr_id")
  subtotal        Decimal    @db.Decimal(12,2)
  taxAmount       Decimal    @default(0) @map("tax_amount") @db.Decimal(12,2)
  discountAmount  Decimal    @default(0) @map("discount_amount") @db.Decimal(12,2)
  totalAmount     Decimal    @map("total_amount") @db.Decimal(12,2)
  totalBv         Int        @default(0) @map("total_bv")
  totalPv         Int        @default(0) @map("total_pv")
  voucherCode     String?    @map("voucher_code")
  paymentMethod   String?    @map("payment_method")
  paymentStatus   PayStatus  @default(PENDING) @map("payment_status")
  orderStatus     OrderStatus @default(PENDING) @map("order_status")
  bvCredited      Boolean    @default(false) @map("bv_credited")
  paidAt          DateTime?  @map("paid_at")
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")

  user            User       @relation(fields: [userId], references: [id])
  shippingAddr    ShippingAddress? @relation(fields: [shippingAddrId], references: [id])
  items           OrderItem[]
  bvLogs          BvLog[]

  @@index([userId, paymentStatus])
  @@map("orders")
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String  @map("order_id")
  productId String  @map("product_id")
  quantity  Int     @default(1)
  unitPrice Decimal @map("unit_price") @db.Decimal(12,2)
  bvPoints  Int     @default(0) @map("bv_points")
  pvPoints  Int     @default(0) @map("pv_points")
  subtotal  Decimal @db.Decimal(12,2)

  order     Order   @relation(fields: [orderId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
  @@map("order_items")
}

model Wallet {
  id          String     @id @default(uuid())
  userId      String     @map("user_id")
  walletType  WalletType @map("wallet_type")
  balance     Decimal    @default(0) @db.Decimal(14,2)
  totalEarned Decimal    @default(0) @map("total_earned") @db.Decimal(14,2)
  updatedAt   DateTime   @updatedAt @map("updated_at")

  user         User        @relation(fields: [userId], references: [id])
  transactions WalletTransaction[]

  @@unique([userId, walletType])
  @@map("wallets")
}

model WalletTransaction {
  id             String     @id @default(uuid())
  refNo          String     @unique @map("ref_no")
  walletId       String     @map("wallet_id")
  userId         String     @map("user_id")
  counterpartyId String?    @map("counterparty_id")
  amount         Decimal    @db.Decimal(14,2)  // positive=credit, negative=debit
  balanceAfter   Decimal    @map("balance_after") @db.Decimal(14,2)
  category       TxCategory
  description    String?
  orderId        String?    @map("order_id")
  commissionType String?    @map("commission_type")
  commissionId   String?    @map("commission_id")
  status         String     @default("SUCCESS")
  reversedBy     String?    @map("reversed_by")
  reversedAt     DateTime?  @map("reversed_at")
  createdAt      DateTime   @default(now()) @map("created_at")

  wallet         Wallet     @relation(fields: [walletId], references: [id])

  @@index([userId, createdAt(sort: Desc)])
  @@index([walletId, category])
  @@map("wallet_transactions")
}

model BvLog {
  id             String   @id @default(uuid())
  orderId        String   @map("order_id")
  buyerId        String   @map("buyer_id")
  beneficiaryId  String   @map("beneficiary_id")  // ancestor receiving BV credit
  side           Side
  bvAmount       Int      @map("bv_amount")
  depthFromBuyer Int      @default(1) @map("depth_from_buyer")
  cycleId        String?  @map("cycle_id")
  creditedAt     DateTime? @map("credited_at")  // null until BV delay passes
  isReversed     Boolean  @default(false) @map("is_reversed")
  createdAt      DateTime @default(now()) @map("created_at")

  order          Order    @relation(fields: [orderId], references: [id])

  @@index([beneficiaryId, side, cycleId])
  @@index([buyerId])
  @@map("bv_log")
}

model PersonalVolume {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  orderId   String?  @map("order_id")
  pvAmount  Int      @map("pv_amount")
  note      String?
  cycleId   String?  @map("cycle_id")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([userId, cycleId])
  @@map("personal_volume")
}

model CommissionCycle {
  id               String      @id @default(uuid())
  periodStart      DateTime    @map("period_start") @db.Date
  periodEnd        DateTime    @map("period_end") @db.Date
  status           CycleStatus @default(PENDING)
  startedBy        String?     @map("started_by")
  totalPaid        Decimal?    @map("total_paid") @db.Decimal(14,2)
  membersProcessed Int?        @map("members_processed")
  startedAt        DateTime?   @map("started_at")
  completedAt      DateTime?   @map("completed_at")
  teamCommissions  TeamCommission[]
  @@map("commission_cycles")
}

model TeamCommission {
  id             String   @id @default(uuid())
  cycleId        String   @map("cycle_id")
  userId         String   @map("user_id")
  rankAtTime     String?  @map("rank_at_time")
  leftBvTotal    Int      @default(0) @map("left_bv_total")
  rightBvTotal   Int      @default(0) @map("right_bv_total")
  leftCarryIn    Int      @default(0) @map("left_carry_in")
  rightCarryIn   Int      @default(0) @map("right_carry_in")
  payLegVolume   Int      @default(0) @map("pay_leg_volume")
  commissionRate Decimal? @map("commission_rate") @db.Decimal(5,2)
  commissionAmt  Decimal? @map("commission_amt") @db.Decimal(12,2)
  commissionPaid Decimal? @map("commission_paid") @db.Decimal(12,2)
  leftCarryOut   Int      @default(0) @map("left_carry_out")
  rightCarryOut  Int      @default(0) @map("right_carry_out")
  processed      Boolean  @default(false)
  paidAt         DateTime? @map("paid_at")
  createdAt      DateTime @default(now()) @map("created_at")

  cycle          CommissionCycle @relation(fields: [cycleId], references: [id])

  @@unique([cycleId, userId])
  @@index([userId, cycleId])
  @@map("team_commissions")
}

model Rank {
  id                    String   @id @default(uuid())
  name                  String
  levelOrder            Int      @unique @map("level_order")
  requiredPbv           Decimal  @map("required_pbv") @db.Decimal(12,2)
  requiredCv            Int      @default(0) @map("required_cv")
  requiredDirects       Int      @default(0) @map("required_directs")
  requiredDirectsPerSide Int     @default(0) @map("required_directs_per_side")
  teamCommissionRate    Decimal? @map("team_commission_rate") @db.Decimal(5,2)
  weeklyCapEgp          Decimal? @map("weekly_cap_egp") @db.Decimal(12,2)
  rankBonusEgp          Decimal? @map("rank_bonus_egp") @db.Decimal(12,2)
  iconUrl               String?  @map("icon_url")
  isActive              Boolean  @default(true) @map("is_active")
  userRanks             UserRank[]
  @@map("ranks")
}

model UserRank {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  rankId      String   @map("rank_id")
  achievedAt  DateTime @default(now()) @map("achieved_at")
  isCurrent   Boolean  @default(true) @map("is_current")

  rank        Rank     @relation(fields: [rankId], references: [id])

  @@index([userId, isCurrent])
  @@map("user_ranks")
}

model Voucher {
  id          String   @id @default(uuid())
  code        String   @unique
  type        String   @default("DISCOUNT_FIXED")
  value       Decimal? @db.Decimal(12,2)
  note        String?
  generatedFor String? @map("generated_for")
  status      String   @default("AVAILABLE")
  expiresAt   DateTime? @map("expires_at")
  redeemedAt  DateTime? @map("redeemed_at")
  redeemedBy  String?  @map("redeemed_by")
  createdBy   String?  @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  @@map("vouchers")
}

model PaymentAccount {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  accountType   String   @map("account_type")  // BANK, VODAFONE_CASH, INSTAPAY
  accountName   String?  @map("account_name")
  accountNumber String?  @map("account_number")
  bankName      String?  @map("bank_name")
  isDefault     Boolean  @default(false) @map("is_default")
  isVerified    Boolean  @default(false) @map("is_verified")
  createdAt     DateTime @default(now()) @map("created_at")

  withdrawals   Withdrawal[]
  @@index([userId])
  @@map("payment_accounts")
}

model Withdrawal {
  id               String          @id @default(uuid())
  refNo            String          @unique @map("ref_no")
  userId           String          @map("user_id")
  paymentAccountId String?         @map("payment_account_id")
  requestedAmount  Decimal         @map("requested_amount") @db.Decimal(12,2)
  processingFee    Decimal         @default(0) @map("processing_fee") @db.Decimal(12,2)
  payableAmount    Decimal?        @map("payable_amount") @db.Decimal(12,2)
  status           WithdrawStatus  @default(REQUESTED)
  adminNotes       String?         @map("admin_notes")
  paidOn           DateTime?       @map("paid_on")
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")

  user             User            @relation(fields: [userId], references: [id])
  paymentAccount   PaymentAccount? @relation(fields: [paymentAccountId], references: [id])

  @@index([userId, status])
  @@map("withdrawals")
}

model SupportTicket {
  id        String        @id @default(uuid())
  ticketRef String        @unique @map("ticket_ref")
  userId    String        @map("user_id")
  category  String?
  subject   String
  status    TicketStatus  @default(OPEN)
  replies   TicketReply[]
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")

  @@index([userId, status])
  @@map("support_tickets")
}

model TicketReply {
  id        String   @id @default(uuid())
  ticketId  String   @map("ticket_id")
  senderId  String   @map("sender_id")
  body      String
  createdAt DateTime @default(now()) @map("created_at")

  ticket    SupportTicket @relation(fields: [ticketId], references: [id])
  @@map("ticket_replies")
}

model Notification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  type      String
  title     String
  body      String?
  isRead    Boolean  @default(false) @map("is_read")
  data      Json?
  expiresAt DateTime? @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId, isRead])
  @@map("notifications")
}

model AuditLog {
  id          String   @id @default(uuid())
  refNo       String   @unique @map("ref_no")
  actorId     String?  @map("actor_id")
  action      String
  entityType  String?  @map("entity_type")
  entityId    String?  @map("entity_id")
  beforeValue Json?    @map("before_value")
  afterValue  Json?    @map("after_value")
  ipAddress   String?  @map("ip_address")
  reason      String?
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([actorId])
  @@index([entityType, entityId])
  @@index([createdAt(sort: Desc)])
  @@map("audit_log")
}

model SystemSetting {
  key         String   @id
  value       String
  valueType   String   @default("STRING") @map("value_type")
  description String?
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@map("system_settings")
}

model AdminPermission {
  id          String   @id @default(uuid())
  userId      String   @unique @map("user_id")
  permissions Json     @default("[]")
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id])
  @@map("admin_permissions")
}

model ReferralLinkEvent {
  id              String   @id @default(uuid())
  referrerId      String   @map("referrer_id")
  side            Side?
  ipAddress       String?  @map("ip_address")
  converted       Boolean  @default(false)
  convertedUserId String?  @map("converted_user_id")
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([referrerId, createdAt(sort: Desc)])
  @@map("referral_link_events")
}
```

#### مساءً (4 ساعات)
```bash
# 4. Docker Compose setup
# 5. Prisma migration + seed (admin user + sample products + system_settings)
# 6. Fastify boilerplate + health endpoint
# 7. Next.js boilerplate + design system tokens
```

**نهاية اليوم 1 ✅:**
- `docker-compose up` يشغل كل حاجة
- `GET /health` → 200
- DB فيها كل الـ tables
- Frontend يفتح على localhost:3000

---

### DAY 2 — 6 مايو | AUTH + BINARY TREE ENGINE
**Target:** Registration + Login + Tree Placement يشتغلوا

#### Tasks (8 ساعات)

```
[ ] POST /api/auth/register
    - Input validation (Zod)
    - Generate USR-XXXXXX user ID
    - Hash password (bcrypt)
    - Parse referral code from URL → get sponsor + side
    - Create User (status: PENDING)
    - Place in binary tree (SELECT FOR UPDATE transaction)
    - Create EARNINGS + CMONEY wallets
    - Send notification to sponsor
    - Log referral_link_event as converted
    
[ ] POST /api/auth/login
    - Validate credentials
    - Issue JWT (15min) + Refresh Token (UUID → Redis, 30 days)
    - Update last_login_at
    
[ ] POST /api/auth/refresh
    - Validate refresh token in Redis
    - Rotate refresh token (invalidate old)
    
[ ] POST /api/auth/logout
    - Delete refresh token from Redis
    
[ ] POST /api/auth/wallet-pin/set
    - Hash PIN with argon2id
    - Require current password to set
    
[ ] POST /api/auth/wallet-pin/verify
    - Check argon2id hash
    - Track attempts → lock after 3 fails (exponential backoff)
    
[ ] Binary Tree Service (src/modules/tree/tree.service.ts)
    - placeNewMember() → SELECT FOR UPDATE + transaction
    - getTreePath() → materialized path builder
    - getSubtreeUserIds(userId, side) → used by commission engine
    - findDeepestAvailableSlot() → BFS for spillover

[ ] GET /api/me → current user profile
[ ] PATCH /api/me → update profile
```

**نهاية اليوم 2 ✅:**
- Registration link: `http://localhost:3000/register?ref=USR-000001&side=LEFT`
- User registers → appears in DB with correct tree position
- Login returns JWT
- PIN setup + verify works

---

### DAY 3 — 7 مايو | SHOP + BV FLOW
**Target:** شراء منتج → BV يتحسب لكل ancestors في الشجرة

#### Tasks (8 ساعات)

```
[ ] Admin: Product CRUD (GET/POST/PATCH /api/admin/products)
[ ] GET /api/products → list with category filter + pagination
[ ] GET /api/products/:id
[ ] Cart (Redis-backed, fallback to DB):
    - POST /api/cart/items
    - GET /api/cart
    - DELETE /api/cart/items/:id
    - POST /api/cart/apply-voucher
[ ] Shipping Addresses CRUD
[ ] POST /api/orders → Checkout
    - Validate cart items
    - Calculate totals (price + tax - voucher)
    - Check C Money balance ≥ total
    - Atomic debit C Money wallet (SELECT FOR UPDATE)
    - Create Order + OrderItems
    - Mark order as PAID
    - Queue BV job (delayed by system_settings.bv_credit_delay_days)
    - Queue Personal Volume credit
    - Create wallet transaction (PURCHASE, negative)
    
[ ] BullMQ Worker: process-bv
    - Fan-out: walk UP entire tree from buyer
    - Create BvLog entry for EVERY ancestor with correct side
    - Update user.total_pv for buyer
    - Check fast_start_bonus triggers (queue separate job)
    
[ ] GET /api/orders → user's order history
[ ] Admin: GET /api/admin/orders + PATCH status
```

**نهاية اليوم 3 ✅:**
- منتج يتشترى بـ C Money
- BV يظهر في bv_log لكل ancestors في الشجرة (مش بس الـ direct parent)
- Order status يتحدث

---

### DAY 4 — 8 مايو | TEAM MODULE
**Target:** كل صفحات الـ Team تشتغل

#### Tasks (8 ساعات)

```
[ ] GET /api/team/referrals → direct referrals table
    (date filter, keyword search, side filter)
    
[ ] GET /api/team/genealogy → full downline
    (use materialized path: WHERE path LIKE '/X/%')
    Pagination required (50 per page)
    
[ ] GET /api/team/placement-tree?root={id}&depth=3
    Returns tree structure (max 3 levels per request)
    Frontend does lazy-load on node click
    
[ ] GET /api/team/bv → BV report
    Left total | Right total | This cycle
    Table: date/note/BV/side
    
[ ] GET /api/team/personal-volume
    
[ ] GET /api/team/referral-links
    Returns links with current side setting:
    {
      ambassadorLinkA: "https://credow.com/register?ref=USR-001&side=LEFT",
      ambassadorLinkB: "https://credow.com/register?ref=USR-001&side=RIGHT",
      ambassadorLinkAuto: "https://credow.com/register?ref=USR-001&side=AUTO",
      customerLink: "https://credow.com/shop?ref=USR-001"
    }

[ ] POST /api/team/referrals → manual add new member
    (admin-like form for direct sponsor to add a member)
    
[ ] Frontend: My Team page
    - Referrals table (sortable, filterable)
    - Genealogy table (lazy pagination)
    - Tree table view (sorted by join date, left vs right column)
    - BV report with totals
    - Referral links card (copy buttons, side toggle)
```

**نهاية اليوم 4 ✅:**
- Team module كامل
- Referral links تشتغل (click → registration fills sponsor automatically)
- BV report يعرض totals صح

---

### DAY 5 — 9 مايو | COMMISSION ENGINE
**Target:** Weekly commission يشتغل بشكل صح على 1000 users test data

#### Tasks (8 ساعات)

```
[ ] CommissionCycle CRUD (admin creates period)
[ ] BullMQ Job: commission-runner
    
    Architecture:
    1. Admin triggers: POST /api/admin/commission-cycles/run
    2. System checks: no other cycle RUNNING (Redis lock)
    3. Cycle status → RUNNING
    4. Fan-out: split all active users into batches of 100
    5. Queue batch jobs: commission-batch-{n}
    6. Each batch processes 100 users:
       - For each user:
         a. Get last cycle's carry (from last TeamCommission row)
         b. Sum LEFT BV from bv_log WHERE beneficiary_id = user AND side = LEFT AND cycle_id = current
         c. Sum RIGHT BV same way
         d. totalLeft = newLeftBV + leftCarryIn
         e. totalRight = newRightBV + rightCarryIn
         f. payLeg = min(totalLeft, totalRight)
         g. Get commission_rate from user's current rank (or system_settings default)
         h. rawCommission = payLeg * (rate/100)
         i. Apply weekly cap (from rank or system_settings)
         j. Check idempotency: does team_commissions row exist for (cycle_id, user_id)?
         k. INSERT team_commissions (with processed=true)
         l. Credit EARNINGS wallet (atomic)
         m. Insert wallet_transaction
    7. After all batches: cycle status → COMPLETED
    8. Send notification to all users with commission > 0
    9. Release Redis lock

[ ] Direct Commission:
    On package purchase (order.total_bv > 0 && product.is_package):
    - Credit sponsor's EARNINGS wallet immediately
    - Amount = getSetting('commission.direct_rate') * order.total_bv / 100
    
[ ] GET /api/earnings/team-commission?from=&to=
    Table: period | left BV | right BV | pay leg | rate | commission | carry in/out
    
[ ] Admin: GET /api/admin/commission-cycles (history)
[ ] Admin: GET /api/admin/commission-cycles/:id (results per user)
[ ] Admin: PATCH commission-cycles/:id/cancel (if RUNNING and stuck)

[ ] Seed 1000 test users with realistic tree + purchases to verify commission math
[ ] Write commission calculation unit tests (jest)
```

**نهاية اليوم 5 ✅:**
- Commission run يشتغل على 1000 users in < 30 seconds
- BV calculation صحيح (check manually on 5 users)
- Carry rolls over correctly to next cycle
- Double-run is blocked

---

### DAY 6 — 10 مايو | WALLET + EARNINGS + WITHDRAWAL
**Target:** كل حاجة بفلوس تشتغل وآمنة

#### Tasks (8 ساعات)

```
[ ] GET /api/wallet → EARNINGS balance + CMONEY balance + recent transactions
[ ] GET /api/wallet/transactions?type=&from=&to=&page=

[ ] POST /api/wallet/transfer (C Money peer transfer)
    - Validate PIN (argon2id verify + attempt tracking)
    - SELECT FOR UPDATE on both wallets (debit sender, credit receiver)
    - Create 2 wallet_transactions (TRANSFER_OUT + TRANSFER_IN)
    - Audit log
    - Notify receiver
    
[ ] GET /api/earnings/team-commission
[ ] GET /api/earnings/direct-commission  
[ ] GET /api/earnings/rank-bonus

[ ] Payment Accounts CRUD:
    POST /api/withdrawal/accounts
    GET  /api/withdrawal/accounts
    PATCH /api/withdrawal/accounts/:id (set default)
    DELETE /api/withdrawal/accounts/:id

[ ] POST /api/withdrawal
    - Validate PIN
    - Check minimum amount (system_settings)
    - SELECT FOR UPDATE on EARNINGS wallet
    - Check balance >= requested_amount
    - Deduct balance atomically
    - Create withdrawal record (REQUESTED)
    - Create wallet_transaction (WITHDRAWAL, negative)
    - Notify admin (email + in-app)
    
[ ] Admin: GET /api/admin/withdrawals?status=
[ ] Admin: PATCH /api/admin/withdrawals/:id
    { status: 'PAID', admin_notes: '...' }
    If REJECTED → reverse wallet transaction (credit back)
    
[ ] Frontend: Wallet page
[ ] Frontend: Earnings breakdown pages
[ ] Frontend: Withdrawal page + payment accounts
```

**نهاية اليوم 6 ✅:**
- Transfer بين users يشتغل (balance deducts atomically)
- Withdrawal request يحجز الرصيد فوراً
- Admin approve/reject يشتغل مع reversal

---

### DAY 7 — 11 مايو | ADMIN PANEL + DASHBOARD
**Target:** Admin كامل + Dashboard page

#### Tasks (8 ساعات)

```
[ ] Admin Dashboard overview:
    GET /api/admin/dashboard
    {
      totalUsers, activeAmbassadors, pendingActivations,
      totalCMoney, commissionsThisWeek, openTickets,
      recentTransactions (last 20), pendingWithdrawals
    }
    
[ ] Admin User Management:
    GET    /api/admin/users?status=&role=&search=&page=
    GET    /api/admin/users/:id  (full profile + tree position + wallet + commissions)
    PATCH  /api/admin/users/:id/status  { status, reason }
    POST   /api/admin/users/:id/activate
    POST   /api/admin/bonuses/grant  { user_id, type, amount, reason }
    
[ ] Admin Vouchers:
    POST /api/admin/vouchers/generate { type, value, count, expires_at }
    GET  /api/admin/vouchers
    
[ ] Admin Ranks:
    GET   /api/admin/ranks
    POST  /api/admin/ranks
    PATCH /api/admin/ranks/:id
    
[ ] Admin System Settings:
    GET   /api/admin/settings
    PATCH /api/admin/settings  { key, value }
    (changes cached in Redis, TTL 1 hour)
    
[ ] Admin Audit Log:
    GET /api/admin/audit-log?actor=&entity=&action=&from=&to=
    
[ ] Ambassador Dashboard page (frontend):
    - BV side cards (Left total / Right total) with sparkline
    - Rank card (current rank + progress to next)
    - Business snapshot table
    - Quick actions row
    - Recent activity feed (wallet transactions)
    - Banner carousel (admin-uploaded images via system settings)
    
[ ] Frontend: Admin layout + all admin pages
    - Users table with activate/suspend
    - Commission run button + status indicator
    - Withdrawal processing queue
    - Voucher generator
    - System settings editor
```

**نهاية اليوم 7 ✅:**
- Admin يقدر يشوف كل user مع كامل history
- Commission run يتعمل من admin panel
- Dashboard يعرض BV correct

---

### DAY 8 — 12 مايو | UI POLISH + NOTIFICATIONS + SUPPORT
**Target:** كل الـ UI يبدو production-ready

#### Tasks (8 ساعات)

```
[ ] Design system implementation:
    - Tailwind config: custom colors (--bg-page, --surface, --primary, --gold)
    - shadcn/ui components: Button, Card, Table, Modal, Badge, Toast
    - Global layout: Sidebar (collapsible) + TopBar + Main content
    - Arabic/RTL support (next-intl, dir="rtl")
    - Dark theme everywhere
    
[ ] WebSocket (Socket.io):
    - User joins their own room on login: socket.join(`user:${userId}`)
    - Events: wallet.credited, commission.paid, withdrawal.updated, notification.new
    - Frontend: real-time balance update in sidebar
    - Frontend: toast notifications on events
    
[ ] Notification system:
    - Bell icon with unread count badge (WebSocket updates)
    - GET /api/notifications (paginated)
    - PATCH /api/notifications/:id/read
    - POST /api/notifications/read-all
    - Notification dropdown panel
    
[ ] Support Tickets:
    - POST /api/support/tickets { category, subject, message }
    - GET  /api/support/tickets (user's tickets)
    - GET  /api/support/tickets/:id (thread view)
    - POST /api/support/tickets/:id/reply
    - Admin: GET /api/admin/support/tickets (all tickets, filter by status)
    - Admin: PATCH ticket status + reply
    
[ ] UI Pages to complete:
    - Login page (tab: Customer / Franchise)
    - Wallet PIN modal (6-dot input)
    - Profile page
    - Shop page (grid + product modal)
    - Cart drawer
    - Checkout page
    - Orders table
    - Ranks page (timeline)
    - Support page
    
[ ] Loading states (skeleton everywhere)
[ ] Empty states (illustrated for 0 results)
[ ] Error boundaries
[ ] Toast notifications (top-right, 5s auto-dismiss)
```

**نهاية اليوم 8 ✅:**
- كل الـ pages موجودة وفيها real data
- WebSocket يعمل (balance يتحدث live)
- PIN modal يشتغل

---

### DAY 9 — 13 مايو | SECURITY + TESTING
**Target:** الـ system آمن ومش قابل للاختراق

#### Tasks (8 ساعات)

```
[ ] Rate Limiting (Fastify rate-limit plugin):
    POST /auth/login           → 5 req / 15min / IP
    POST /auth/wallet-pin/*    → 3 req / hour / user
    POST /withdrawal           → 2 req / hour / user
    POST /wallet/transfer      → 10 req / hour / user
    GET  /api/*                → 200 req / min / user
    POST /admin/commission-cycles/run → 1 req / hour (global)

[ ] Input Validation (Zod on every endpoint):
    - No raw user input reaches DB
    - Numeric amounts: must be positive, max 2 decimal places
    - User IDs: UUID format validation
    - Strings: strip HTML, max length enforcement

[ ] Security Headers (helmet):
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - Content-Security-Policy
    - HSTS (production only)

[ ] Fraud Detection:
    - Registration: flag if same IP registers >2 accounts in 24h → require admin review
    - BV spike alert: if single order generates >500 BV → flag for manual review
    - Withdrawal: check no pending reversal on recent transactions

[ ] Commission integrity:
    - Add pre-flight check before every commission run
    - Verify: cycle dates don't overlap, no RUNNING cycles, no un-credited BV

[ ] Unit Tests (Jest):
    [ ] commission calculation (carry logic, cap enforcement)
    [ ] tree placement (left/right/auto/spillover)
    [ ] wallet transfer (insufficient funds, PIN lock)
    [ ] BV fan-out (verify ancestors get credit)
    [ ] rank advancement logic

[ ] Integration Tests:
    [ ] Full registration → purchase → commission flow
    [ ] Withdrawal request → admin approve → balance correct
    [ ] Referral link → registration → tree placement correct

[ ] Fix any bugs found in testing
```

**نهاية اليوم 9 ✅:**
- Test suite passes
- No SQL injection / XSS possible
- Rate limiting works (test with curl loops)

---

### DAY 10 — 14-15 مايو | DEPLOYMENT + LOAD TEST
**Target:** System deployed + 50K user load test passes

#### صباح 14 مايو — Deployment

```bash
# 1. Production Docker setup
# docker-compose.prod.yml:
# - PostgreSQL 16 (2 containers: primary + read replica)
# - Redis 7
# - API (2 instances behind Nginx)
# - Next.js (Vercel OR Docker)
# - BullMQ workers (separate container)

# 2. Environment variables:
DATABASE_URL=postgresql://...
DATABASE_REPLICA_URL=postgresql://...  # read replica
REDIS_URL=redis://...
JWT_SECRET=<64-char random>
JWT_REFRESH_SECRET=<64-char random>
ARGON2_SECRET=<32-char random>

# 3. Deploy to DigitalOcean Droplet ($48/mo for 4 CPU, 8GB RAM):
# OR Railway (easier, auto-scale)
# OR Render

# 4. Nginx config:
# - SSL termination (Let's Encrypt)
# - Upstream: api:3001, api:3002 (round-robin)
# - Rate limiting at Nginx level too
# - Gzip compression

# 5. Run migrations on production DB:
npx prisma migrate deploy

# 6. Seed production: admin user + ranks + products + system_settings
```

#### مساء 14 مايو — Load Test Preparation

```javascript
// k6 load test script: load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Test scenarios for 50K concurrent users:
export const options = {
  scenarios: {
    // Scenario 1: Dashboard browsing (80% of users)
    dashboard_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 40000 },   // ramp up to 40K
        { duration: '5m', target: 40000 },   // stay at 40K
        { duration: '2m', target: 0 },        // ramp down
      ],
    },
    // Scenario 2: Active purchases (15% of users)
    active_buyers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 7500 },
        { duration: '5m', target: 7500 },
        { duration: '2m', target: 0 },
      ],
    },
    // Scenario 3: Commission run (1 admin trigger)
    commission_run: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      startTime: '4m',  // trigger mid-test
    },
  },
  thresholds: {
    // SLAs:
    'http_req_duration{scenario:dashboard_users}': ['p(95)<500'],   // 95% < 500ms
    'http_req_duration{scenario:active_buyers}': ['p(95)<1000'],    // 95% < 1s
    'http_req_failed': ['rate<0.01'],                                // <1% error rate
  },
};

// Dashboard scenario
export function dashboard_users() {
  const token = getToken();
  const res = http.get(`${BASE_URL}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(res, { 'dashboard 200': (r) => r.status === 200 });
  sleep(1);
  
  http.get(`${BASE_URL}/api/wallet`, { headers: { ... } });
  sleep(2);
  
  http.get(`${BASE_URL}/api/team/bv`, { headers: { ... } });
  sleep(3);
}

// Buyer scenario
export function active_buyers() {
  const token = getToken();
  // View products
  http.get(`${BASE_URL}/api/products`);
  sleep(1);
  
  // Add to cart
  http.post(`${BASE_URL}/api/cart/items`, JSON.stringify({
    product_id: TEST_PRODUCT_ID, quantity: 1
  }), { headers: { ... } });
  
  // Checkout (10% of buyers actually complete purchase)
  if (Math.random() < 0.1) {
    http.post(`${BASE_URL}/api/orders`, JSON.stringify({
      shipping_addr_id: TEST_ADDR_ID
    }), { headers: { ... } });
  }
  sleep(5);
}
```

**ماذا نتوقع من الـ load test:**

| Metric | Target | Fail if |
|---|---|---|
| p95 response time (dashboard) | < 500ms | > 1000ms |
| p95 response time (checkout) | < 1500ms | > 3000ms |
| Error rate | < 1% | > 5% |
| Commission run (10K users) | < 5 min | > 15 min |
| DB connections at peak | < 80% pool | > 95% pool |
| Redis memory at peak | < 2GB | > 4GB |

#### صباح 15 مايو — Fix + Re-test

**Common bottlenecks وكيف تحلها:**

```
❌ DB connection pool exhausted:
   → Set Prisma pool: datasource { connection_limit = 20 }
   → Add PgBouncer in front of PostgreSQL

❌ Slow dashboard query:
   → Add Redis cache for dashboard data (5 min TTL)
   → GET /api/dashboard hits Redis first

❌ BV fan-out slow under load:
   → BullMQ concurrency: workers: 10
   → Batch insert BvLog rows (INSERT ... VALUES x1000)

❌ Commission run timeout:
   → Increase job timeout in BullMQ
   → Reduce batch size to 50 users per job
   → Add more worker instances

❌ Tree placement slow:
   → Ensure (parent_id, side) index exists
   → Cache sponsor's tree node in Redis (1 min TTL)

❌ High memory on API:
   → Use streaming for large responses (genealogy table)
   → Add cursor-based pagination instead of offset
```

---

## 📊 DELIVERABLE CHECKLIST — 15 مايو

### Core System ✅
- [ ] Registration via referral link (side A/B/Auto)
- [ ] Login / Auth / JWT
- [ ] Wallet PIN (argon2id)
- [ ] Binary tree placement (race-condition safe)
- [ ] Shop + Cart + Checkout (C Money)
- [ ] BV fan-out to all ancestors
- [ ] Weekly commission (carry logic, cap, idempotency)
- [ ] Direct commission
- [ ] Wallet (EARNINGS + CMONEY)
- [ ] C Money transfer
- [ ] Withdrawal request + admin processing
- [ ] Rank display

### Team Module ✅
- [ ] Referrals table
- [ ] Genealogy table
- [ ] BV report (L vs R)
- [ ] Referral links (side toggle + copy)
- [ ] Tree table view

### Admin ✅
- [ ] User management (list / activate / suspend)
- [ ] Commission run trigger + results
- [ ] Withdrawal processing
- [ ] Voucher generator
- [ ] System settings editor
- [ ] Audit log
- [ ] Manual bonus grant

### UI ✅
- [ ] Landing page
- [ ] Login page
- [ ] Full ambassador dashboard
- [ ] All team pages
- [ ] All earnings pages
- [ ] Wallet + withdrawal pages
- [ ] Shop + cart + checkout
- [ ] Admin panel
- [ ] Arabic RTL + English toggle

### Production ✅
- [ ] Deployed on VPS/Railway
- [ ] SSL certificate
- [ ] Health endpoint
- [ ] Error monitoring (Sentry)
- [ ] k6 load test: 50K users
- [ ] p95 < 500ms for dashboard
- [ ] < 1% error rate
- [ ] Commission run for 10K users < 5 min

---

## ⚠️ المتطلبات الحرجة قبل ما تبدأ تبرمج

**لازم تاخد من الكلاينت قبل Day 5 (قبل ما تبرمج الـ commission engine):**

| Parameter | مش بنكمل بدونه |
|---|---|
| Team commission % per rank | 🔴 محتاج |
| Weekly cap per rank (EGP) | 🔴 محتاج |
| Direct commission % on package | 🔴 محتاج |
| Rank names + PBV + CV + directs per rank | 🔴 محتاج |
| Minimum withdrawal amount | 🟠 محتاج |
| Withdrawal processing fee % | 🟠 محتاج |
| BV credit delay (days) | 🟠 محتاج |
| Which products carry BV? | 🔴 محتاج |

---

## 🧮 DAILY HOURS ESTIMATE

| Day | Focus | Hours |
|---|---|---|
| 1 | Infrastructure + Schema | 8h |
| 2 | Auth + Tree Engine | 8h |
| 3 | Shop + BV | 8h |
| 4 | Team Module | 8h |
| 5 | Commission Engine | 10h |
| 6 | Wallet + Withdrawal | 8h |
| 7 | Admin + Dashboard | 8h |
| 8 | UI Polish + Notifications | 10h |
| 9 | Security + Tests | 8h |
| 10 | Deploy + Load Test | 10h |
| **Total** | | **86 hours** |

> **ملحوظة:** ده بيفترض developer واحد full-time أو team صغيرة (2-3).  
> لو في team: frontend developer يبدأ الـ UI من Day 6 بينما backend مكمل.

---

## 🚀 QUICK START COMMANDS

```bash
# Day 1: إنشاء الـ project
npx create-turbo@latest credo-w --use-npm
cd credo-w

# إنشاء الـ apps
mkdir -p apps/api apps/web packages/db packages/shared

# API setup
cd apps/api
npm init -y
npm install fastify @fastify/cors @fastify/helmet @fastify/rate-limit
npm install @fastify/jwt @fastify/cookie @fastify/multipart
npm install prisma @prisma/client argon2 bullmq ioredis zod
npm install -D typescript @types/node ts-node nodemon

# Web setup  
cd ../web
npx create-next-app@latest . --typescript --tailwind --app --src-dir
npx shadcn-ui@latest init

# DB package
cd ../../packages/db
npm init -y
npm install prisma @prisma/client
npx prisma init

# Copy schema.prisma from this document ↑

# Docker Compose
cat > ../../docker-compose.yml << 'EOF'
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: credow
      POSTGRES_USER: credow
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
  api:
    build: ./apps/api
    env_file: .env
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
  web:
    build: ./apps/web
    env_file: .env
    ports:
      - "3000:3000"
    depends_on:
      - api
volumes:
  pgdata:
EOF

# Run
docker-compose up -d

# Migrate
npx prisma migrate dev --name init
npx prisma db seed
```

---

## 📞 WHAT TO DO IF YOU GET STUCK

| Problem | Solution |
|---|---|
| Tree placement slow | Check `(parent_id, side)` index exists |
| Commission taking too long | Reduce batch size, add more BullMQ workers |
| DB connection errors under load | Add PgBouncer, reduce pool size per instance |
| Memory leak on API | Use streaming responses on large list endpoints |
| BV numbers wrong | Run reconciliation query vs fan-out output |
| Frontend RTL broken | Add `dir="rtl"` on `<html>`, use `rtl:` Tailwind variants |
| JWT invalid after deploy | Check JWT_SECRET is same across all API instances |
| Redis connection lost | Add reconnect strategy: `maxRetriesPerRequest: null` |
