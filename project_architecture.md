# VelloxPrep Full-Stack Project Architecture

This document provides a comprehensive overview of the **VelloxPrep Platform**, detailing both the **Frontend** and **Backend** architectures, their interactions, data flow, and underlying system design.

---

## 1. System Overview (The Full Stack)

VelloxPrep follows a **Client-Server Architecture** utilizing a decoupled Frontend (Vanilla JS + HTML/CSS) and Backend (Spring Boot + MySQL). 

### 🌐 The Frontend (Client-Side)
- **Tech Stack:** HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5.
- **Design System:** Glassmorphism UI, Dark/Light theme toggling, Dynamic Viewport Height for mobile responsiveness.
- **Role:** Handles all user interactions, UI rendering, local storage management (for JWTs and caching), and making asynchronous API calls to the backend via the native `Fetch API`.

### ⚙️ The Backend (Server-Side)
- **Tech Stack:** Java 21, Spring Boot 3, Spring Security (JWT), Spring Data JPA.
- **Role:** Exposes RESTful APIs, processes business logic (PDF parsing, AI integrations), enforces security, and manages data persistence.

### 🛢️ The Database
- **Tech Stack:** MySQL.
- **Role:** A relational database storing users, resumes, interview sessions, generated questions, and evaluations.

---

## 2. Frontend Architecture & Flows

Instead of a bulky framework like React or Angular, VelloxPrep uses a lightweight, multi-page application (MPA) architecture heavily optimized with modular JavaScript.

### Core Frontend Modules (`frontend/js/`)
1. **`api.js`**: A centralized HTTP client. Contains the base URL (`https://velloxprep.onrender.com/api`) and methods for every backend endpoint (e.g., `API.login()`, `API.generateInterview()`).
2. **`auth.js`**: Manages authentication state. 
   - Uses an **Interceptor Pattern** to override the native `window.fetch`. It automatically attaches the JWT `Authorization: Bearer <token>` to every outgoing request.
   - Handles route guarding (redirecting unauthenticated users to `/login`).
3. **`components.js`**: Dynamically injects reusable UI elements like the Sidebar, Topbar, and Toast notifications into the DOM, keeping HTML files clean.

### The UI Flow (Example: Taking a Coding Test)
1. User navigates to `coding-generate.html`.
2. User selects a topic (e.g., "Java") and clicks "Start Mock Test".
3. JS intercepts the form submission, shows a loader, and calls `API.generateCodingTest(topic)`.
4. Upon success, the session ID is saved to `sessionStorage`, and the user is routed to `coding-session.html`.
5. `coding-session.html` initializes the **Monaco Editor** (VS Code's core editor) and renders the AI-generated questions fetched from the backend.

---

## 3. Backend Architecture & Layers

The backend follows a strict **N-Tier Architecture**:

1. **Controllers (`@RestController`)**: The entry point for HTTP requests. Validates incoming DTOs and routes requests to the Service layer.
2. **Services (`@Service`)**: Where the heavy lifting happens. Evaluates answers, calculates scores, and communicates with AI models.
3. **Repositories (`@Repository`)**: Spring Data JPA interfaces that handle MySQL CRUD operations.
4. **Entities (`@Entity`)**: Java classes mapped directly to MySQL tables.

---

## 4. Database Schema & SQL Generation

Hibernate automatically maps the Java entities into relational tables. Here is the logical schema and the SQL queries happening under the hood:

### 1. User Management (`users` table)
- **Fields:** `id`, `email`, `password` (BCrypt), `role`, `profile_image_url`, `created_at`.
- **Under-the-hood SQL (Login):**
  ```sql
  SELECT id, name, email, password, role FROM users WHERE email = 'user@example.com' LIMIT 1;
  ```

### 2. Resume Parsing (`resumes` table)
- **Fields:** `id`, `user_id`, `file_path`, `parsed_text`, `uploaded_at`.
- **Flow:** When a user uploads a PDF, **Apache PDFBox** extracts the raw text. The text is saved in the database to serve as context for the AI.
  ```sql
  INSERT INTO resumes (user_id, file_path, parsed_text, uploaded_at) 
  VALUES (42, '/uploads/uuid.pdf', 'Experienced Java developer...', NOW());
  ```

### 3. Interview Sessions (`interview_sessions` table)
- **Fields:** `id`, `user_id`, `skill`, `difficulty`, `score`, `status`, `created_at`.
- **Under-the-hood SQL (Dashboard Stats Analytics):**
  ```sql
  SELECT 
      COUNT(id) AS total_interviews,
      AVG(score) AS average_score,
      MAX(score) AS highest_score
  FROM interview_sessions 
  WHERE user_id = 42 AND status = 'COMPLETED';
  ```

### 4. Questions & Evaluations (`interview_questions`, `answer_evaluations`)
- Represents a one-to-many relationship where one session has many questions, and each question has a user evaluation.
- **Under-the-hood SQL (Saving an Evaluation):**
  ```sql
  INSERT INTO answer_evaluations (interview_session_id, user_answer, ai_feedback, score) 
  VALUES (101, 'I would use a HashMap...', 'Good time complexity approach.', 85.5);
  ```

---

## 5. Security Architecture (Spring Security)

1. **Authentication:** 
   - Uses `DaoAuthenticationProvider` backed by BCrypt for password hashing.
   - Login endpoint (`/api/auth/login`) issues a signed JSON Web Token (JWT) valid for 24 hours.
2. **Authorization:** 
   - `JwtAuthenticationFilter` intercepts every incoming HTTP request.
   - It parses the token from the `Authorization` header, validates the signature, and populates the `SecurityContextHolder`.
   - Role-based endpoints (e.g., `/api/admin/**`) require the `ADMIN` role embedded in the JWT.
3. **CORS:**
   - Cross-Origin Resource Sharing is configured globally to accept requests from the frontend domain (Vercel/Localhost) and block unauthorized domains.
4. **Exception Handling:**
   - A `@ControllerAdvice` global handler catches errors (e.g., Invalid Passwords, Missing Resumes) and formats them into a predictable JSON `ApiResponse`, preventing server stack traces from leaking to the frontend.
