# 🌾 PRD v3 — Beginner-Friendly Agriculture Equipment Rental Platform

**Version** - 3.0 (revised from v2 — same product, reorganized for a fresher learning Full Stack from fundamentals)
**Companion** - `TRD-Agriculture-Rental-Platform-v3.md`
**Legend** - **(Proposed)** = assumption, unchanged from v2 unless noted. **[CORE]** = must work for V1. **[SECONDARY]** = add after core works. **[FUTURE]** = not in V1.
**What changed from v2** - Same product, same roles, same booking lifecycle. Requirements are now tagged CORE/SECONDARY/FUTURE instead of P0/P1/P2, and everything is written to match a 13-milestone beginner learning path (full detail in TRD §12). No functional requirement was removed — only reordered and re-tagged.

---

## 1. Product Overview

- **Product** - Same as v2: a web platform where equipment owners list agricultural machinery for rent and farmers search, book, receive, use, return and review it.
- **Roles** - Farmer, Owner, Delivery Partner (simulated), Admin — unchanged.
- **Why this PRD exists** - You are a B.Tech CSE (AI/ML) fresher preparing for Full Stack interviews. This document keeps the real product requirements, but is written so every feature maps to something you will actually build, understand, and be able to explain — not something generated in one shot and never read.
- **Build model** - One React frontend, one Node/Express REST API, PostgreSQL, Supabase Storage for images, Leaflet + OpenStreetMap for maps — unchanged architecture from v2 (TRD §6).
- **Learning model** - Built in 13 milestones, ordered so fundamentals come before frameworks, and frameworks come before "extra" libraries (TRD §3, §12).

---

## 2. Problem Statement

*(Unchanged from v2)*
- **Farmers** cannot afford tractors, harvesters, tillers, seeders and similar equipment.
- **Owners** have equipment sitting idle with no structured way to rent it out safely.
- **Trust gap** - no standard agreement, no handover record, no before/after condition evidence, no dispute path.
- **Logistics gap** - large equipment is hard to move; handover method is ad hoc.

---

## 3. Goals

### 3.1 Product goals (unchanged from v2)
- **G1 Rental loop** - Farmer can find equipment, see availability, get a price, accept an agreement and book.
- **G2 Owner control** - Owner can list, manage, confirm or reject.
- **G3 Safe handover** - Three handover methods with a clear status timeline.
- **G4 Evidence** - Agreement record plus before/after condition photos and damage reports.
- **G5 Trust** - Reviews after completed rentals; admin can moderate and resolve disputes.
- **G6 No double booking** - Overlapping bookings for one equipment are impossible.
- **G8 Portfolio quality** - Deployed, documented, role-secure, understandable by a fresher.

### 3.2 Learning goals **(new in v3)**
- **L1** - Genuinely learn HTML, CSS, JavaScript, React, HTTP/REST, Node.js, Express, SQL, PostgreSQL and authentication from fundamentals — not just copy generated code.
- **L2** - Introduce TypeScript, Tailwind, React Hook Form, Zod, TanStack Query, Prisma, JWT and Leaflet only once the concept they sit on top of (plain JS, plain CSS, fetch, SQL, sessions/tokens) is understood.
- **L3** - Be able to explain, in an interview, every file created — not just that "AI generated it."
- **L4** - Be able to honestly list on a resume only the technologies actually used and understood (TRD §13).

---

## 4. Non-Goals (V1) — **[FUTURE]**

Unchanged from v2:
- **Payments** - no payment gateway; price is calculated and shown only.
- **Live GPS** - no live location; status timeline only.
- **AI** - no AI features until the core app works (M12+ TRD, was M10 in v2).
- **Real logistics integration** - Delivery Partner is simulated.
- **Realtime sockets** - no Socket.IO; notifications refresh by polling.
- **Extra infrastructure** - no Redis, GraphQL, microservices, Kubernetes, Redux, Next.js, Angular, Vue, MongoDB. Docker only if genuinely required.
- **Email/SMS/WhatsApp, KYC, chat** - out of V1.

---

## 5. User Roles *(unchanged from v2)*

