# 🎯 DTO Layer — Interview Preparation Guide

> **Purpose:** This document covers DTO patterns, Bean Validation, Generics, and Jackson serialization concepts used in our request/response DTOs.

---

## 📋 Table of Contents

1. [What Are DTOs and Why Use Them](#1-what-are-dtos-and-why-use-them)
2. [Bean Validation Annotations](#2-bean-validation-annotations)
3. [How Validation Actually Works](#3-how-validation-actually-works)
4. [Generic API Response Wrapper](#4-generic-api-response-wrapper)
5. [Jackson Serialization](#5-jackson-serialization)
6. [`@Data` on DTOs vs Entities](#6-data-on-dtos-vs-entities)
7. [DTO Sub-Packaging (request/response)](#7-dto-sub-packaging-requestresponse)
8. [Common Follow-Up Questions](#8-common-follow-up-questions)

---

## 1. What Are DTOs and Why Use Them

### ❓ Q: What is a DTO? Why not use the entity directly in the API?

**Answer:**  
A **DTO (Data Transfer Object)** is a plain Java object that carries data between layers. We never expose entities directly because:

| Problem with exposing entities | How DTOs solve it |
|-------------------------------|-------------------|
| **Security risk** — exposes `password`, internal IDs | DTO only includes fields the client needs |
| **Tight coupling** — API changes break the DB schema | DTO decouples API contract from DB schema |
| **Over-fetching** — entity has lazy collections that trigger N+1 | DTO has only flat, serializable fields |
| **Circular references** — `User → Resume → User` causes infinite JSON | DTO has no bidirectional relationships |
| **Validation mixing** — entity validation ≠ API validation | DTO has API-specific validation rules |

**From our code:**
```java
// ❌ BAD — exposing entity
@PostMapping("/register")
public User register(@RequestBody User user) { ... }
// Exposes password in response! Sends ID, createdAt in request!

// ✅ GOOD — using DTO
@PostMapping("/register")
public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) { ... }
// Only name, email, password come in. Only message goes out.
```

---

### ❓ Q: What is the difference between a DTO and an Entity?

**Answer:**

| Aspect | Entity | DTO |
|--------|--------|-----|
| Purpose | Maps to a database table | Transfers data between layers |
| Annotations | `@Entity`, `@Table`, `@Column` | `@NotBlank`, `@Email`, `@Size` |
| Relationships | Has `@OneToMany`, `@ManyToOne` | Flat — no relationships |
| Lifecycle | Managed by JPA persistence context | Simple POJO, no JPA management |
| Lombok | `@Getter`/`@Setter` (NOT `@Data`) | `@Data` is fine here |
| Used in | Repository ↔ Service | Controller ↔ Client |

---

## 2. Bean Validation Annotations

### ❓ Q: Explain the validation annotations on your RegisterRequest.

**Answer:**

```java
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;
}
```

| Annotation | What it validates | `null` | `""` | `"   "` |
|-----------|------------------|--------|------|---------|
| `@NotNull` | Not null | ❌ Fail | ✅ Pass | ✅ Pass |
| `@NotEmpty` | Not null AND not empty | ❌ Fail | ❌ Fail | ✅ Pass |
| `@NotBlank` | Not null, not empty, not only whitespace | ❌ Fail | ❌ Fail | ❌ Fail |
| `@Email` | Valid email format | ✅ Pass (null ok) | ✅ Pass | ❌ Fail |
| `@Size(min, max)` | String length within range | ✅ Pass (null ok) | Depends on min | Depends on min |

> **Key interview point:** `@NotBlank` is the strictest for Strings — it rejects null, empty, and whitespace-only. That's why we pair `@NotBlank` + `@Email` on the email field — `@NotBlank` rejects blanks (which `@Email` would let through as null), and `@Email` validates the format.

---

### ❓ Q: What is the difference between `@NotNull`, `@NotEmpty`, and `@NotBlank`?

**Answer:**

```java
// @NotNull — only rejects null
null       → ❌ FAIL
""         → ✅ PASS  (empty string is not null)
"   "      → ✅ PASS  (whitespace is not null)
"Koushik"  → ✅ PASS

// @NotEmpty — rejects null AND empty
null       → ❌ FAIL
""         → ❌ FAIL  (empty)
"   "      → ✅ PASS  (has characters — spaces)
"Koushik"  → ✅ PASS

// @NotBlank — rejects null, empty, AND whitespace-only
null       → ❌ FAIL
""         → ❌ FAIL
"   "      → ❌ FAIL  (only whitespace)
"Koushik"  → ✅ PASS
```

We use `@NotBlank` for all String fields in `RegisterRequest` because a name of `"   "` is meaningless.

---

### ❓ Q: Where do these validation annotations come from?

**Answer:**  
They come from the **Jakarta Bean Validation API** (`jakarta.validation.constraints`), which is part of the `spring-boot-starter-validation` dependency. The **implementation** is Hibernate Validator (not Hibernate ORM — different project, same company).

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

---

### ❓ Q: How do you create a custom validation annotation?

**Answer:**  
Three steps:

```java
// 1. Define the annotation
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = StrongPasswordValidator.class)
public @interface StrongPassword {
    String message() default "Password must contain uppercase, lowercase, digit, and special character";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 2. Implement the validator
public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {
    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) return false;
        return password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$");
    }
}

// 3. Use it
@StrongPassword
private String password;
```

---

## 3. How Validation Actually Works

### ❓ Q: How does `@Valid` trigger validation? What happens behind the scenes?

**Answer:**  
The flow when a request hits `POST /api/auth/register`:

```
HTTP Request (JSON body)
    │
    ▼
Spring's HttpMessageConverter (Jackson) deserializes JSON → RegisterRequest object
    │
    ▼
@Valid triggers the MethodValidationInterceptor
    │
    ▼
Hibernate Validator checks all constraint annotations
    │
    ├── ✅ All valid → proceed to controller method
    │
    └── ❌ Validation fails → throws MethodArgumentNotValidException
                                  │
                                  ▼
                        GlobalExceptionHandler catches it
                        Returns 400 BAD_REQUEST with field errors
```

**From our controller:**
```java
@PostMapping("/register")
public ResponseEntity<ApiResponse<Void>> register(
        @Valid @RequestBody RegisterRequest request) {  // @Valid = "validate this object"
    ...
}
```

Without `@Valid`, the annotations on `RegisterRequest` do **nothing** — they are just metadata.

---

### ❓ Q: What is the difference between `@Valid` and `@Validated`?

**Answer:**

| Feature | `@Valid` (Jakarta) | `@Validated` (Spring) |
|---------|-------------------|----------------------|
| Source | `jakarta.validation` | `org.springframework.validation.annotation` |
| Group support | ❌ No | ✅ Yes — `@Validated(OnCreate.class)` |
| Method-level validation | ❌ No | ✅ Yes (validate path params, return values) |
| Nested validation | ✅ Cascades into nested objects | ✅ Same |

Use `@Validated` when you need **validation groups** (e.g., different rules for create vs update).

---

## 4. Generic API Response Wrapper

### ❓ Q: Why use a generic `ApiResponse<T>` wrapper?

**Answer:**  
It ensures **every endpoint** returns the same structure, making the API predictable for frontend developers.

```java
// Success: 201
{
    "status": 201,
    "message": "User registered successfully",
    "timestamp": "2026-07-12T21:30:00"
}

// Validation error: 400
{
    "status": 400,
    "message": "Validation failed",
    "data": {
        "email": "Please provide a valid email address",
        "password": "Password must be between 6 and 100 characters"
    },
    "timestamp": "2026-07-12T21:30:00"
}

// Conflict: 409
{
    "status": 409,
    "message": "User already exists with email: 'koushik@example.com'",
    "timestamp": "2026-07-12T21:30:00"
}
```

---

### ❓ Q: Explain the Java Generics in `ApiResponse<T>`.

**Answer:**

```java
public class ApiResponse<T> {
    private int status;
    private String message;
    private T data;         // T = any type
}
```

`T` is a **type parameter**. It lets one class hold different data types:

```java
ApiResponse<Void>                    // No data (registration success)
ApiResponse<UserDTO>                 // Single object
ApiResponse<List<InterviewSession>>  // List of objects
ApiResponse<Map<String, String>>     // Validation errors map
```

**Static factory methods use `<T>` syntax:**
```java
public static <T> ApiResponse<T> success(String message) {
    return ApiResponse.<T>builder()   // explicit type witness
            .status(200)
            .message(message)
            .build();
}
```

The `<T>` before the return type is a **method-level type parameter** — the method introduces its own generic type independent of the class-level `T`.

---

### ❓ Q: What are bounded type parameters? (`extends`, `super`)

**Answer:**

```java
// Upper bound — T must be Number or its subclass
public <T extends Number> double sum(List<T> numbers) { ... }
sum(List.of(1, 2, 3));      // ✅ Integer extends Number
sum(List.of("a", "b"));     // ❌ String doesn't extend Number

// Lower bound (wildcards only) — ? must be Integer or its superclass
public void addNumbers(List<? super Integer> list) {
    list.add(42);  // Safe — Integer or any supertype can hold Integer
}
```

| Keyword | Meaning | Use case |
|---------|---------|----------|
| `<T extends X>` | T must be X or subclass | Reading from a collection |
| `<? super X>` | Wildcard must be X or superclass | Writing to a collection |
| `<?>` | Unknown type | When you don't care about the type |

---

## 5. Jackson Serialization

### ❓ Q: What does `@JsonInclude(JsonInclude.Include.NON_NULL)` do?

**Answer:**

```java
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int status;      // always included (primitive)
    private String message;  // included only if not null
    private T data;          // included only if not null  ← this is the key benefit
}
```

For a registration response where `data` is null:
```json
// WITHOUT @JsonInclude(NON_NULL)
{ "status": 201, "message": "User registered successfully", "data": null, "timestamp": "..." }

// WITH @JsonInclude(NON_NULL) — cleaner!
{ "status": 201, "message": "User registered successfully", "timestamp": "..." }
```

---

### ❓ Q: What is the difference between `@JsonInclude` options?

**Answer:**

| Option | Excludes when... |
|--------|-----------------|
| `NON_NULL` | Field is `null` |
| `NON_EMPTY` | Null, empty strings, empty collections |
| `NON_ABSENT` | Null or `Optional.empty()` |
| `NON_DEFAULT` | Field equals its default value (0, false, null) |
| `ALWAYS` | Never excludes (default) |

---

### ❓ Q: Name some other commonly used Jackson annotations.

**Answer:**

| Annotation | Purpose | Example |
|-----------|---------|---------|
| `@JsonProperty("user_name")` | Custom JSON field name | Field `name` → JSON `user_name` |
| `@JsonIgnore` | Exclude field from JSON | Exclude `password` from response |
| `@JsonFormat(pattern = "dd-MM-yyyy")` | Custom date format | Format `LocalDate` |
| `@JsonManagedReference` / `@JsonBackReference` | Handle circular refs | Parent/child entity serialization |
| `@JsonCreator` + `@JsonProperty` | Custom deserialization constructor | Immutable DTOs |

---

## 6. `@Data` on DTOs vs Entities

### ❓ Q: You used `@Data` on DTOs but `@Getter/@Setter` on entities. Why the difference?

**Answer:**

| Concern | Entity | DTO |
|---------|--------|-----|
| `equals()`/`hashCode()` | ❌ Dangerous — mutable ID, lazy loading | ✅ Safe — simple value object |
| `toString()` | ❌ Can trigger lazy loading → exception | ✅ No lazy loading, just plain fields |
| Bidirectional references | ✅ Yes (`User ↔ Resume`) → infinite recursion | ❌ No relationships |
| JPA Persistence Context | Tracked by Hibernate | Not tracked |

**Bottom line:**
- **Entity →** `@Getter` + `@Setter` (avoid `@Data`)
- **DTO →** `@Data` is perfectly fine

---

## 7. DTO Sub-Packaging (request/response)

### ❓ Q: Why did you separate DTOs into `request/` and `response/` sub-packages?

**Answer:**

```
dto/
├── request/
│   └── RegisterRequest.java      // What the client sends
└── response/
    └── ApiResponse.java           // What the server returns
```

As the project grows, this prevents a flat package with 50+ DTOs. It also makes it immediately clear which direction the data flows:
- `request/` → client → server (incoming)
- `response/` → server → client (outgoing)

---

## 8. Common Follow-Up Questions

---

**Q: What happens if the client sends extra fields not in the DTO?**  
By default, Jackson **ignores** unknown fields (Spring Boot sets `spring.jackson.deserialization.fail-on-unknown-properties=false`). The extra fields are silently dropped.

---

**Q: What happens if the client omits a required field?**  
The field will be `null` in the DTO. If it has `@NotBlank`, validation will fail and `MethodArgumentNotValidException` is thrown, which our `GlobalExceptionHandler` catches and returns a 400 response with field-level errors.

---

**Q: What is `@RequestBody` doing?**  
It tells Spring to use an `HttpMessageConverter` (Jackson's `MappingJackson2HttpMessageConverter`) to deserialize the JSON request body into the Java DTO object.

Without `@RequestBody`, Spring would try to populate the object from query parameters or form data instead.

---

**Q: Can you validate request parameters and path variables too?**  
Yes, but you need `@Validated` on the **controller class**:

```java
@Validated  // enables method-level validation
@RestController
public class UserController {

    @GetMapping("/users/{id}")
    public User getUser(@PathVariable @Min(1) Long id) { ... }

    @GetMapping("/users")
    public List<User> search(@RequestParam @NotBlank String name) { ... }
}
```

---

**Q: What is the DTO mapping pattern? How do you convert Entity ↔ DTO?**  
Three approaches:

| Approach | Pros | Cons |
|---------|------|------|
| **Manual mapping** | Full control, simple | Boilerplate |
| **MapStruct** (our project) | Compile-time, type-safe, fast | Extra dependency |
| **ModelMapper** | Runtime, convention-based | Slower, harder to debug |

In our `AuthServiceImpl`, we map manually (DTO → Entity) since it's just 3 fields:
```java
User user = User.builder()
        .name(request.getName())
        .email(request.getEmail())
        .password(passwordEncoder.encode(request.getPassword()))
        .build();
```

For complex DTOs with many fields, we'd use **MapStruct** (already in our `pom.xml`).

---

*Last updated: July 2026*
