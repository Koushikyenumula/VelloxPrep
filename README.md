# VelloxPrep 🚀
**AI-Powered Technical Interview & Resume Platform**

![VelloxPrep Demo](https://img.shields.io/badge/Status-Production%20Ready-success) ![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.3-6DB33F?logo=spring) ![Neon Postgres](https://img.shields.io/badge/Neon_Postgres-Serverless-00E599?logo=postgresql) ![Gemini AI](https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4?logo=google) ![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker)

VelloxPrep is a modern, enterprise-grade SaaS application designed to help software engineers prepare for technical interviews. By leveraging Google's Gemini AI, the platform acts as an interactive, intelligent technical recruiter—analyzing resumes, conducting mock technical rounds, and providing actionable, detailed feedback on coding challenges.

---

## 🌟 Key Features

* **Intelligent Resume Parsing:** Upload a resume (PDF/DOCX) and the AI automatically extracts technical skills, experience, and recommends targeted interview questions.
* **Mock Technical Interviews:** Real-time conversational interview sessions tailored to the candidate's specific tech stack and experience level.
* **Live Coding Challenges:** An integrated coding environment where users can write, execute, and receive AI-driven feedback on algorithms and system design.
* **World-Class UI/UX:** Built with a custom, ultra-lightweight glassmorphism design system ("Porcelain & Signal Blue" theme), completely responsive and highly performant.
* **Secure Architecture:** JWT-based stateless authentication, BCrypt password hashing, and role-based access control.

---

## 🏗️ Architecture & Tech Stack

VelloxPrep follows a classic decoupled client-server architecture with enterprise best practices.
👉 **[View the Interactive System Architecture & Schema](docs/architecture.html)**

### Backend (Core API)
* **Framework:** Java 21 + Spring Boot 3
* **Database:** Neon Serverless PostgreSQL
* **ORM:** Spring Data JPA + Hibernate
* **Security:** Spring Security + JSON Web Tokens (JWT)
* **AI Integration:** Google Gemini REST API (Flash 1.5)
* **Documentation:** OpenAPI / Swagger UI

### Frontend (Lightweight Client)
* **Core:** HTML5, Vanilla JavaScript, CSS3
* **Styling:** Custom Design Tokens + Bootstrap 5 grid
* **Performance:** DNS Prefetching, Lazy Loading, GZIP Server Compression

### DevOps & Infrastructure
* **Containerization:** Docker multi-stage builds
* **CI/CD:** GitHub Actions for automated Maven builds and tests
* **Hosting:** Render (Backend) + Static CDN (Frontend)

---

## ⚙️ Local Development Setup

Follow these steps to run VelloxPrep locally on your machine.

### Prerequisites
* Java 21+ installed
* Maven 3.9+ installed
* Docker & Docker Compose (optional, for local DB)
* A Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/Koushikyenumula/VelloxPrep.git
cd VelloxPrep
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or inject these into your IDE):
```env
DB_URL=jdbc:postgresql://<your-neon-db-url>
DB_USERNAME=<your-db-user>
DB_PASSWORD=<your-db-password>
GEMINI_API_KEY=<your-google-gemini-key>
JWT_SECRET=<generate-a-secure-256-bit-secret>
PORT=8080
```

### 3. Build & Run (Backend)
Using Maven:
```bash
mvn clean install
mvn spring-boot:run
```
*The API will start on `http://localhost:8080/api`*

### 4. Serve the Frontend
You can serve the `frontend/` directory using any static file server, for example:
```bash
# Using Python
cd frontend
python -m http.server 5500
```
*Access the UI at `http://localhost:5500/pages/login.html`*

---

## 🐳 Docker Deployment
To run the application using Docker:
```bash
docker build -t velloxprep-backend .
docker run -p 8080:8080 --env-file .env velloxprep-backend
```

---

## 📚 API Documentation
Once the Spring Boot application is running, you can access the interactive Swagger UI to explore and test the REST endpoints:
* **Swagger UI:** `http://localhost:8080/api/swagger-ui.html`
* **OpenAPI Spec:** `http://localhost:8080/api/v3/api-docs`

---

## 👨‍💻 Created By
**Koushik Yenumula**
* Full Stack Software Engineer
* Contact: [koushikyenumula41@gmail.com](mailto:koushikyenumula41@gmail.com)