| Role | Who | Created how | Main goal |
|---|---|---|---|
| **👨‍🌾 Farmer** | Needs equipment | Self-register | Find, book, receive, return, review |
| **🚜 Owner** | Owns equipment | Self-register | List, confirm bookings, hand over, get equipment back |
| **🛵 Delivery Partner** | Simulated logistics | Created by Admin **(Proposed)** | Move equipment between owner and farmer |
| **🛡️ Admin** | Platform operator | Seeded **(Proposed)** | Moderate users/listings, assign partners, resolve disputes |
| **Guest** | Not logged in | – | Browse equipment **(Proposed)** |

---

## 6. User Permissions *(unchanged from v2)*

| Capability | Guest | Farmer | Owner | Partner | Admin |
|---|:-:|:-:|:-:|:-:|:-:|
| Browse / search / view equipment | ✓ | ✓ | ✓ | – | ✓ |
| See owner phone | ✗ | After booking CONFIRMED **(Proposed)** | Own | ✗ | ✓ |
| Create / edit / deactivate own listing | ✗ | ✗ | ✓ | ✗ | ✗ |
| Remove any listing | ✗ | ✗ | ✗ | ✗ | ✓ |
| Create booking | ✗ | ✓ | ✗ | ✗ | ✗ |
| Confirm / reject booking | ✗ | ✗ | ✓ (own equipment) | ✗ | ✗ |
| Cancel booking | ✗ | ✓ (own) | ✓ (own equipment, before handover) | ✗ | ✗ |
| Update handover status | ✗ | Confirm receipt | ✓ (pickup / owner delivery) | ✓ (assigned) | ✗ |
| Request return | ✗ | ✓ | ✗ | ✗ | ✗ |
| Confirm return / complete | ✗ | ✗ | ✓ | ✗ | Complete disputed |
| Submit condition report | ✗ | ✗ | ✓ | ✗ | ✗ |
| Acknowledge condition | ✗ | ✓ | ✗ | ✗ | ✗ |
| Report damage / open dispute | ✗ | ✓ | ✓ | ✗ | ✗ |
| Resolve dispute | ✗ | ✗ | ✗ | ✗ | ✓ |
| Review equipment/owner | ✗ | ✓ (after COMPLETED) | ✗ | ✗ | ✗ |
| Assign delivery partner | ✗ | ✗ | ✗ | ✗ | ✓ **(Proposed)** |
| Manage users (suspend, create partner) | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 7. Functional Requirements — now tagged CORE / SECONDARY / FUTURE

Same FR IDs as v2. Tag replaces the old P0/P1/P2 priority.

### 7.1 Authentication & Accounts
| ID | Requirement | Tag |
|---|---|:-:|
| FR-AUTH-01 | Register as Farmer or Owner with name, email, phone, password | **CORE** |
| FR-AUTH-02 | Log in with email or phone + password | **CORE** |
| FR-AUTH-03 | Log out | **CORE** |
| FR-AUTH-04 | View current user profile | **CORE** |
| FR-AUTH-05 | Role-based access to pages and APIs | **CORE** |
| FR-AUTH-06 | Update own name and phone | **SECONDARY** |
| FR-AUTH-07 | Seeded Admin; Admin creates Delivery Partner accounts | **CORE** |
| FR-AUTH-08 | Suspended users cannot log in or use the API | **SECONDARY** |

### 7.2 Equipment Listing (Owner)
| ID | Requirement | Tag |
|---|---|:-:|
| FR-EQP-01 | Create listing: name, category, brand, model, description, features, price/day, pickup location | **CORE** |
| FR-EQP-02 | Upload multiple images, choose primary, remove | **SECONDARY** (needs Supabase, TRD Level 7) |
| FR-EQP-03 | Edit listing | **CORE** |
| FR-EQP-04 | Deactivate/delete listing | **CORE** |
| FR-EQP-05 | View own listings | **CORE** |
| FR-EQP-06 | Define availability windows (date ranges) | **CORE** |
| FR-EQP-07 | Pickup location as address text plus map pin | **SECONDARY** (map pin needs Leaflet; address text is CORE) |

