# VelloxPrep Platform

> Production-ready Spring Boot 3 backend for AI-powered interview preparation, resume analysis, and career intelligence.

---

## Tech Stack

| Technology        | Version / Details        |
|-------------------|--------------------------|
| Java              | 21                       |
| Spring Boot       | 3.4.3                    |
| Spring Security   | JWT (stateless)          |
| Spring Data JPA   | Hibernate + MySQL        |
| Build Tool        | Maven                    |
| API Docs          | Swagger / OpenAPI 3      |
| Code Generation   | Lombok + MapStruct       |

## Quick Start

```bash
# 1. Clone the repo
git clone <repository-url>

# 2. Configure MySQL
#    Create a database named 'ai_interview_db' (or let Hibernate auto-create it)

# 3. Update credentials in application.yml (or use env vars)

# 4. Build & run
./mvnw spring-boot:run
```

## API Documentation

Once running, access Swagger UI at:

```
http://localhost:8080/api/swagger-ui.html
```

## Project Structure

```
com.koushik.aiinterview
├── controller       — REST API endpoints
├── service          — Business logic interfaces
│   └── impl         — Service implementations
├── repository       — Spring Data JPA repositories
├── entity           — JPA entity models
├── dto
│   ├── request      — Inbound request DTOs
│   └── response     — Outbound response DTOs
├── security         — JWT provider, filter, UserDetails
├── config           — Security, CORS, Swagger configuration
├── exception        — Custom exceptions & global handler
└── util             — Constants & helper utilities
```

## License

MIT
