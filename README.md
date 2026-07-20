# VelloxPrep Platform

<div align="center">
  <p><strong>Production-ready AI-powered interview preparation, resume analysis, and career intelligence platform.</strong></p>
</div>

---

## 🚀 Overview
**VelloxPrep** is a comprehensive full-stack application designed to help job seekers prepare for interviews through AI-generated mock tests, resume-based questions, and coding assessments. It provides a sleek, modern, glassmorphism-inspired UI and a robust, scalable Spring Boot backend.

## ✨ Key Features

### 1. 🤖 AI-Powered Interview Generation
- **Standard Interviews:** Generate MCQs or subjective questions based on specific topics (Java, React, DSA, Spring Boot, etc.) and difficulty levels.
- **Resume-Based Interviews:** Upload a resume (PDF) and let the AI generate tailored questions based on your specific experience and skills.

### 2. 💻 Mock Coding Tests
- **Full-Screen Anti-Cheat System:** Enforces a distraction-free coding environment with warnings for exiting full-screen mode.
- **Integrated IDE:** Features an embedded code editor (Monaco Editor) with syntax highlighting for Java, Python, JavaScript, and C++.
- **Custom Test Cases:** Run code against hidden test cases or provide custom standard input for debugging.

### 3. 📄 Resume Management & Parsing
- Upload PDF resumes.
- Automated resume parsing using **Apache PDFBox** to extract career intelligence and text data.
- Track multiple resumes and tailor mock interviews to specific versions of your resume.

### 4. 📊 Performance Dashboard
- **Real-Time Analytics:** Track your accuracy, average score, and number of interviews completed.
- **Activity History:** View past interview sessions, coding test results, and performance breakdowns in a premium glass-panel table.

### 5. 🔐 Security & User Management
- **Stateless JWT Authentication:** Secure login and registration using Spring Security.
- **Role-Based Access Control:** Separate flows and permissions for `USER` and `ADMIN` roles.
- **Profile Customization:** Upload and update profile avatars with a dynamic UI theme switcher (Light/Dark mode).

---

## 🛠️ Tech Stack

### **Backend**
| Technology        | Version / Details        |
|-------------------|--------------------------|
| **Java**          | 21                       |
| **Framework**     | Spring Boot 3.4.3        |
| **Security**      | Spring Security + JWT    |
| **Database**      | MySQL & Spring Data JPA  |
| **PDF Parsing**   | Apache PDFBox            |
| **Build Tool**    | Maven                    |
| **API Docs**      | Swagger / OpenAPI 3      |

### **Frontend**
| Technology        | Details                                      |
|-------------------|----------------------------------------------|
| **Core**          | HTML5, CSS3, Vanilla JavaScript (ES6)        |
| **Styling**       | Bootstrap 5, Custom Glassmorphism CSS        |
| **Editor**        | Monaco Editor (VS Code core)                 |
| **Icons**         | Bootstrap Icons                              |
| **Responsiveness**| Dynamic Viewport Height (dvh), Media Queries |

---

## 📂 Project Structure

```
VelloxPrep/
├── frontend/                  # Vanilla JS Frontend Application
│   ├── css/                   # Stylesheets (dashboard, login, sidebar, etc.)
│   ├── js/                    # Core Logic (api, auth, coding-session, etc.)
│   └── pages/                 # HTML Views (dashboard, mock-tests, profile)
│
├── src/main/java/com/koushik/aiinterview/
│   ├── config/                # Security, CORS, Swagger Config
│   ├── controller/            # REST API Endpoints
│   ├── dto/                   # Request/Response Data Transfer Objects
│   ├── entity/                # JPA Database Entities
│   ├── exception/             # Global Exception Handlers
│   ├── repository/            # Spring Data JPA Interfaces
│   ├── security/              # JWT Filters, Providers
│   ├── service/               # Business Logic Interfaces & Implementations
│   └── util/                  # Helper Utilities
│
├── uploads/avatars/           # Local storage directory for profile images
└── pom.xml                    # Maven Dependencies
```

---

## ⚙️ Quick Start Guide

### Prerequisites
- **Java 21** installed.
- **MySQL** installed and running.
- **Maven** installed (or use the provided `./mvnw` wrapper).

### 1. Database Setup
Create a MySQL database named `ai_interview_db`. Hibernate will automatically create the tables for you upon startup.
```sql
CREATE DATABASE ai_interview_db;
```

### 2. Backend Configuration
Clone the repository and update your database credentials in `src/main/resources/application.yml` (or set the appropriate environment variables).

### 3. Run the Backend
```bash
./mvnw spring-boot:run
```
The server will start on `http://localhost:8080`.

### 4. Run the Frontend
You can serve the `frontend/` folder using any static file server, such as the VS Code Live Server extension, or simple Python server:
```bash
cd frontend
python -m http.server 5500
```
Then open `http://localhost:5500/pages/login.html` in your browser.

---

## 📖 API Documentation
Once the Spring Boot application is running, you can access the automatically generated Swagger UI documentation to interact with the API endpoints directly:

**Swagger URL:** `http://localhost:8080/api/swagger-ui.html`

---

## 🤝 Contribution & License
Designed and developed by Koushik Yenumula.
Licensed under the **MIT License**.
