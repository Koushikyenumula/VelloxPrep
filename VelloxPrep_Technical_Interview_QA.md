# VelloxPrep: Technical Round Q&A

**Candidate:** Koushik Yenumula
**Project:** VelloxPrep (AI-Powered Interview Preparation Platform)
**Role Evaluated For:** Full-Stack Developer / Backend Engineer

---

## Section 1: Architecture & System Design

**Q1: Walk me through the high-level architecture of VelloxPrep. How do the frontend and backend communicate?**
**Answer:** 
VelloxPrep uses a decoupled client-server architecture. 
- The **frontend** is built using Vanilla JavaScript, HTML5, and CSS3, running completely independent of the backend. 
- The **backend** is a RESTful API built with Java 21 and Spring Boot 3. 
- Communication happens via standard HTTP requests using the native `fetch` API. Data is exchanged exclusively in JSON format. The backend is structured using an N-Tier architecture (Controller, Service, Repository, Entity) to separate routing, business logic, and database operations.

**Q2: I see you chose not to use a frontend framework like React or Angular. Why?**
**Answer:**
For this specific project, I wanted to deeply understand DOM manipulation, browser APIs, and state management without the heavy abstraction of a framework. It allowed me to keep the application bundle incredibly small and performant. I built my own lightweight component injector and wrote a custom `fetch` interceptor for authentication, which taught me the underlying mechanics that tools like Axios and React Router handle under the hood.

**Q3: How did you design the database schema? What database are you using?**
**Answer:**
I am using **MySQL** managed by **Spring Data JPA/Hibernate**. The core of the schema is the `User` entity. The `User` has a one-to-many relationship with `Resumes` and `InterviewSessions`. Furthermore, an `InterviewSession` has a one-to-many relationship with `InterviewQuestions` and `AnswerEvaluations`. I utilized `CascadeType.ALL` and `orphanRemoval = true` to ensure referential integrity—so if a user deletes their account, all their corresponding data is cleanly wiped from the database.

---

## Section 2: Security & Authentication

**Q4: How are you handling user authentication and authorization?**
**Answer:**
I implemented a stateless authentication system using **JSON Web Tokens (JWT)** via Spring Security. 
1. When a user logs in, the server verifies their BCrypt-hashed password.
2. The server generates a signed JWT and returns it to the client.
3. The frontend stores this token in `localStorage`.
4. My custom JS interceptor attaches this token as an `Authorization: Bearer <token>` header to all subsequent API requests.
5. On the backend, a `JwtAuthenticationFilter` intercepts the request, validates the cryptographic signature of the token, and populates the `SecurityContext`.

**Q5: What are the advantages of JWT over traditional Session-based authentication?**
**Answer:**
The biggest advantage is scalability. In traditional session-based auth, the server has to store session IDs in memory or a database for every logged-in user. With JWT, the server is completely stateless; it only needs to verify the signature mathematically. This makes it much easier to horizontally scale the backend across multiple servers without worrying about sticky sessions.

---

## Section 3: Core Features & Implementations

**Q6: One of the core features is Resume Parsing. How exactly did you implement that?**
**Answer:**
When a user uploads a PDF resume, the file is received as a `MultipartFile` in the Spring Boot controller. I pass this file to **Apache PDFBox**, a Java library for manipulating PDF documents. I use the `PDFTextStripper` class to extract the raw text from the document. I then sanitize this text and store it in the database. Later, when the user requests a resume-based interview, I inject that raw text into the prompt sent to the Generative AI model, giving the AI full context of the user's career.

**Q7: How did you implement the Mock Coding Test environment on the frontend?**
**Answer:**
I integrated the **Monaco Editor** (which is the core engine behind VS Code) via a CDN. I configured it to support multiple languages like Java, Python, and C++ with full syntax highlighting. When the user writes code and clicks 'Run', I use the Monaco API `editor.getValue()` to extract the raw string, package it into a JSON DTO, and send it to the backend for execution and evaluation. I also implemented an anti-cheat mechanism using the Fullscreen API to detect if the user exits the test window.

---

## Section 4: Problem Solving & Debugging

**Q8: What was the most challenging bug you faced during development, and how did you solve it?**
**Answer:**
One significant issue was the **ephemeral file system** on my deployment platform (Render). I built the profile picture upload feature by saving the images locally to the backend server's disk (in an `uploads/avatars` folder). However, every time Render restarted or redeployed the server, the disk was wiped clean, causing all profile images to break (404 errors). I realized that local storage is not viable in containerized cloud environments. The proper architectural fix is to decouple file storage using an object storage service like **AWS S3** or **Cloudinary**, saving only the public URL in the MySQL database.

**Q9: What is the N+1 Query Problem, and did you encounter it?**
**Answer:**
The N+1 problem occurs in ORMs like Hibernate when the system executes one query to retrieve a parent entity (like an `InterviewSession`), and then N additional queries to retrieve its children (like the `InterviewQuestions`). To avoid this performance bottleneck, I configured my relationships to use `FetchType.LAZY` and utilized the `@BatchSize` annotation on my collections. This forces Hibernate to fetch children in batches using an `IN` clause, significantly reducing the number of database trips.

---

## Section 5: Future Improvements

**Q10: If you were hired today to continue working on VelloxPrep, what architectural improvements would you make in the next 3 months?**
**Answer:**
1. **Caching Layer:** I would introduce **Redis** to cache frequently accessed data, like the user's dashboard statistics, to reduce the load on the MySQL database.
2. **Real-time AI Streaming:** Currently, the user waits for the entire HTTP request to finish before seeing the AI feedback. I would implement **Server-Sent Events (SSE)** or **WebSockets** to stream the AI response token-by-token, mimicking the UX of ChatGPT.
3. **Cloud Storage:** Implement AWS S3 integration for all PDF and Avatar uploads to fully decouple the backend from file storage.
