# Sushruta Healthcare — Full-Stack Healthcare Management Platform

> A secure full-stack healthcare management platform for managing patient records, doctor records, patient-doctor assignments, authentication, and healthcare workflows through a Django REST API and a modern React frontend.

[![Python](https://img.shields.io/badge/Python-Django-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-REST%20Framework-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://django-rest-framework-simplejwt.readthedocs.io/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=111827)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Render](https://img.shields.io/badge/Backend-Render-111827?logo=render&logoColor=white)](https://render.com/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

Sushruta Healthcare is designed around a simple healthcare-management workflow:

**Authentication → Patient Registration → Doctor Directory → Patient Management → Doctor Assignment → Mapping Management**

The platform provides a secure REST API for healthcare operations together with a responsive React dashboard for interacting with those services.

---

## Table of Contents

- [Overview](#overview)
- [Core Capabilities](#core-capabilities)
- [Authentication & Identity](#authentication--identity)
- [Patient Management](#patient-management)
- [Doctor Management](#doctor-management)
- [Patient-Doctor Mapping](#patient-doctor-mapping)
- [Security Model](#security-model)
- [System Architecture](#system-architecture)
- [API Architecture](#api-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Local Development](#local-development)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Current Status](#current-status)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Project Philosophy](#project-philosophy)

---

# Overview

Sushruta Healthcare is a full-stack healthcare management application built with:

- Django
- Django REST Framework
- PostgreSQL
- JWT authentication
- React
- Vite

The backend exposes authenticated REST APIs for managing patients, doctors, and their relationships.

The frontend provides a healthcare-focused dashboard for:

- User authentication
- Patient registration and management
- Doctor directory management
- Patient-doctor assignment
- Mapping management
- Dashboard statistics
- Session-aware API access

The application is designed with an API-first architecture so that the backend can be consumed independently by other clients such as mobile applications, administrative tools, or external integrations.

---

# Core Capabilities

## 1. Secure User Authentication

The platform provides application-level authentication using JWT.

Implemented capabilities include:

- User registration
- User login
- JWT access/refresh token generation
- Protected API endpoints
- Authenticated frontend sessions
- Logout/session clearing
- Authentication rejection handling
- Automatic return to the login interface when a session becomes invalid

Passwords are handled through Django's authentication system rather than being stored as plaintext.

---

## 2. Patient Management

Authenticated users can manage patient records through the REST API and frontend dashboard.

Patient workflows include:

- Create patient
- List patients
- View an individual patient
- Update patient information
- Delete patient records
- View patient information from the dashboard

Patient records are associated with the authenticated user who created them.

The API enforces ownership rules so that one authenticated user cannot arbitrarily modify another user's patient records.

---

## 3. Doctor Management

The doctor directory provides CRUD functionality for healthcare professionals.

Implemented capabilities include:

- Create doctor
- List doctors
- View doctor details
- Update doctor details
- Delete doctor records
- Doctor department/specialty information
- Frontend doctor directory management

Doctor records are maintained independently so that they can be associated with multiple patient relationships.

---

## 4. Patient-Doctor Mapping

Sushruta Healthcare models patient-doctor relationships explicitly through a dedicated mapping layer.

This allows the platform to manage relationships such as:

```text
Patient
   │
   ├── Doctor
   ├── Doctor
   └── Doctor