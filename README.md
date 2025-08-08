# Hackaholics: The AI-Powered Hackathon Platform

## Project Overview

Hackaholics is a modern, full-stack platform designed to streamline the entire hackathon experience for both organizers and participants. It provides a secure, role-based system where experts can create and manage events, while students can register, submit projects, and track their progress.

This platform demonstrates a robust, production-level architecture and a comprehensive feature set built to handle the complexities of a real-world hackathon.

## Key Features

### Core Functionality

  * **Hackathon Creation:** Experts can create detailed hackathons with titles, descriptions, rules, and crucial deadlines for registration and submissions.
  * **Dynamic UI:** The platform automatically updates hackathon status (e.g., `Registration Open`, `Judging`, `Completed`) based on real-time dates and deadlines.
  * **Deletion & Editing:** Experts have full control to edit hackathon details or delete events from a dedicated dashboard.

### User Authentication & Authorization

  * **Multi-Role System:** Secure authentication powered by Clerk, supporting distinct roles for `STUDENT` and `EXPERT`.
  * **Role-Based Access:** All sensitive actions (e.g., creating/editing a hackathon, viewing submissions) are protected by server-side middleware that verifies the user's role and permissions.
  * **User Profiles:** Users have personalized profiles where they can manage their information and track their activities.

### Expert Management Workflow

  * **Expert Dashboard:** A central hub for experts to view all their hosted hackathons at a glance, complete with real-time stats on registered participants and submitted projects.
  * **Analytics & Submissions:** A detailed analytics page for each hackathon, providing a combined table of all participants, their submission status, and direct links to their projects.
  * **Manual Review System:** Experts can review submitted projects by assigning a score (0-100) and providing detailed feedback, with a dedicated review page for each submission.

### Student Participation Workflow

  * **Seamless Registration:** Students can easily register for hackathons with a single click if the registration window is open.
  * **Project Submission:** Registered students can submit a project URL or text, and the platform tracks their submission status.
  * **Submission Status Tracking:** Students can view their submission status, review scores, and feedback on the hackathon detail page.

### Technology Stack

  * **Frontend:**
      * **Next.js:** The React framework for server-side rendering and static site generation.
      * **TypeScript:** For type safety and robust code.
      * **Tailwind CSS:** For a utility-first and responsive UI design.
      * **Clerk:** A comprehensive authentication solution for user management.
      * **Framer Motion:** For fluid and beautiful UI animations.
  * **Backend:**
      * **Express.js:** A fast, unopinionated Node.js framework for the REST API.
      * **Prisma:** A powerful ORM for database interaction.
      * **PostgreSQL:** The database solution, managed by Supabase.
  * **Infrastructure:**
      * **Vercel:** For seamless front-end deployment and continuous integration.
      * **Render:** For reliable back-end deployment.
      * **Supabase:** Provides the PostgreSQL database.
      * **Imagekit:** A global CDN and image optimization service for handling hackathon banner uploads.

### Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/hackaholics.git
    cd hackaholics
    ```

2.  **Set up environment variables:**

      * Create a `.env` file in the `backend/express` directory.
      * Create a `.env.local` file in the `frontend` directory.
      * Populate them with your credentials from Clerk, Supabase, and Imagekit.

3.  **Install dependencies and run migrations:**

    ```bash
    # In the backend/express directory
    npm install
    npx prisma migrate dev --name init-database

    # In the frontend directory
    npm install
    ```

4.  **Run the application:**

    ```bash
    # In the backend/express directory
    npm run dev

    # In the frontend directory
    npm run dev
    ```

### Planned Future Enhancements

  * **AI-Powered Review System:** Integrate a separate microservice (e.g., with Python/Django) to analyze project submissions and provide automated scores and feedback.
  * **Dynamic Certificate Generation:** Automatically generate professional, branded certificates for hackathon participants based on their review scores.
  * **Team Functionality:** Add the ability for students to form teams during registration.

-----