### 7.3 Discovery (Farmer / Guest)
| ID | Requirement | Tag |
|---|---|:-:|
| FR-DSC-01 | Keyword search | **CORE** |
| FR-DSC-02 | Filter by category, price range, location, available dates | **CORE** (basic filters) / **SECONDARY** (location radius) |
| FR-DSC-03 | Details page: images, price/day, features, owner name + rating, availability, location map | **CORE** (text version) / **SECONDARY** (map + images) |
| FR-DSC-04 | Sorting and pagination | **SECONDARY** |

### 7.4 Availability & Booking
| ID | Requirement | Tag |
|---|---|:-:|
| FR-AVL-01 | Check availability for chosen dates | **CORE** |
| FR-AVL-02 | Show already-booked dates on the booking screen | **SECONDARY** |
| FR-AVL-03 | Prevent overlapping bookings for the same equipment | **CORE** |
| FR-BKG-01 | Server-side price quote: days × price/day | **CORE** |
| FR-BKG-02 | Create booking request: dates, handover method, delivery location if needed | **CORE** |
| FR-BKG-03 | Owner confirms or rejects (with reason) | **CORE** |
| FR-BKG-04 | Farmer cancels before handover starts | **CORE** |
| FR-BKG-05 | Booking history and details for Farmer and Owner | **CORE** |

### 7.5 Rental Agreement
| ID | Requirement | Tag |
|---|---|:-:|
| FR-AGR-01 | Show agreement clauses (use, no resale, damage responsibility, return period) | **CORE** |
| FR-AGR-02 | Booking impossible until all clauses accepted; store version, user, timestamp | **CORE** |

### 7.6 Handover
| ID | Requirement | Tag |
|---|---|:-:|
| FR-HND-01 | **Farmer pickup** - show owner location, directions link | **CORE** (text address) / **SECONDARY** (map) |
| FR-HND-02 | **Owner delivery** - owner delivers to farmer's location | **SECONDARY** |
| FR-HND-03 | Farmer gives delivery location | **SECONDARY** |
| FR-HND-04 | **Logistics partner** option; Admin assigns a simulated partner | **SECONDARY** |
| FR-HND-05 | Authorized actor confirms each handover step | **CORE** |

### 7.7 Status Tracking
| ID | Requirement | Tag |
|---|---|:-:|
| FR-TRK-01 | Status timeline visible to Farmer, Owner, assigned Partner | **CORE** |
| FR-TRK-02 | Status updates by the authorized actor | **CORE** |
| FR-TRK-03 | Farmer confirms receipt → rental ACTIVE | **CORE** |

### 7.8 Return
| ID | Requirement | Tag |
|---|---|:-:|
| FR-RTN-01 | Farmer requests return and picks method | **CORE** |
| FR-RTN-02 | Owner confirms equipment returned | **CORE** |
| FR-RTN-03 | Owner completes booking after inspection | **CORE** |
| FR-RTN-04 | Logistics return leg updated by partner | **SECONDARY** |

### 7.9 Delivery Partner
| ID | Requirement | Tag |
|---|---|:-:|
| FR-DLV-01 | See assigned deliveries and returns | **SECONDARY** |
| FR-DLV-02 | See pickup and drop-off on map | **SECONDARY** |
| FR-DLV-03 | Update leg status | **SECONDARY** |

### 7.10 Condition & Damage
| ID | Requirement | Tag |
|---|---|:-:|
| FR-CND-01 | Owner submits pre-handover condition report with photos | **SECONDARY** |
| FR-CND-02 | Farmer acknowledges condition or raises a dispute | **SECONDARY** |
| FR-CND-03 | Owner submits post-return condition report with photos | **SECONDARY** |
| FR-CND-04 | Farmer or Owner reports damage/problem, opening a dispute | **SECONDARY** |
| FR-CND-05 | Admin resolves dispute with a note | **SECONDARY** |

### 7.11 Reviews
| ID | Requirement | Tag |
|---|---|:-:|
| FR-REV-01 | Farmer rates (1–5) + comments on equipment and owner after COMPLETED | **CORE** (basic version, no images) |
| FR-REV-02 | Ratings/reviews shown on equipment details with average | **CORE** |

