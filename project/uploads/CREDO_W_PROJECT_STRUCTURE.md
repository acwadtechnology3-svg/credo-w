# CREDO W — PROJECT FILE STRUCTURE
> Monorepo | Next.js 14 App Router | Fastify API | Turborepo

---

## ROOT STRUCTURE

```
credo-w/
├── apps/
│   ├── web/                         → Next.js 14 Frontend
│   └── api/                         → Fastify Backend
├── packages/
│   ├── db/                          → Prisma Schema + Migrations
│   ├── shared/                      → Types + Utils + Constants
│   └── config/                      → ESLint + TS + Tailwind configs
├── docker-compose.yml               → Development
├── docker-compose.prod.yml          → Production
├── turbo.json
├── package.json                     → Root workspace
└── .env.example
```

---

## FRONTEND — apps/web/

```
apps/web/
├── src/
│   ├── app/                                    → Next.js App Router
│   │   │
│   │   ├── (public)/                           → No auth required
│   │   │   ├── layout.tsx                      → Public layout (navbar + footer)
│   │   │   ├── page.tsx                        → Landing page /
│   │   │   ├── login/
│   │   │   │   └── page.tsx                    → /login
│   │   │   └── register/
│   │   │       └── page.tsx                    → /register?ref=USR-001&side=LEFT
│   │   │
│   │   ├── (ambassador)/                       → Protected: AMBASSADOR role
│   │   │   ├── layout.tsx                      → Auth guard + Sidebar layout
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                    → /dashboard (home)
│   │   │   │
│   │   │   ├── profile/
│   │   │   │   └── page.tsx                    → /profile
│   │   │   │
│   │   │   ├── shop/
│   │   │   │   ├── page.tsx                    → /shop (product grid)
│   │   │   │   ├── [productId]/
│   │   │   │   │   └── page.tsx                → /shop/:id (product detail)
│   │   │   │   ├── cart/
│   │   │   │   │   └── page.tsx                → /shop/cart
│   │   │   │   ├── checkout/
│   │   │   │   │   └── page.tsx                → /shop/checkout
│   │   │   │   └── orders/
│   │   │   │       ├── page.tsx                → /shop/orders (list)
│   │   │   │       └── [orderId]/
│   │   │   │           └── page.tsx            → /shop/orders/:id (detail)
│   │   │   │
│   │   │   ├── team/
│   │   │   │   ├── page.tsx                    → /team (overview redirect)
│   │   │   │   ├── referrals/
│   │   │   │   │   └── page.tsx                → /team/referrals
│   │   │   │   ├── genealogy/
│   │   │   │   │   └── page.tsx                → /team/genealogy
│   │   │   │   ├── tree/
│   │   │   │   │   └── page.tsx                → /team/tree (table view)
│   │   │   │   ├── business-volume/
│   │   │   │   │   └── page.tsx                → /team/business-volume
│   │   │   │   └── personal-volume/
│   │   │   │       └── page.tsx                → /team/personal-volume
│   │   │   │
│   │   │   ├── earnings/
│   │   │   │   ├── page.tsx                    → /earnings (wallet overview)
│   │   │   │   ├── wallet/
│   │   │   │   │   └── page.tsx                → /earnings/wallet
│   │   │   │   ├── team-commission/
│   │   │   │   │   └── page.tsx                → /earnings/team-commission
│   │   │   │   ├── direct-commission/
│   │   │   │   │   └── page.tsx                → /earnings/direct-commission
│   │   │   │   └── rank-bonus/
│   │   │   │       └── page.tsx                → /earnings/rank-bonus
│   │   │   │
│   │   │   ├── withdrawal/
│   │   │   │   ├── page.tsx                    → /withdrawal
│   │   │   │   └── accounts/
│   │   │   │       └── page.tsx                → /withdrawal/accounts
│   │   │   │
│   │   │   ├── ranks/
│   │   │   │   └── page.tsx                    → /ranks
│   │   │   │
│   │   │   └── support/
│   │   │       ├── page.tsx                    → /support (ticket list)
│   │   │       └── [ticketId]/
│   │   │           └── page.tsx                → /support/:id (thread)
│   │   │
│   │   ├── (admin)/                            → Protected: ADMIN role
│   │   │   ├── layout.tsx                      → Admin auth guard + Admin sidebar
│   │   │   └── admin/
│   │   │       ├── page.tsx                    → /admin (overview)
│   │   │       ├── users/
│   │   │       │   ├── page.tsx                → /admin/users
│   │   │       │   └── [userId]/
│   │   │       │       └── page.tsx            → /admin/users/:id
│   │   │       ├── commissions/
│   │   │       │   ├── page.tsx                → /admin/commissions
│   │   │       │   └── [cycleId]/
│   │   │       │       └── page.tsx            → /admin/commissions/:id
│   │   │       ├── withdrawals/
│   │   │       │   └── page.tsx                → /admin/withdrawals
│   │   │       ├── products/
│   │   │       │   └── page.tsx                → /admin/products
│   │   │       ├── vouchers/
│   │   │       │   └── page.tsx                → /admin/vouchers
│   │   │       ├── ranks/
│   │   │       │   └── page.tsx                → /admin/ranks
│   │   │       ├── support/
│   │   │       │   ├── page.tsx                → /admin/support (all tickets)
│   │   │       │   └── [ticketId]/
│   │   │       │       └── page.tsx
│   │   │       ├── settings/
│   │   │       │   └── page.tsx                → /admin/settings (system settings)
│   │   │       └── audit/
│   │   │           └── page.tsx                → /admin/audit
│   │   │
│   │   ├── api/                                → Next.js Route Handlers (thin proxy)
│   │   │   └── [...path]/
│   │   │       └── route.ts                    → Proxy to Fastify API
│   │   │
│   │   ├── globals.css
│   │   ├── layout.tsx                          → Root layout (fonts, providers)
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx                     → Collapsible sidebar (ambassador)
│   │   │   ├── SidebarItem.tsx
│   │   │   ├── SidebarSection.tsx
│   │   │   ├── TopBar.tsx                      → Search + Bell + Avatar
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── PublicNavbar.tsx                → Landing page nav
│   │   │   ├── PublicFooter.tsx
│   │   │   └── MobileBottomNav.tsx             → Mobile bottom tabs
│   │   │
│   │   ├── ui/                                 → shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   │
│   │   ├── shared/                             → Reusable components across modules
│   │   │   ├── DataTable/
│   │   │   │   ├── DataTable.tsx               → Generic sortable/filterable table
│   │   │   │   ├── DataTablePagination.tsx
│   │   │   │   ├── DataTableFilters.tsx
│   │   │   │   └── DataTableExport.tsx         → Export to CSV
│   │   │   ├── StatusBadge.tsx                 → Active/Inactive/Suspended/Pending
│   │   │   ├── AmountDisplay.tsx               → EGP formatting (always LTR)
│   │   │   ├── CopyButton.tsx                  → Copy to clipboard + toast
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── EmptyState.tsx                  → Illustrated empty state
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── PageHeader.tsx                  → Title + breadcrumb + action button
│   │   │   ├── ConfirmDialog.tsx               → "Are you sure?" modal
│   │   │   ├── SortIcon.tsx
│   │   │   └── StatsCard.tsx                   → Metric card with icon + trend
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── WalletPinModal.tsx              → 6-dot PIN entry modal
│   │   │   ├── PinInput.tsx                    → Single dot input
│   │   │   └── AuthGuard.tsx                   → Client-side route protection
│   │   │
│   │   ├── dashboard/
│   │   │   ├── BVSideCard.tsx                  → Big BV card (Left/Right)
│   │   │   ├── RankProgressCard.tsx            → Rank widget with progress bar
│   │   │   ├── BusinessSnapshotTable.tsx       → L vs R snapshot
│   │   │   ├── QuickActionsRow.tsx
│   │   │   ├── RecentActivityFeed.tsx
│   │   │   └── BannerCarousel.tsx
│   │   │
│   │   ├── tree/
│   │   │   ├── TreeTableView.tsx               → Table-based tree (MVP)
│   │   │   ├── TreeNode.tsx                    → Single node card
│   │   │   └── TreeSearch.tsx
│   │   │
│   │   ├── shop/
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductDetailModal.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── CartDrawer.tsx                  → Slide-in from right
│   │   │   ├── CartItem.tsx
│   │   │   ├── VoucherInput.tsx
│   │   │   ├── CheckoutForm.tsx
│   │   │   └── OrderStatusBadge.tsx
│   │   │
│   │   ├── wallet/
│   │   │   ├── WalletBalanceCard.tsx
│   │   │   ├── TransactionTable.tsx
│   │   │   ├── TransferModal.tsx               → C Money transfer (PIN-protected)
│   │   │   └── TransactionTypeBadge.tsx
│   │   │
│   │   ├── withdrawal/
│   │   │   ├── WithdrawalForm.tsx
│   │   │   ├── WithdrawalTable.tsx
│   │   │   ├── PaymentAccountCard.tsx
│   │   │   └── AddAccountModal.tsx
│   │   │
│   │   ├── team/
│   │   │   ├── ReferralLinksCard.tsx
│   │   │   ├── SideToggle.tsx                  → A / Auto / B toggle
│   │   │   ├── ReferralsTable.tsx
│   │   │   ├── GenealogyTable.tsx
│   │   │   └── BVReportTable.tsx
│   │   │
│   │   ├── earnings/
│   │   │   ├── CommissionTable.tsx
│   │   │   ├── CarryDisplay.tsx                → Left carry | Right carry
│   │   │   └── EarningsSummaryCards.tsx
│   │   │
│   │   ├── ranks/
│   │   │   ├── RankBadge.tsx                   → Rank icon + name
│   │   │   ├── RankTimeline.tsx                → Horizontal scroll timeline
│   │   │   └── RankProgressBar.tsx
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationBell.tsx            → Bell icon + unread count
│   │   │   ├── NotificationPanel.tsx           → Dropdown list
│   │   │   └── NotificationItem.tsx
│   │   │
│   │   ├── support/
│   │   │   ├── TicketList.tsx
│   │   │   ├── TicketCard.tsx
│   │   │   ├── TicketThread.tsx                → Chat-bubble thread
│   │   │   └── NewTicketModal.tsx
│   │   │
│   │   └── admin/
│   │       ├── UserTable.tsx
│   │       ├── UserDetailPanel.tsx
│   │       ├── CommissionRunButton.tsx         → Trigger + status indicator
│   │       ├── CommissionRunProgress.tsx
│   │       ├── WithdrawalQueue.tsx
│   │       ├── VoucherGenerator.tsx
│   │       ├── SystemSettingsForm.tsx
│   │       ├── AuditLogTable.tsx
│   │       └── AdminStatsBar.tsx
│   │
│   ├── hooks/                                  → Custom React hooks
│   │   ├── useAuth.ts                          → Auth state + login/logout
│   │   ├── useWallet.ts                        → Wallet balances + real-time
│   │   ├── useNotifications.ts                 → Unread count + socket
│   │   ├── useWalletPin.ts                     → PIN modal state machine
│   │   ├── useSocket.ts                        → Socket.io connection
│   │   ├── useCopyToClipboard.ts
│   │   ├── useRTL.ts                           → Current language direction
│   │   ├── useDebounce.ts
│   │   └── usePagination.ts
│   │
│   ├── lib/
│   │   ├── api/                                → API client functions
│   │   │   ├── client.ts                       → Axios/fetch instance + interceptors
│   │   │   ├── auth.api.ts
│   │   │   ├── dashboard.api.ts
│   │   │   ├── shop.api.ts
│   │   │   ├── orders.api.ts
│   │   │   ├── team.api.ts
│   │   │   ├── wallet.api.ts
│   │   │   ├── earnings.api.ts
│   │   │   ├── withdrawal.api.ts
│   │   │   ├── ranks.api.ts
│   │   │   ├── support.api.ts
│   │   │   ├── notifications.api.ts
│   │   │   └── admin.api.ts
│   │   ├── socket.ts                           → Socket.io client setup
│   │   ├── auth.ts                             → Token storage + refresh logic
│   │   ├── formatters.ts                       → EGP format, date format, BV format
│   │   ├── validators.ts                       → Zod schemas for forms
│   │   └── constants.ts                        → App-level constants
│   │
│   ├── providers/
│   │   ├── AuthProvider.tsx                    → Auth context (user, token, role)
│   │   ├── SocketProvider.tsx                  → Socket.io connection context
│   │   ├── QueryProvider.tsx                   → TanStack Query client
│   │   ├── ThemeProvider.tsx                   → Dark theme
│   │   └── RTLProvider.tsx                     → Dir + locale context
│   │
│   ├── store/
│   │   ├── auth.store.ts                       → Zustand: user, token, role
│   │   ├── cart.store.ts                       → Zustand: cart items, total
│   │   ├── ui.store.ts                         → Zustand: sidebar open, modals
│   │   └── notification.store.ts               → Zustand: unread count
│   │
│   ├── types/
│   │   └── index.ts                            → Re-export from @credo-w/shared
│   │
│   └── i18n/
│       ├── ar.json                             → Arabic translations
│       ├── en.json                             → English translations
│       └── config.ts                           → next-intl config
│
├── public/
│   ├── logo.svg
│   ├── logo-dark.svg
│   ├── ranks/                                  → Rank icons (svg)
│   │   ├── bap.svg
│   │   ├── star-achiever.svg
│   │   └── ...
│   └── empty-states/                          → Illustrated SVGs
│       ├── no-transactions.svg
│       ├── no-team.svg
│       └── ...
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## BACKEND — apps/api/

```
apps/api/
├── src/
│   ├── app.ts                                  → Fastify instance + plugin registration
│   ├── server.ts                               → Start server + graceful shutdown
│   │
│   ├── modules/                                → Feature modules (each = routes + service + schema)
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.routes.ts                  → Route definitions
│   │   │   ├── auth.service.ts                 → Business logic
│   │   │   ├── auth.schema.ts                  → Zod input validation schemas
│   │   │   └── auth.types.ts                   → Module-specific types
│   │   │
│   │   ├── users/
│   │   │   ├── users.routes.ts                 → GET /me, PATCH /me, POST /me/avatar
│   │   │   ├── users.service.ts
│   │   │   └── users.schema.ts
│   │   │
│   │   ├── tree/                               → Binary tree engine
│   │   │   ├── tree.routes.ts                  → GET /team/placement-tree, /team/genealogy
│   │   │   ├── tree.service.ts                 → placeNewMember, getSubtree, getPath
│   │   │   ├── tree.queries.ts                 → Raw SQL queries (path traversal)
│   │   │   └── tree.types.ts
│   │   │
│   │   ├── shop/
│   │   │   ├── products/
│   │   │   │   ├── products.routes.ts          → GET /products, GET /products/:id
│   │   │   │   ├── products.service.ts
│   │   │   │   └── products.schema.ts
│   │   │   ├── cart/
│   │   │   │   ├── cart.routes.ts
│   │   │   │   ├── cart.service.ts             → Redis-backed cart
│   │   │   │   └── cart.schema.ts
│   │   │   └── categories/
│   │   │       ├── categories.routes.ts
│   │   │       └── categories.service.ts
│   │   │
│   │   ├── orders/
│   │   │   ├── orders.routes.ts                → POST /orders, GET /orders, GET /orders/:id
│   │   │   ├── orders.service.ts               → Checkout logic + BV queue trigger
│   │   │   ├── orders.schema.ts
│   │   │   └── shipping/
│   │   │       ├── shipping.routes.ts
│   │   │       └── shipping.service.ts
│   │   │
│   │   ├── wallet/
│   │   │   ├── wallet.routes.ts                → GET /wallet, GET /wallet/transactions
│   │   │   ├── wallet.service.ts               → creditWallet, debitWallet (atomic)
│   │   │   ├── wallet.schema.ts
│   │   │   └── transfer/
│   │   │       ├── transfer.routes.ts          → POST /wallet/transfer
│   │   │       └── transfer.service.ts         → PIN verify + atomic transfer
│   │   │
│   │   ├── commissions/
│   │   │   ├── commissions.routes.ts           → GET /earnings/*
│   │   │   ├── commissions.service.ts          → runTeamCommission, getCarry
│   │   │   ├── bv/
│   │   │   │   ├── bv.service.ts               → processBVFromOrder (fan-out)
│   │   │   │   └── bv.queries.ts               → sumBVForUser per side
│   │   │   └── direct/
│   │   │       └── direct.service.ts           → directCommission on package buy
│   │   │
│   │   ├── ranks/
│   │   │   ├── ranks.routes.ts                 → GET /ranks, GET /ranks/mine
│   │   │   ├── ranks.service.ts                → checkRankAdvancement, getCurrentRank
│   │   │   └── ranks.schema.ts
│   │   │
│   │   ├── team/
│   │   │   ├── team.routes.ts                  → GET /team/referrals, /team/bv, etc.
│   │   │   ├── team.service.ts
│   │   │   └── referral-links/
│   │   │       ├── referral.routes.ts          → GET /team/referral-links
│   │   │       └── referral.service.ts         → Generate + track links
│   │   │
│   │   ├── withdrawal/
│   │   │   ├── withdrawal.routes.ts
│   │   │   ├── withdrawal.service.ts           → Request + atomic balance lock
│   │   │   └── accounts/
│   │   │       ├── accounts.routes.ts
│   │   │       └── accounts.service.ts
│   │   │
│   │   ├── vouchers/
│   │   │   ├── vouchers.routes.ts              → POST /vouchers/redeem
│   │   │   └── vouchers.service.ts             → validate + apply discount
│   │   │
│   │   ├── support/
│   │   │   ├── support.routes.ts
│   │   │   └── support.service.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.routes.ts
│   │   │   ├── notifications.service.ts        → create, markRead, emit via socket
│   │   │   └── notifications.gateway.ts        → Socket.io event emitters
│   │   │
│   │   └── admin/
│   │       ├── admin.routes.ts                 → Registers all admin sub-routes
│   │       ├── users/
│   │       │   ├── admin-users.routes.ts
│   │       │   └── admin-users.service.ts
│   │       ├── commissions/
│   │       │   ├── admin-commissions.routes.ts
│   │       │   └── admin-commissions.service.ts → Trigger run + view results
│   │       ├── withdrawals/
│   │       │   ├── admin-withdrawals.routes.ts
│   │       │   └── admin-withdrawals.service.ts
│   │       ├── products/
│   │       │   ├── admin-products.routes.ts
│   │       │   └── admin-products.service.ts
│   │       ├── vouchers/
│   │       │   ├── admin-vouchers.routes.ts
│   │       │   └── admin-vouchers.service.ts
│   │       ├── ranks/
│   │       │   ├── admin-ranks.routes.ts
│   │       │   └── admin-ranks.service.ts
│   │       ├── settings/
│   │       │   ├── admin-settings.routes.ts
│   │       │   └── admin-settings.service.ts   → Read/write system_settings + cache
│   │       ├── support/
│   │       │   └── admin-support.routes.ts
│   │       ├── audit/
│   │       │   └── admin-audit.routes.ts
│   │       └── dashboard/
│   │           └── admin-dashboard.routes.ts
│   │
│   ├── jobs/                                   → BullMQ Workers
│   │   ├── queues.ts                           → Queue definitions (all queues in one place)
│   │   ├── workers/
│   │   │   ├── bv.worker.ts                    → process-bv: fan-out BV to ancestors
│   │   │   ├── commission.worker.ts            → commission-batch-{n}: process user batch
│   │   │   ├── commission-finalize.worker.ts   → After all batches: mark cycle COMPLETED
│   │   │   ├── direct-commission.worker.ts     → direct-commission: immediate pay
│   │   │   ├── rank-check.worker.ts            → rank-check: after BV credit
│   │   │   └── notification.worker.ts          → send-notification: email + in-app
│   │   └── schedulers/
│   │       └── cron.ts                         → Weekly commission cron (BullMQ repeat)
│   │
│   ├── middleware/
│   │   ├── authenticate.ts                     → JWT verify + attach user to request
│   │   ├── authorize.ts                        → Role guard (AMBASSADOR / ADMIN)
│   │   ├── rate-limiter.ts                     → Per-endpoint rate limits
│   │   ├── audit-logger.ts                     → Auto-log financial operations
│   │   └── fraud-detector.ts                   → IP duplicate + velocity checks
│   │
│   ├── plugins/
│   │   ├── prisma.plugin.ts                    → Register Prisma as Fastify plugin
│   │   ├── redis.plugin.ts                     → Register Redis client
│   │   ├── socket.plugin.ts                    → Socket.io setup + room management
│   │   └── cors.plugin.ts
│   │
│   └── lib/
│       ├── prisma.ts                           → Prisma client singleton
│       ├── redis.ts                            → Redis client singleton
│       ├── queue.ts                            → BullMQ queue factory
│       ├── argon2.ts                           → Hash + verify helpers
│       ├── jwt.ts                              → Sign + verify tokens
│       ├── ref-generator.ts                    → Generate USR-XXXXXX, PO-XXXX, TXN-XXXX
│       ├── settings.ts                         → getSetting(key) with Redis cache
│       ├── errors.ts                           → Custom error classes + error codes
│       └── logger.ts                           → Pino logger config
│
├── Dockerfile
├── tsconfig.json
└── package.json
```

---

## SHARED PACKAGE — packages/shared/

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── user.types.ts                       → User, UserRole, UserStatus
│   │   ├── tree.types.ts                       → TreeNode, Side
│   │   ├── wallet.types.ts                     → Wallet, Transaction, TxCategory
│   │   ├── order.types.ts                      → Order, OrderItem, OrderStatus
│   │   ├── commission.types.ts                 → CommissionCycle, TeamCommission
│   │   ├── rank.types.ts                       → Rank, UserRank
│   │   ├── notification.types.ts               → Notification, NotificationType
│   │   └── api.types.ts                        → ApiResponse<T>, PaginatedResponse<T>
│   │
│   ├── constants/
│   │   ├── roles.ts                            → UserRole enum values
│   │   ├── status.ts                           → Status enum values + color mapping
│   │   ├── routes.ts                           → Frontend route constants
│   │   └── events.ts                           → Socket.io event names
│   │
│   └── utils/
│       ├── format-egp.ts                       → formatEGP(1234.5) → "EGP 1,234.50"
│       ├── format-date.ts                      → Arabic + English date formats
│       ├── generate-ref.ts                     → Reference number generator
│       └── bv-utils.ts                         → BV formatting helpers
│
├── tsconfig.json
└── package.json
```

---

## DATABASE PACKAGE — packages/db/

```
packages/db/
├── prisma/
│   ├── schema.prisma                           → Full schema (from CREDO_W_FINAL_PLAN.md)
│   ├── migrations/
│   │   └── 20260505000000_init/
│   │       └── migration.sql
│   └── seed/
│       ├── index.ts                            → Main seed runner
│       ├── admin.seed.ts                       → Admin user
│       ├── products.seed.ts                    → Sample products + categories
│       ├── ranks.seed.ts                       → All rank tiers
│       └── settings.seed.ts                    → system_settings defaults
│
├── src/
│   └── index.ts                                → Export Prisma client
│
├── tsconfig.json
└── package.json
```

---

## ROOT CONFIG FILES

```
credo-w/
├── turbo.json
│   {
│     "pipeline": {
│       "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
│       "dev":   { "cache": false, "persistent": true },
│       "lint":  {},
│       "test":  {}
│     }
│   }
│
├── docker-compose.yml
│   services:
│     postgres:    PostgreSQL 16
│     redis:       Redis 7
│     api:         apps/api (port 3001)
│     web:         apps/web (port 3000)
│     worker:      apps/api (BullMQ workers only)
│
├── .env.example
│   DATABASE_URL=postgresql://credow:password@localhost:5432/credow
│   REDIS_URL=redis://:password@localhost:6379
│   JWT_SECRET=
│   JWT_REFRESH_SECRET=
│   ARGON2_SECRET=
│   NEXT_PUBLIC_API_URL=http://localhost:3001
│   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
│
└── package.json
    {
      "workspaces": ["apps/*", "packages/*"]
    }
```

---

## NAMING CONVENTIONS

| Element | Convention | Example |
|---|---|---|
| Components | PascalCase | `WalletBalanceCard.tsx` |
| Hooks | camelCase + use prefix | `useWalletPin.ts` |
| API functions | camelCase + module prefix | `wallet.api.ts → getWallet()` |
| Routes file | kebab-case module | `auth.routes.ts` |
| Service file | kebab-case module | `auth.service.ts` |
| Schema file | kebab-case module | `auth.schema.ts` |
| DB tables | snake_case | `wallet_transactions` |
| Prisma models | PascalCase | `WalletTransaction` |
| Env vars | UPPER_SNAKE | `JWT_SECRET` |
| Constants | UPPER_SNAKE | `WEEKLY_CAP_EGP` |

---

## STATE MANAGEMENT PATTERN

```
Server State (API data)     → TanStack Query (useQuery, useMutation)
Client State (UI)           → Zustand stores
Form State                  → React Hook Form + Zod
Real-time State             → Socket.io events → update Zustand + TanStack Query cache
```

**مثال — Wallet balance يتحدث real-time:**
```typescript
// 1. TanStack Query fetches initial data
const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: getWallet });

// 2. Socket event updates the cache directly
const socket = useSocket();
useEffect(() => {
  socket.on('wallet.credited', (data) => {
    queryClient.setQueryData(['wallet'], (old) => ({
      ...old,
      earnings: old.earnings + data.amount
    }));
    toast.success(`تم إضافة ${formatEGP(data.amount)} إلى محفظتك`);
  });
}, [socket]);
```

---

## API CLIENT PATTERN

```typescript
// lib/api/client.ts
const apiClient = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

// Auto-attach JWT
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401) {
    await refreshToken();  // get new access token
    return apiClient.request(error.config);  // retry original request
  }
  throw error;
});

// lib/api/wallet.api.ts
export const getWallet = () =>
  apiClient.get<ApiResponse<WalletData>>('/api/wallet').then(r => r.data.data);

export const transferCMoney = (body: TransferBody) =>
  apiClient.post<ApiResponse<Transaction>>('/api/wallet/transfer', body).then(r => r.data.data);
```

---

## FOLDER CREATION COMMANDS

```bash
# من root الـ project
cd apps/web/src

# Components
mkdir -p components/{layout,ui,shared,auth,dashboard,tree,shop,wallet,withdrawal,team,earnings,ranks,notifications,support,admin}
mkdir -p components/shared/DataTable

# App routes
mkdir -p app/\(public\)/{login,register}
mkdir -p app/\(ambassador\)/{dashboard,profile,shop/{[productId],cart,checkout,orders/[orderId]},team/{referrals,genealogy,tree,business-volume,personal-volume},earnings/{wallet,team-commission,direct-commission,rank-bonus},withdrawal/accounts,ranks,support/[ticketId]}
mkdir -p app/\(admin\)/admin/{users/[userId],commissions/[cycleId],withdrawals,products,vouchers,ranks,support/[ticketId],settings,audit}

# Lib
mkdir -p lib/api

# Other
mkdir -p hooks providers store types i18n
```
