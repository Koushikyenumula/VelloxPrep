# 🎯 Entity Layer — Interview Preparation Guide

> **Purpose:** This document covers every JPA, Hibernate, and Lombok concept used in our entity classes.  
> Each section includes **interview questions, model answers, and code references** from this project so you can explain with confidence.

---

## 📋 Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Core JPA Annotations](#2-core-jpa-annotations)
3. [Primary Key & Generation Strategies](#3-primary-key--generation-strategies)
4. [Column Mapping & Constraints](#4-column-mapping--constraints)
5. [Enum Mapping](#5-enum-mapping)
6. [Entity Relationships (The Big Topic)](#6-entity-relationships-the-big-topic)
7. [Cascade Types & Orphan Removal](#7-cascade-types--orphan-removal)
8. [Fetch Types — LAZY vs EAGER](#8-fetch-types--lazy-vs-eager)
9. [Bidirectional Relationships & `mappedBy`](#9-bidirectional-relationships--mappedby)
10. [Timestamps & Auditing](#10-timestamps--auditing)
11. [Lombok in JPA Entities](#11-lombok-in-jpa-entities)
12. [The N+1 Problem](#12-the-n1-problem)
13. [Entity Lifecycle & Persistence Context](#13-entity-lifecycle--persistence-context)
14. [`equals()`, `hashCode()` & Why It Matters](#14-equals-hashcode--why-it-matters)
15. [Database Schema Design Decisions](#15-database-schema-design-decisions)
16. [Rapid-Fire Questions](#16-rapid-fire-questions)

---

## 1. Schema Overview

```
┌──────────┐       ┌──────────────────┐       ┌─────────────────────┐
│   User   │1────N│ InterviewSession  │1────N│  InterviewQuestion   │
│          │       │                  │       └─────────────────────┘
│          │       │                  │1────N┌─────────────────────┐
│          │       │                  │       │  AnswerEvaluation   │
│          │       └──────────────────┘       └─────────────────────┘
│          │1────N┌──────────────────┐
│          │       │     Resume       │
│          │       └──────────────────┘
│          │1────N┌──────────────────┐
│          │       │    Progress      │
└──────────┘       └──────────────────┘
```

**Entities:** `User`, `Resume`, `InterviewSession`, `InterviewQuestion`, `AnswerEvaluation`, `Progress`  
**Enums:** `Role`, `Difficulty`, `SessionStatus`

---

## 2. Core JPA Annotations

### ❓ Q: What is the difference between `@Entity` and `@Table`?

**Answer:**

| Annotation | Purpose |
|------------|---------|
| `@Entity` | Marks the Java class as a JPA entity — it tells Hibernate "this class maps to a database table." It is **mandatory**. |
| `@Table` | **Optional.** Customizes the table name and constraints. Without it, the table name defaults to the class name. |

**From our code (User.java):**
```java
@Entity                                              // mandatory
@Table(name = "users", uniqueConstraints = {         // customizes table name + constraints
    @UniqueConstraint(name = "uk_users_email", columnNames = "email")
})
public class User { ... }
```

We use `@Table(name = "users")` instead of letting it default to `"User"` because `user` is a **reserved keyword** in many databases (MySQL, PostgreSQL).

---

### ❓ Q: Why did you name the table `users` instead of `user`?

**Answer:**  
`USER` is a **reserved keyword in SQL** (it's a built-in function in MySQL/PostgreSQL). Using it directly would cause syntax errors unless you escape it with backticks. Naming it `users` avoids this entirely — it's a widely adopted convention.

---

### ❓ Q: What is `@UniqueConstraint` and how is it different from `@Column(unique = true)`?

**Answer:**

| Feature | `@Column(unique = true)` | `@UniqueConstraint` |
|---------|--------------------------|---------------------|
| Where | Field level | `@Table` level |
| Constraint name | Auto-generated (ugly) | You provide a **readable name** |
| Composite unique | ❌ No | ✅ Yes — multiple columns |

**From our code — we use both:**
```java
// Field-level (auto-generated constraint name)
@Column(nullable = false, unique = true, length = 150)
private String email;

// Table-level (explicit constraint name: "uk_users_email")
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(name = "uk_users_email", columnNames = "email")
})
```

> **Pro tip for interview:** Say "I prefer `@UniqueConstraint` at the table level because it lets me name the constraint, which makes database error messages much easier to debug in production."

---

## 3. Primary Key & Generation Strategies

### ❓ Q: Explain `@Id` and `@GeneratedValue`. What generation strategies are available?

**Answer:**

`@Id` marks the primary key field. `@GeneratedValue` tells JPA how to auto-generate the value.

| Strategy | How it works | Database support | Batch-friendly? |
|----------|-------------|-----------------|-----------------|
| `IDENTITY` | Uses DB auto-increment (`AUTO_INCREMENT` in MySQL) | MySQL, SQL Server | ❌ No |
| `SEQUENCE` | Uses a DB sequence object | PostgreSQL, Oracle | ✅ Yes |
| `TABLE` | Uses a separate table to simulate sequences | All | ❌ Slow |
| `AUTO` | JPA picks the best strategy for your DB | All | Depends |

**From our code (every entity):**
```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

---

### ❓ Q: Why did you choose `IDENTITY` over `SEQUENCE`?

**Answer:**  
We're using **MySQL**, which natively supports `AUTO_INCREMENT` but doesn't have real sequences (until MySQL 8.0.17+ and even then it's limited). `IDENTITY` maps directly to `AUTO_INCREMENT` — it's the natural choice for MySQL.

---

### ❓ Q: What is the downside of `IDENTITY` strategy?

**Answer:**  
Hibernate **cannot batch INSERT statements** with `IDENTITY` because it needs to execute each INSERT individually to get back the generated ID from the database. With `SEQUENCE`, Hibernate can pre-allocate a range of IDs and batch multiple inserts together.

> **Follow-up they might ask:** "So when would you switch?"  
> **Answer:** "If we migrated to PostgreSQL and needed high-throughput bulk inserts, I'd switch to `SEQUENCE` with an `allocationSize` of 50 for better batch performance."

---

### ❓ Q: Why use `Long` instead of `long` (primitive) for the ID?

**Answer:**  
A `Long` (wrapper) can be `null`, which means **"this entity hasn't been persisted yet."** A primitive `long` defaults to `0`, and Hibernate can't distinguish between "new entity" and "entity with ID 0."

---

## 4. Column Mapping & Constraints

### ❓ Q: Explain the `@Column` annotation attributes you've used.

**Answer:**

```java
@Column(nullable = false, length = 100)      // NOT NULL, VARCHAR(100)
private String name;

@Column(nullable = false, unique = true, length = 150)  // NOT NULL + UNIQUE
private String email;

@Column(name = "ats_score")                  // custom column name
private Double atsScore;

@Column(columnDefinition = "TEXT")           // override default VARCHAR → TEXT
private String extractedSkills;

@Column(nullable = false, updatable = false) // cannot be changed after INSERT
private LocalDateTime createdAt;
```

| Attribute | Purpose |
|-----------|---------|
| `nullable = false` | Adds `NOT NULL` constraint in DDL |
| `length = 100` | Sets `VARCHAR(100)` — default is 255 |
| `unique = true` | Adds a unique constraint |
| `name = "ats_score"` | Overrides the column name (otherwise it would be `ats_score` via Spring's naming strategy anyway, but explicit is better) |
| `columnDefinition = "TEXT"` | Uses the exact SQL type instead of JPA defaults |
| `updatable = false` | JPA will never include this column in UPDATE queries |

---

### ❓ Q: When would you use `columnDefinition = "TEXT"` instead of just increasing `length`?

**Answer:**  
`TEXT` in MySQL can store up to **65,535 characters** — far beyond `VARCHAR(255)`. We use it for fields like `question`, `expectedAnswer`, `userAnswer`, and `aiFeedback` where the content can be very long. `VARCHAR` has a max of 65,535 bytes (shared across all VARCHAR columns in a row), so `TEXT` is stored off-page and doesn't count toward that limit.

---

## 5. Enum Mapping

### ❓ Q: What is the difference between `EnumType.STRING` and `EnumType.ORDINAL`?

**Answer:**

| Type | Stored as | Example for `Role.ADMIN` | Safe to reorder? |
|------|----------|--------------------------|------------------|
| `ORDINAL` (default) | Integer (0, 1, 2...) | `1` | ❌ **No!** Adding/reordering enums breaks existing data |
| `STRING` | Enum name as text | `"ADMIN"` | ✅ Yes |

**From our code:**
```java
@Enumerated(EnumType.STRING)    // stores "USER" or "ADMIN" — not 0 or 1
@Column(nullable = false, length = 20)
private Role role = Role.USER;
```

> ⚠️ **Critical interview point:** Always say "I always use `EnumType.STRING` because `ORDINAL` is fragile — if someone adds a new enum value in the middle, all existing rows become corrupted."

---

### ❓ Q: What happens if you don't specify `@Enumerated` at all?

**Answer:**  
JPA defaults to `EnumType.ORDINAL`, which stores the enum's ordinal position (0, 1, 2...). This is dangerous and should be avoided.

---

### ❓ Q: Where are enums used in this project?

**Answer:**

| Enum | Values | Used In |
|------|--------|---------|
| `Role` | `USER`, `ADMIN` | `User.role` |
| `Difficulty` | `EASY`, `MEDIUM`, `HARD` | `InterviewSession.difficulty`, `InterviewQuestion.difficulty` |
| `SessionStatus` | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` | `InterviewSession.status` |

We extracted difficulty into a **shared enum** because both `InterviewSession` and `InterviewQuestion` use it — this enforces consistency.

---

## 6. Entity Relationships (The Big Topic)

### ❓ Q: Explain all the relationships in your schema.

**Answer:**

| Relationship | Type | Parent (One) | Child (Many) | FK Column |
|-------------|------|--------------|-------------|-----------|
| User → Resumes | `@OneToMany` / `@ManyToOne` | `User` | `Resume` | `user_id` |
| User → InterviewSessions | `@OneToMany` / `@ManyToOne` | `User` | `InterviewSession` | `user_id` |
| User → Progress | `@OneToMany` / `@ManyToOne` | `User` | `Progress` | `user_id` |
| InterviewSession → Questions | `@OneToMany` / `@ManyToOne` | `InterviewSession` | `InterviewQuestion` | `session_id` |
| InterviewSession → Evaluations | `@OneToMany` / `@ManyToOne` | `InterviewSession` | `AnswerEvaluation` | `session_id` |

---

### ❓ Q: What is the difference between `@OneToMany`, `@ManyToOne`, `@OneToOne`, and `@ManyToMany`?

**Answer:**

| Annotation | Cardinality | FK location | Example |
|-----------|-------------|-------------|---------|
| `@OneToOne` | 1:1 | Either side | User → Profile |
| `@OneToMany` | 1:N | On the "Many" side | User → Resumes |
| `@ManyToOne` | N:1 | On this entity's table | Resume → User |
| `@ManyToMany` | M:N | **Join table** | Student ↔ Course |

In our project, all relationships are **`@OneToMany` / `@ManyToOne`** — no `@ManyToMany` because our domain doesn't require it.

---

### ❓ Q: Who is the "owning side" of a relationship? Why does it matter?

**Answer:**  
The **owning side** is the entity that **has the foreign key column** in its table. In a `@OneToMany`/`@ManyToOne` pair, the `@ManyToOne` side is **always** the owning side.

```java
// OWNING SIDE (Resume.java) — has the FK column
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id", nullable = false)
private User user;

// INVERSE SIDE (User.java) — uses mappedBy, no FK here
@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Resume> resumes = new ArrayList<>();
```

**Why it matters:** Only changes to the **owning side** are persisted to the database. If you only set `user.getResumes().add(resume)` without setting `resume.setUser(user)`, the foreign key column will remain `NULL`.

---

### ❓ Q: What is `@JoinColumn` and what happens without it?

**Answer:**  
`@JoinColumn` specifies the foreign key column name and constraints.

```java
@JoinColumn(name = "user_id", nullable = false,
    foreignKey = @ForeignKey(name = "fk_resumes_user"))
```

Without it, JPA auto-generates a column name like `user_id` (based on the field name + `_id`). We use it explicitly to:
1. **Name the FK column** clearly
2. **Name the FK constraint** (via `@ForeignKey`) for better DDL readability
3. **Set `nullable = false`** to enforce referential integrity

---

## 7. Cascade Types & Orphan Removal

### ❓ Q: What is `CascadeType.ALL` and what are the individual cascade types?

**Answer:**

`CascadeType.ALL` is a shorthand for **all six** cascade operations:

| Cascade Type | What it does |
|-------------|-------------|
| `PERSIST` | When parent is saved, children are saved too |
| `MERGE` | When parent is updated, children are updated too |
| `REMOVE` | When parent is deleted, children are deleted too |
| `REFRESH` | When parent is refreshed from DB, children are refreshed too |
| `DETACH` | When parent is detached from persistence context, children are too |
| `ALL` | All of the above |

**From our code:**
```java
@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Resume> resumes = new ArrayList<>();
```

This means: if I save/update/delete a `User`, all their `Resume` records are automatically saved/updated/deleted too.

---

### ❓ Q: What is `orphanRemoval = true`? How is it different from `CascadeType.REMOVE`?

**Answer:**  
This is a **very commonly asked question!**

| Feature | `CascadeType.REMOVE` | `orphanRemoval = true` |
|---------|----------------------|------------------------|
| Parent deleted | ✅ Children deleted | ✅ Children deleted |
| Child removed from collection | ❌ Child stays in DB | ✅ **Child deleted from DB** |

**Example with our code:**
```java
// With orphanRemoval = true:
user.getResumes().remove(someResume);  // This DELETE the resume from DB!

// Without orphanRemoval (only CascadeType.REMOVE):
user.getResumes().remove(someResume);  // Resume stays in DB with user_id = NULL (or FK violation)
```

> **Interview answer:** "`orphanRemoval` deletes the child when it's **disconnected from the parent**, not just when the parent is deleted. It's essential for parent-child relationships where a child has no meaning without its parent."

---

### ❓ Q: When should you NOT use `CascadeType.ALL`?

**Answer:**  
- **`@ManyToMany`** relationships — cascading delete could wipe out shared entities.
- When the child entity has **independent lifecycle** (e.g., a `Category` shared by many `Product`s).
- When performance matters — cascading large collections can be slow.

In our project, every child entity (Resume, InterviewQuestion, etc.) is fully **owned by** its parent and has no meaning without it, so `CascadeType.ALL` is appropriate.

---

## 8. Fetch Types — LAZY vs EAGER

### ❓ Q: What is the difference between `FetchType.LAZY` and `FetchType.EAGER`?

**Answer:**

| Fetch Type | When data is loaded | Default for |
|-----------|-------------------|-------------|
| `LAZY` | Only when you **access the property** | `@OneToMany`, `@ManyToMany` |
| `EAGER` | **Immediately** with the parent query | `@ManyToOne`, `@OneToOne` |

**From our code:**
```java
// We OVERRIDE the default for @ManyToOne (EAGER → LAZY)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id", nullable = false)
private User user;
```

---

### ❓ Q: Why did you explicitly set `FetchType.LAZY` on `@ManyToOne`?

**Answer:**  
Because `@ManyToOne` defaults to `EAGER`, which means every time you load a `Resume`, it would also load the `User`. And if `User` has `EAGER` collections, those get loaded too — causing a **cascading load of the entire object graph**.

Setting `FetchType.LAZY` means: "Only load the `User` when I actually call `resume.getUser()`."

> **Key principle:** Start with everything `LAZY`, then selectively fetch what you need using **JOIN FETCH** in JPQL or **EntityGraph**.

---

### ❓ Q: What is the `LazyInitializationException`? How do you solve it?

**Answer:**  
It occurs when you access a `LAZY` property **after the Hibernate session is closed** (e.g., outside a `@Transactional` method).

```java
User user = userRepository.findById(1L).get();  // session open
// ... session closes ...
user.getResumes().size();  // 💥 LazyInitializationException!
```

**Solutions (ranked best to worst):**

| Solution | Approach |
|----------|----------|
| ✅ **JOIN FETCH** (best) | `SELECT u FROM User u JOIN FETCH u.resumes WHERE u.id = :id` |
| ✅ **`@EntityGraph`** | `@EntityGraph(attributePaths = {"resumes"})` on repository method |
| ⚠️ **`@Transactional`** | Keep the session open longer (be careful with scope) |
| ❌ **Open Session in View** | `spring.jpa.open-in-view=true` — anti-pattern, avoid! |
| ❌ **`FetchType.EAGER`** | Loads everything always — performance killer |

---

## 9. Bidirectional Relationships & `mappedBy`

### ❓ Q: What does `mappedBy` do?

**Answer:**  
`mappedBy` tells JPA: "I am the **inverse (non-owning) side** of this relationship. The foreign key is managed by the field specified in `mappedBy`."

```java
// In User.java (inverse side)
@OneToMany(mappedBy = "user")  // "user" = the field name in Resume.java
private List<Resume> resumes;

// In Resume.java (owning side)
@ManyToOne
@JoinColumn(name = "user_id")
private User user;             // ← this is what "mappedBy = 'user'" points to
```

**Without `mappedBy`:** JPA creates a **join table** (like `users_resumes`) instead of using a foreign key — wasteful and unexpected.

---

### ❓ Q: Why do you have convenience helper methods like `addResume()`?

**Answer:**  
In bidirectional relationships, you must **sync both sides** manually — JPA doesn't do this for you.

```java
// ❌ WRONG — only sets one side, FK won't be set
user.getResumes().add(resume);

// ✅ CORRECT — our convenience method syncs both sides
public void addResume(Resume resume) {
    resumes.add(resume);       // sync collection side
    resume.setUser(this);      // sync owning side (sets the FK)
}
```

If you only add to the collection without setting the `@ManyToOne` side, the foreign key column stays `NULL` because only the **owning side** drives the SQL.

---

## 10. Timestamps & Auditing

### ❓ Q: How do you auto-populate `createdAt` and `uploadedAt`?

**Answer:**  
We use Hibernate's `@CreationTimestamp`:

```java
@CreationTimestamp
@Column(nullable = false, updatable = false)
private LocalDateTime createdAt;
```

| Annotation | Source | When it sets the value |
|-----------|--------|----------------------|
| `@CreationTimestamp` | Hibernate | On INSERT only |
| `@UpdateTimestamp` | Hibernate | On every INSERT and UPDATE |
| `@CreatedDate` | Spring Data JPA | On INSERT (requires `@EnableJpaAuditing`) |
| `@LastModifiedDate` | Spring Data JPA | On UPDATE (requires `@EnableJpaAuditing`) |

We chose `@CreationTimestamp` because it's simpler — no extra configuration needed. For a larger project, Spring Data's `@CreatedDate` / `@LastModifiedDate` with `@EnableJpaAuditing` is more flexible (supports `createdBy` too).

---

### ❓ Q: Why `updatable = false` on `createdAt`?

**Answer:**  
It prevents the timestamp from being changed after the initial insert. Even if someone accidentally calls `setCreatedAt(...)`, JPA will **exclude** this column from UPDATE statements. It's a safety net.

---

## 11. Lombok in JPA Entities

### ❓ Q: Which Lombok annotations are you using and why?

**Answer:**

```java
@Getter              // Generates all getter methods
@Setter              // Generates all setter methods
@NoArgsConstructor   // JPA REQUIRES a no-arg constructor
@AllArgsConstructor  // Needed by @Builder
@Builder             // Provides the builder pattern for clean object creation
```

---

### ❓ Q: Why does JPA require a no-argument constructor?

**Answer:**  
JPA creates entity instances via **reflection** using `Class.newInstance()`, which calls the no-arg constructor. Hibernate then populates the fields using setter methods or direct field access. Without a no-arg constructor, JPA throws an `InstantiationException`.

The constructor can be `protected` — it doesn't need to be `public`. Lombok's `@NoArgsConstructor` generates a `public` one by default.

---

### ❓ Q: What is `@Builder.Default` and why do you use it?

**Answer:**  
When you use `@Builder`, Lombok **ignores field initializers**. Without `@Builder.Default`, this happens:

```java
// WITHOUT @Builder.Default
@Builder
private Role role = Role.USER;

User user = User.builder().name("Koushik").build();
user.getRole();  // 💥 returns NULL, not Role.USER!

// WITH @Builder.Default
@Builder.Default
private Role role = Role.USER;

User user = User.builder().name("Koushik").build();
user.getRole();  // ✅ returns Role.USER
```

We use it on:
- `Role role = Role.USER` — sensible default for new users
- `SessionStatus status = SessionStatus.NOT_STARTED` — new sessions start as not started
- `List<Resume> resumes = new ArrayList<>()` — prevents `NullPointerException`
- Numeric defaults in `Progress` (`totalInterviews = 0`, etc.)

---

### ❓ Q: Should you use `@Data` on JPA entities?

**Answer:**  
**No!** `@Data` generates `equals()`, `hashCode()`, and `toString()` that include **all fields** — including lazy-loaded relationships. This causes:

1. **`LazyInitializationException`** — `toString()` triggers loading of lazy collections
2. **Infinite recursion** — `User.toString()` calls `Resume.toString()` which calls `User.toString()` → `StackOverflowError`
3. **Broken `equals`/`hashCode`** — mutable fields make entities behave incorrectly in `HashSet`/`HashMap`

> **Interview answer:** "I use `@Getter` + `@Setter` separately instead of `@Data` to avoid these pitfalls with JPA entities."

---

### ❓ Q: Why not use `@ToString` from Lombok?

**Answer:**  
Same problem — if `@ToString` includes a `@ManyToOne` or `@OneToMany` field, it can trigger:
- Lazy loading outside a session → `LazyInitializationException`
- Circular references → `StackOverflowError`

If you must use it, exclude relationship fields:
```java
@ToString(exclude = {"resumes", "interviewSessions", "progressRecords"})
```

---

## 12. The N+1 Problem

### ❓ Q: What is the N+1 problem? How does it relate to your entities?

**Answer:**  
The N+1 problem occurs when loading a list of parent entities triggers **one additional query per parent** to load their children.

**Example with our entities:**
```java
List<User> users = userRepository.findAll();  // 1 query: SELECT * FROM users
for (User user : users) {
    user.getResumes().size();  // N queries: SELECT * FROM resumes WHERE user_id = ?
}
// Total: 1 + N queries (if 100 users → 101 queries!)
```

**Solutions:**

```java
// 1. JOIN FETCH in JPQL
@Query("SELECT u FROM User u JOIN FETCH u.resumes")
List<User> findAllWithResumes();

// 2. @EntityGraph
@EntityGraph(attributePaths = {"resumes"})
List<User> findAll();

// 3. Batch fetching (hibernate property)
// spring.jpa.properties.hibernate.default_batch_fetch_size=20
```

---

### ❓ Q: Does our schema have the N+1 risk?

**Answer:**  
Yes — any `@OneToMany` with `FetchType.LAZY` (which is the default) can trigger it. In our schema:
- Loading `User` → accessing `resumes`, `interviewSessions`, or `progressRecords`
- Loading `InterviewSession` → accessing `interviewQuestions` or `answerEvaluations`

The fix is to use **JOIN FETCH** or **`@EntityGraph`** in repository queries where we know we'll need the children.

---

## 13. Entity Lifecycle & Persistence Context

### ❓ Q: What are the states of a JPA entity?

**Answer:**

```
                  persist()
    NEW/TRANSIENT ────────→ MANAGED
         ↑                    │  │
         │              merge()│  │ remove()
         │                    ↓  ↓
    DETACHED ←──────────── REMOVED
         ↑      detach() / 
         │      session close
         │
    MANAGED ──────────→ DETACHED
              session close
```

| State | In persistence context? | In database? | Example |
|-------|------------------------|-------------|---------|
| **Transient** | ❌ | ❌ | `new User()` |
| **Managed** | ✅ | ✅ (after flush) | `em.persist(user)` or `repo.save(user)` |
| **Detached** | ❌ | ✅ | After session closes / `em.detach()` |
| **Removed** | ✅ (marked for deletion) | ✅ (until flush) | `em.remove(user)` |

---

### ❓ Q: What is the Persistence Context?

**Answer:**  
It's a **first-level cache** managed by Hibernate. Within a single transaction:
- **Identity guarantee:** `em.find(User.class, 1L)` called twice returns the **same object instance** (not two copies).
- **Dirty checking:** Hibernate automatically detects field changes on managed entities and generates UPDATE statements at flush time — you don't need to call `save()` again.
- **Write-behind:** SQL statements are batched and executed at flush time, not immediately.

---

## 14. `equals()`, `hashCode()` & Why It Matters

### ❓ Q: How should you implement `equals()` and `hashCode()` for JPA entities?

**Answer:**  
This is tricky. **Do not use the auto-generated ID** in `hashCode()` because:
- Before persist: `id = null`
- After persist: `id = 42`
- If the entity is in a `HashSet`, changing `hashCode()` makes it **unfindable**

**Best practices (pick one):**

```java
// Option 1: Use a natural/business key (best)
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof User other)) return false;
    return email != null && email.equals(other.getEmail());
}

@Override
public int hashCode() {
    return getClass().hashCode();  // constant — safe across state transitions
}

// Option 2: Use @NaturalId (Hibernate-specific)
@NaturalId
@Column(nullable = false, unique = true)
private String email;
```

> **In our project:** We rely on Lombok's `@Getter`/`@Setter` without custom `equals`/`hashCode`. For a production system, you'd add them based on the business key (`email` for `User`).

---

## 15. Database Schema Design Decisions

### ❓ Q: Why did you use `@ManyToOne` for User → Progress instead of `@OneToOne`?

**Answer:**  
`@OneToMany` / `@ManyToOne` allows **multiple progress records per user** — e.g., tracking progress per skill category, per time period, or maintaining historical snapshots. `@OneToOne` would limit each user to a single progress row, which is less flexible.

---

### ❓ Q: Why store `extractedSkills` as `TEXT` instead of a separate table?

**Answer:**  
For simplicity in the initial design. The skills are stored as a **JSON string or comma-separated values**. A normalized `Skill` table with a `@ManyToMany` relationship would be better for querying/filtering by skill, but adds complexity. We can evolve to that later.

---

### ❓ Q: Why use `Double` (wrapper) instead of `double` (primitive) for scores?

**Answer:**  
`Double` can be `null`, representing "not yet scored." A primitive `double` defaults to `0.0`, which is **ambiguous** — does it mean "scored zero" or "not scored yet"? In `InterviewSession.score`, the session may not have a score until it's completed.

---

### ❓ Q: Why are FK constraints explicitly named (e.g., `fk_resumes_user`)?

**Answer:**
```java
@JoinColumn(name = "user_id", nullable = false,
    foreignKey = @ForeignKey(name = "fk_resumes_user"))
```

Without explicit names, Hibernate generates ugly random names like `FKa3k3j4h5...`. Named constraints make:
- **Error messages readable** — "Constraint `fk_resumes_user` violated" vs "Constraint `FK3h4j5k...` violated"
- **Migration scripts clearer** — `ALTER TABLE ... DROP CONSTRAINT fk_resumes_user`
- **DBA collaboration easier** — DBAs can understand the schema without reverse-engineering

---

## 16. Rapid-Fire Questions

These are short questions frequently asked at the end of interviews:

---

**Q: What is the difference between `save()` and `saveAndFlush()` in Spring Data JPA?**  
`save()` marks the entity as managed but may delay the SQL until transaction commit. `saveAndFlush()` immediately executes the SQL statement and syncs with the database.

---

**Q: What is the difference between `findById()` and `getById()` (now `getReferenceById()`)?**  
`findById()` hits the database immediately and returns `Optional<T>`. `getReferenceById()` returns a **lazy proxy** — no DB hit until you access a property. Throws `EntityNotFoundException` if not found.

---

**Q: Can an entity class be `final`?**  
No. Hibernate creates **proxy subclasses** for lazy loading. A `final` class cannot be subclassed. Hibernate will throw a warning or fall back to eager loading.

---

**Q: What is `spring.jpa.hibernate.ddl-auto`?**  

| Value | Behavior |
|-------|----------|
| `none` | Do nothing |
| `validate` | Validate schema matches entities, throw if mismatch |
| `update` | Auto-alter tables to match entities (safe for dev) |
| `create` | Drop and recreate on startup |
| `create-drop` | Drop and recreate on startup, drop on shutdown |

> **Production:** Always use `validate` or `none` with migration tools (Flyway/Liquibase).

---

**Q: What's the difference between `@JoinColumn` and `@JoinTable`?**  
`@JoinColumn` puts the FK in the child table (used with `@ManyToOne`/`@OneToOne`). `@JoinTable` creates a separate association table (used with `@ManyToMany`).

---

**Q: What is dirty checking in Hibernate?**  
Hibernate automatically tracks changes to **managed** entities. At flush time, it compares the current state with the original snapshot and generates UPDATE statements for modified fields — no explicit `save()` needed.

---

**Q: How does `@Transactional` relate to the persistence context?**  
A `@Transactional` method opens a persistence context (Hibernate Session) at the start and closes it at the end. All entities loaded within are **managed** for the duration. Lazy loading works within this boundary.

---

**Q: What annotation would you use to prevent a field from being persisted?**  
`@Transient` — tells JPA to ignore this field completely.

```java
@Transient
private String confirmPassword;  // not stored in DB
```

---

**Q: Difference between `@Entity` `@Embeddable` and `@MappedSuperclass`?**  

| Annotation | Own table? | Can be queried directly? | Use case |
|-----------|-----------|------------------------|----------|
| `@Entity` | ✅ Yes | ✅ Yes | Normal entity |
| `@Embeddable` | ❌ No (embedded in parent's table) | ❌ No | Value objects (Address, Money) |
| `@MappedSuperclass` | ❌ No | ❌ No | Share fields across entities (BaseEntity with id, createdAt) |

---

**Q: What is the difference between first-level cache and second-level cache?**  

| Feature | First-Level (L1) | Second-Level (L2) |
|---------|------------------|-------------------|
| Scope | Per session/transaction | Across sessions (application-wide) |
| Enabled by default? | ✅ Always | ❌ Must configure (EhCache, Redis) |
| Eviction | Session close | TTL-based or manual |

---

> 💡 **Tip for the interview:** When answering, always reference **specific code from your project.** Instead of saying "I used @OneToMany," say "In my User entity, I used @OneToMany with mappedBy='user', CascadeType.ALL, and orphanRemoval=true because Resume has no meaning without a User."

---

*Last updated: July 2026*
