# 🎯 Repository Layer — Interview Preparation Guide

> **Purpose:** This document covers Spring Data JPA repositories, query derivation, and data access patterns used in our repository layer.

---

## 📋 Table of Contents

1. [What Is Spring Data JPA Repository](#1-what-is-spring-data-jpa-repository)
2. [JpaRepository Hierarchy](#2-jparepository-hierarchy)
3. [Derived Query Methods](#3-derived-query-methods)
4. [Custom Queries with @Query](#4-custom-queries-with-query)
5. [Return Types](#5-return-types)
6. [Pagination & Sorting](#6-pagination--sorting)
7. [@Repository Annotation](#7-repository-annotation)
8. [Common Follow-Up Questions](#8-common-follow-up-questions)

---

## 1. What Is Spring Data JPA Repository

### ❓ Q: What is Spring Data JPA? How does your UserRepository work without any implementation?

**Answer:**  
Spring Data JPA **auto-generates the implementation** at runtime. You just define an interface that extends `JpaRepository`, and Spring creates a proxy class with all the CRUD methods.

**From our code:**
```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
```

We didn't write a single line of implementation — Spring Data:
1. Scans for interfaces extending `JpaRepository`
2. Creates a proxy implementation at startup using `SimpleJpaRepository`
3. Parses method names like `findByEmail` to generate JPQL queries automatically

---

### ❓ Q: What do the two generic parameters in `JpaRepository<User, Long>` mean?

**Answer:**

```java
JpaRepository<User, Long>
//             │      │
//             │      └── Type of the primary key (@Id field)
//             └── The entity type this repository manages
```

This gives us type-safe CRUD: `findById()` returns `Optional<User>`, `save()` accepts a `User`, etc.

---

## 2. JpaRepository Hierarchy

### ❓ Q: What is the difference between `CrudRepository`, `PagingAndSortingRepository`, and `JpaRepository`?

**Answer:**

```
Repository (marker interface)
    │
    ▼
CrudRepository<T, ID>
    │  - save(), findById(), findAll(), delete(), count(), existsById()
    │
    ▼
ListCrudRepository<T, ID>
    │  - findAll() returns List (not Iterable)
    │
    ▼
PagingAndSortingRepository<T, ID>
    │  - findAll(Sort), findAll(Pageable)
    │
    ▼
JpaRepository<T, ID>
       - flush(), saveAndFlush(), deleteInBatch()
       - findAll() returns List<T>
       - JPA-specific operations
```

| Interface | Key Methods Added | When to Use |
|----------|-------------------|-------------|
| `CrudRepository` | Basic CRUD | Minimal data access |
| `PagingAndSortingRepository` | Pagination, sorting | Need paging |
| `JpaRepository` | Flush, batch delete, `getById()` | **Most Spring Boot apps (our choice)** |

We use `JpaRepository` because it's the most feature-rich and is the standard for Spring Boot + JPA projects.

---

## 3. Derived Query Methods

### ❓ Q: How does `findByEmail(String email)` work without writing SQL?

**Answer:**  
Spring Data parses the method name and generates a JPQL query:

```java
Optional<User> findByEmail(String email);
// Generates: SELECT u FROM User u WHERE u.email = ?1

boolean existsByEmail(String email);
// Generates: SELECT COUNT(u) > 0 FROM User u WHERE u.email = ?1
```

**The naming convention:**

```
findBy + FieldName + Condition
```

**Common derived query keywords:**

| Keyword | Method Name | Generated JPQL |
|---------|------------|----------------|
| Equality | `findByEmail(String)` | `WHERE email = ?1` |
| And | `findByNameAndEmail(String, String)` | `WHERE name = ?1 AND email = ?2` |
| Or | `findByNameOrEmail(String, String)` | `WHERE name = ?1 OR email = ?2` |
| Between | `findByScoreBetween(Double, Double)` | `WHERE score BETWEEN ?1 AND ?2` |
| LessThan | `findByScoreLessThan(Double)` | `WHERE score < ?1` |
| Like | `findByNameLike(String)` | `WHERE name LIKE ?1` |
| Containing | `findByNameContaining(String)` | `WHERE name LIKE %?1%` |
| OrderBy | `findByRoleOrderByNameAsc(Role)` | `WHERE role = ?1 ORDER BY name ASC` |
| Top/First | `findTop5ByRoleOrderByCreatedAtDesc(Role)` | `WHERE role = ?1 ORDER BY createdAt DESC LIMIT 5` |
| Count | `countByRole(Role)` | `SELECT COUNT(u) FROM User u WHERE role = ?1` |
| Exists | `existsByEmail(String)` | `SELECT COUNT(u) > 0 FROM User u WHERE email = ?1` |
| Delete | `deleteByEmail(String)` | `DELETE FROM User u WHERE email = ?1` |

---

### ❓ Q: Why use `existsByEmail()` instead of `findByEmail().isPresent()`?

**Answer:**

```java
// ❌ Less efficient — loads the entire User entity from DB
boolean exists = userRepository.findByEmail(email).isPresent();
// SQL: SELECT * FROM users WHERE email = ?

// ✅ More efficient — just checks existence, no entity hydration
boolean exists = userRepository.existsByEmail(email);
// SQL: SELECT COUNT(*) > 0 FROM users WHERE email = ?  (or SELECT 1 ... LIMIT 1)
```

`existsByEmail()` is faster because it doesn't load any entity data — it just checks if a row exists. In our `AuthServiceImpl`, we use it for the email uniqueness check where we don't need the User object.

---

## 4. Custom Queries with @Query

### ❓ Q: When would you use `@Query` instead of derived query methods?

**Answer:**  
When the method name becomes too long or you need features like JOIN FETCH:

```java
// Derived method — readable for simple queries
Optional<User> findByEmail(String email);

// @Query — needed for complex queries
@Query("SELECT u FROM User u JOIN FETCH u.resumes WHERE u.id = :userId")
Optional<User> findByIdWithResumes(@Param("userId") Long userId);

// Native SQL (when JPQL isn't enough)
@Query(value = "SELECT * FROM users WHERE email = ?1", nativeQuery = true)
Optional<User> findByEmailNative(String email);
```

| Approach | When to use |
|---------|-------------|
| Derived method | Simple queries (1-2 conditions) |
| `@Query` (JPQL) | Complex joins, aggregations, subqueries |
| `@Query` (native) | DB-specific features, performance-critical |

---

### ❓ Q: What is the difference between JPQL and native SQL?

**Answer:**

| Feature | JPQL | Native SQL |
|---------|------|-----------|
| Operates on | **Entity classes & fields** | **Tables & columns** |
| Syntax | `SELECT u FROM User u` | `SELECT * FROM users` |
| Database portable | ✅ Yes | ❌ DB-specific |
| Lazy associations | ✅ Respects fetch types | ⚠️ Manual handling |
| Example | `u.email` (Java field name) | `email` (column name) |

---

## 5. Return Types

### ❓ Q: What return types can Spring Data repository methods have?

**Answer:**

```java
// Single entity — returns null if not found (avoid this)
User findByEmail(String email);

// Optional — recommended for single results
Optional<User> findByEmail(String email);

// List — for multiple results
List<User> findByRole(Role role);

// Page — for paginated results with total count
Page<User> findByRole(Role role, Pageable pageable);

// Slice — like Page but without total count (better performance)
Slice<User> findByRole(Role role, Pageable pageable);

// Stream — for large result sets (must be in @Transactional)
@Query("SELECT u FROM User u")
Stream<User> streamAll();

// Long — for count queries
long countByRole(Role role);

// boolean — for existence checks
boolean existsByEmail(String email);

// void — for delete operations
void deleteByEmail(String email);
```

> **In our project**, we use `Optional<User>` for `findByEmail()` and `boolean` for `existsByEmail()`.

---

## 6. Pagination & Sorting

### ❓ Q: How does pagination work in Spring Data JPA?

**Answer:**

```java
// In Repository — just add Pageable parameter
Page<User> findByRole(Role role, Pageable pageable);

// In Service — create a PageRequest
Pageable pageable = PageRequest.of(
    0,                          // page number (0-indexed)
    10,                         // page size
    Sort.by("createdAt").descending()  // sorting
);
Page<User> page = userRepository.findByRole(Role.USER, pageable);

// Page object contains:
page.getContent();        // List<User> — the data
page.getTotalElements();  // Total rows across all pages
page.getTotalPages();     // Total number of pages
page.getNumber();         // Current page number
page.getSize();           // Page size
page.hasNext();           // Is there a next page?
```

**Controller usage:**
```java
@GetMapping("/users")
public Page<User> getUsers(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size,
    @RequestParam(defaultValue = "createdAt") String sortBy) {

    return userRepository.findAll(PageRequest.of(page, size, Sort.by(sortBy).descending()));
}
```

---

### ❓ Q: What is the difference between `Page` and `Slice`?

**Answer:**

| Feature | `Page<T>` | `Slice<T>` |
|---------|----------|-----------|
| Total element count | ✅ Yes (runs `COUNT(*)` query) | ❌ No |
| Total pages | ✅ Yes | ❌ No |
| Has next page? | ✅ Yes | ✅ Yes (fetches N+1 rows to check) |
| Performance | Slower (extra COUNT query) | Faster |
| Use case | UI with page numbers | Infinite scroll / "Load more" |

---

## 7. @Repository Annotation

### ❓ Q: Is `@Repository` necessary on a Spring Data JPA interface?

**Answer:**  
**No, it's optional.** Spring Data automatically detects interfaces extending `JpaRepository` and creates beans for them. We add `@Repository` for:

1. **Readability** — makes it clear this is a data access component
2. **Exception translation** — Spring wraps JDBC/JPA exceptions into Spring's `DataAccessException` hierarchy

However, Spring Data already provides exception translation, so `@Repository` is purely a **convention** here.

---

### ❓ Q: What is Spring's exception translation?

**Answer:**  
`@Repository` activates a `PersistenceExceptionTranslationPostProcessor` that converts database-specific exceptions into Spring's `DataAccessException` hierarchy:

```
SQLException (JDBC)                    → DataAccessException (Spring)
PersistenceException (JPA)             → DataAccessException (Spring)
ConstraintViolationException (Hibernate) → DataIntegrityViolationException (Spring)
```

This lets your service layer catch `DataIntegrityViolationException` instead of vendor-specific exceptions.

---

## 8. Common Follow-Up Questions

---

**Q: What is the difference between `save()` and `saveAndFlush()`?**  
`save()` puts the entity in the persistence context and may defer the SQL until transaction commit. `saveAndFlush()` immediately executes the SQL statement. Use `saveAndFlush()` when you need the auto-generated ID immediately or when you need the DB state to be visible to other queries in the same transaction.

---

**Q: What is the difference between `findById()` and `getReferenceById()`?**  

| Method | DB hit | Returns | Not found |
|--------|--------|---------|-----------|
| `findById(id)` | ✅ Immediately | `Optional<User>` (real entity) | `Optional.empty()` |
| `getReferenceById(id)` | ❌ Returns proxy | Lazy proxy object | `EntityNotFoundException` on property access |

Use `getReferenceById()` when you only need the entity as a **reference** (e.g., setting a foreign key) without loading all its data.

---

**Q: How do you handle transactions in the repository layer?**  
You don't — transactions are managed in the **service layer** with `@Transactional`. Each repository method runs within the transaction opened by the calling service method.

---

**Q: What is the `@Modifying` annotation?**  
Required for `@Query` methods that modify data (UPDATE, DELETE):

```java
@Modifying
@Query("UPDATE User u SET u.role = :role WHERE u.id = :id")
int updateUserRole(@Param("id") Long id, @Param("role") Role role);
// Returns the number of affected rows
```

Without `@Modifying`, Spring assumes the query is a SELECT and throws an exception.

---

**Q: Can you have a repository without an entity?**  
No. Every Spring Data JPA repository must be parameterized with a `@Entity` class. If you need raw SQL without an entity, use `JdbcTemplate` instead.

---

*Last updated: July 2026*