### 7.12 Notifications
| ID | Requirement | Tag |
|---|---|:-:|
| FR-NTF-01 | In-app notification on key events | **SECONDARY** |
| FR-NTF-02 | List, unread count, mark read / mark all read | **SECONDARY** |

### 7.13 Admin
| ID | Requirement | Tag |
|---|---|:-:|
| FR-ADM-01 | View, suspend, reactivate users | **CORE** (basic) |
| FR-ADM-02 | Moderate/remove listings | **SECONDARY** |
| FR-ADM-03 | View all bookings and disputes | **SECONDARY** |

### 7.14 Platform
| ID | Requirement | Tag |
|---|---|:-:|
| FR-PLT-01 | Responsive UI (mobile and desktop) | **CORE** |
| FR-PLT-02 | Role-specific dashboards | **CORE** |

**Why the CORE line is drawn here** - CORE is exactly what one Farmer and one Owner need to complete one full rental (list → find → book → confirm → hand over by text address → track → return → review) without images, maps, or notifications. That loop is what M11 (TRD) delivers and is the smallest version of the product that is still a real, demoable full-stack app.

---

## 8. Non-Functional Requirements

Unchanged in substance from v2, restated simply:
- **Security** - Hashed passwords, JWT auth, server checks every request, no secrets in Git. *(Learned in M10.)*
- **Data integrity** - No double bookings, even if two people click "book" at the same second. *(Learned in M7–M8, enforced in M11.)*
- **Privacy** - Owner phone hidden until booking confirmed; condition/damage photos visible only to the people involved. **(Proposed)**
- **Correctness** - Price and status are always calculated on the server, never trusted from the browser.
- **Usability** - Works on a phone screen; readable, labelled forms.
- **Maintainability** - Small, understandable files; one feature = one small change.
- **Learnability** - No technology appears before the milestone that teaches it.
- **Cost** - Free/low-cost hosting tiers; OpenStreetMap needs no paid API key.

---

## 9. User Journeys *(unchanged from v2)*

| Journey | Path |
|---|---|
| **J1 Happy path (CORE)** | Owner lists → Farmer books → Owner confirms → handover → ACTIVE → return → COMPLETED → review |
| **J2 Rejection (CORE)** | Farmer books → Owner rejects with reason → Farmer notified |
| **J3 Cancellation (CORE)** | Farmer/Owner cancels before handover leg starts → dates freed |
| **J4 Logistics (SECONDARY)** | Farmer picks logistics → Admin assigns Partner → Partner moves equipment → Farmer confirms |
| **J5 Dispute (SECONDARY)** | Damage or condition problem → DISPUTED → Admin resolves → COMPLETED |
| **J6 Conflict (CORE)** | Two farmers request overlapping dates → Owner confirms one → confirming the other is refused |

---

## 10. Farmer Flow *(unchanged from v2, tags added)*

1. **Register / log in** — CORE
2. **Search** — CORE
3. **View details** — CORE (text) / SECONDARY (images, map)
4. **Choose dates** — CORE
5. **See price** — CORE
6. **Choose handover** — CORE (pickup) / SECONDARY (delivery, logistics)
7. **Accept agreement** — CORE
8. **Submit** — CORE
9. **Wait for confirmation** — CORE
10. **Track** — CORE (status list) / SECONDARY (notification)
11. **Receive** — CORE (confirm receipt) / SECONDARY (condition photos)
12. **Return** — CORE
13. **Review** — CORE

## 11. Owner Flow *(unchanged from v2, tags added)*

1. **Register / log in** — CORE
2. **Create listing** — CORE
3. **Set availability** — CORE
4. **Receive request** — CORE
5. **Confirm or reject** — CORE
6. **Prepare & hand over** — CORE (confirm step) / SECONDARY (condition photos)
7. **Receive return** — CORE
8. **Close** — CORE (complete) / SECONDARY (dispute)

## 12. Delivery Partner Flow — **[SECONDARY]** *(unchanged from v2)*

1. **Log in** — account created by Admin.
2. **Dashboard** — assigned deliveries and returns.
3. **Open assignment** — pickup/drop-off addresses.
4. **Update status** — PICKED_UP → IN_TRANSIT → ARRIVING → DELIVERED.

## 13. Admin Flow *(unchanged from v2, tags added)*

1. **Seeded login** — CORE
2. **Users** — suspend/reactivate — CORE (basic) / create Partner — SECONDARY
3. **Listings** — remove — SECONDARY
4. **Bookings** — view all; assign Partner — SECONDARY
5. **Disputes** — resolve — SECONDARY

---

## 14. Booking Lifecycle *(unchanged from v2)*

**Statuses** - `PENDING`, `REJECTED`, `CANCELLED`, `CONFIRMED`, `READY_FOR_HANDOVER`, `PICKED_UP`, `IN_TRANSIT`, `ARRIVING`, `DELIVERED`, `ACTIVE`, `RETURN_REQUESTED`, `RETURNED`, `COMPLETED`, `DISPUTED`

**CORE path (pickup only)** - PENDING → CONFIRMED → READY_FOR_HANDOVER → PICKED_UP → ACTIVE → RETURN_REQUESTED → RETURNED → COMPLETED.
**SECONDARY additions** - IN_TRANSIT, ARRIVING, DELIVERED (delivery/logistics legs), DISPUTED (damage reports).

Full transition table with actors is in TRD §12 (M11) — same table as v2 TRD §17.

---

## 15. Handover Flows

- **Farmer pickup — CORE.** Farmer sees owner's text address; Owner marks READY_FOR_HANDOVER then PICKED_UP; Farmer confirms ACTIVE.
- **Owner delivery — SECONDARY.** Adds IN_TRANSIT/DELIVERED steps and a map picker for the delivery location.
- **Logistics partner — SECONDARY.** Adds Admin assignment and the Partner dashboard.

*(Full step-by-step flows are unchanged from v2 PRD §15 — see there for the complete version; only the CORE/SECONDARY split is new.)*

## 16. Return Flows

- **Farmer drop-off — CORE.** Request return → Farmer returns it → Owner confirms RETURNED → COMPLETED.
- **Logistics return — SECONDARY.** Adds Partner-updated return leg.

## 17. Damage Inspection — **[SECONDARY]**

Unchanged from v2: pre/post condition photos, damage reports, disputes, Admin resolution. Deliberately excluded from CORE so the first working version of the app doesn't require Supabase Storage yet.

## 18. Reviews — **[CORE, simplified]**

Star rating (1–5) + comment, for equipment and owner, after COMPLETED. No photo attachments in CORE (that would depend on SECONDARY image upload).

## 19. Notifications — **[SECONDARY]**

Unchanged from v2: in-app bell, unread count, mark read. Deliberately SECONDARY — the CORE loop is fully usable by refreshing the bookings page.

---

## 20. V1 Scope — Reorganized

### CORE (must work — this is "the project works")
- Auth (register/login/logout/me), RBAC on routes and APIs.
- Equipment CRUD (text-only listing, no images yet).
- Search + basic filters.
- Availability + double-booking prevention.
- Booking creation, price quote, agreement acceptance.
- Owner confirm/reject/cancel.
- Pickup-only handover with status timeline.
- Return + complete.
- Basic star review.
- Admin can view/suspend users.
- Responsive UI, role dashboards.

### SECONDARY (added once CORE works — TRD Level 7 / M12)
- Image upload (Supabase Storage).
- Owner delivery + logistics partner handover (adds IN_TRANSIT/DELIVERED, Partner dashboard, Admin assignment).
- Leaflet maps for pickup/delivery location.
- Condition photos, damage reports, disputes.
- In-app notifications.
- Advanced filters, pagination, sorting.
- React Hook Form + Zod (replacing the plain-JS form validation used in CORE).
- TanStack Query (replacing the plain `fetch` + `useState` data loading used in CORE).
- Full Admin (listing moderation, dispute resolution).

### FUTURE (not in V1 at all)
- Payments/deposits, live GPS, AI features, real logistics integration, email/SMS, Socket.IO, Redis.

---

## 21. Future Scope *(unchanged from v2)*

- **Payments** - Gateway, deposits, damage charges, delivery fees.
- **Live GPS tracking** - WebSockets/Socket.IO.
- **AI (M13+, after V1)** - Natural-language equipment search, recommendations, rental assistant.
- **Auth extras** - Forgot/reset password, email verification, refresh tokens.
- **Notifications** - Email, SMS, WhatsApp.
- **Reviews** - Owner reviews farmer; partner ratings.
- **Discovery** - Radius search; multiple languages.
- **Trust** - Owner/equipment verification (KYC).
- **Admin** - Statistics dashboard.
- **Partners** - Self-registration; real logistics integration.

---

## 22. Milestones (summary — full detail in TRD §12)

| # | Milestone | Delivers |
|---|---|---|
| **M1** | HTML + CSS | Static screens, mock data, no backend |
| **M2** | JavaScript | Interactions, validation, filtering on the static screens |
| **M3** | React | Same UI rebuilt as components, still mock data |
| **M4** | TypeScript + React Router | Typed components, multiple pages, navigation |
| **M5** | Tailwind CSS | Restyle using utility classes, after CSS is understood |
| **M6** | Backend fundamentals | Node + Express, first REST endpoints (no DB yet — in-memory) |
| **M7** | PostgreSQL + SQL | Real database, raw SQL queries, connect backend to it |
| **M8** | Prisma | Replace raw SQL calls with Prisma, understanding what it generates |
| **M9** | Frontend + backend integration | React calls the real API with `fetch`; loading/error states |
| **M10** | Authentication | Register, login, hashing, JWT, middleware, RBAC, protected routes |
| **M11** | Core rental workflow | Equipment → availability → booking → confirm/reject → status → return → review (**this is where CORE scope, §20, becomes a working app**) |
| **M12** | Advanced V1 features | Everything tagged SECONDARY in §20 |
| **M13** | Testing, debugging, deployment | Postman, DevTools, logging, Git workflow, live deployment |

This replaces the M0–M10 milestone list in PRD v2 — same destination, more granular early steps so no technology is introduced before its fundamentals.

---

## 23. Acceptance Criteria

Same criteria as v2, re-tagged. Full **Given/When/Then** list is unchanged — see v2 PRD §23 for the complete text; the tag mapping is:

**CORE** - AC-AUTH-1, AC-AUTH-2, AC-EQP-1, AC-EQP-2, AC-DSC-1, AC-AVL-1, AC-AVL-2, AC-BKG-1, AC-BKG-2, AC-BKG-3, AC-BKG-4, AC-HND-1 (text-address version), AC-TRK-1, AC-RTN-1, AC-REV-1 (basic), AC-PLT-1, AC-SCOPE-1.

**SECONDARY** - AC-AUTH-3, AC-EQP-3, AC-HND-2, AC-HND-3, AC-CND-1, AC-CND-2, AC-CND-3, AC-NTF-1, AC-ADM-1.

---

## 24. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Learning overload** | Stall | Strict Level/Milestone order (TRD §3, §12); one concept at a time |
| **AI-generated code not understood** | Can't defend it in an interview | Every milestone has "I Must Understand" + "I Must Verify" (TRD §15); one task per prompt |
| **Double booking under concurrency** | Trust loss | DB-level guarantee, taught in M7–M8, enforced in M11 |
| **Status-machine bugs** | Broken flows | Single transition table, tested in M11 |
| **Resume overclaiming** | Fails technical interview | Resume-readiness checklist (TRD §13) — a tech is only listed once its checklist is complete |
| **Scope creep** | Never finishing CORE | CORE/SECONDARY/FUTURE split (§20) is the hard boundary |
| **Free-tier limits** | Slow/paused services | Small dataset; document limits |

---

## 25. Open Questions *(unchanged from v2)*

- **Cancellation** - Free cancel before handover leg starts **(Proposed)**.
- **Delivery fee** - Ignored in V1 price **(Proposed)**.
- **Deposits / damage compensation** - Outside platform in V1.
- **Partner assignment** - Admin assigns **(Proposed)**.
- **Owner phone visibility** - After CONFIRMED **(Proposed)**.
- **PENDING requests** - Do not block dates **(Proposed)**.
- **Categories** - Tractor, Harvester, Tiller, Seeder, Sprayer, Other **(Proposed)**.
- **Guest browsing** - Allowed **(Proposed)**.

Technical open questions are tracked in TRD's "Open Technical Decisions" section.
