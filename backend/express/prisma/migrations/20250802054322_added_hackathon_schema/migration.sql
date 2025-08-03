-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'EXPERT');

-- CreateEnum
CREATE TYPE "Specialty" AS ENUM ('FULL_STACK', 'FRONTEND', 'BACKEND', 'MOBILE', 'DATA_SCIENCE', 'DESIGNER', 'PRODUCT_MANAGER', 'BUSINESS', 'OTHER');

-- CreateEnum
CREATE TYPE "Interest" AS ENUM ('AR_VR', 'BEGINNER_FRIENDLY', 'BLOCKCHAIN', 'COMMUNICATION', 'CYBERSECURITY', 'DATABASES', 'DESIGN', 'DEVOPS', 'ECOMMERCE', 'EDUCATION', 'ENTERPRISE', 'FINTECH', 'GAMING', 'HEALTH', 'IOT', 'LIFEHACKS', 'NO_CODE', 'MACHINE_LEARNING', 'MOBILE', 'MUSIC_ART', 'OPEN_ENDED', 'PRODUCTIVITY', 'QUANTUM', 'RPA', 'SERVERLESS', 'SOCIAL_GOOD', 'VOICE_SKILLS', 'WEB');

-- CreateEnum
CREATE TYPE "Occupation" AS ENUM ('STUDENT', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "StudentLevel" AS ENUM ('COLLEGE', 'HIGH_SCHOOL', 'MIDDLE_SCHOOL');

-- CreateEnum
CREATE TYPE "GraduationMonth" AS ENUM ('JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC');

-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HackathonStatus" AS ENUM ('UPCOMING', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'JUDGING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('MANUAL', 'AI');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profileImageUrl" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "githubUrl" VARCHAR(255),
    "linkedinUrl" VARCHAR(255),
    "twitterUrl" VARCHAR(255),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialty" "Specialty" NOT NULL,
    "skills" TEXT[],
    "bio" TEXT,
    "interests" "Interest"[],
    "location" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "occupation" "Occupation" NOT NULL,
    "studentLevel" "StudentLevel" NOT NULL,
    "schoolName" TEXT NOT NULL,
    "graduationMonth" "GraduationMonth" NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "birthMonth" INTEGER NOT NULL,
    "birthYear" INTEGER NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "description" TEXT,
    "emailDomain" TEXT DEFAULT '',
    "phoneNumber" TEXT NOT NULL,
    "isInternalOnly" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialty" "Specialty" NOT NULL,
    "bio" TEXT,
    "skills" TEXT[],
    "interests" "Interest"[],
    "companyId" TEXT,
    "isApprovedInCompany" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyJoinRequest" (
    "id" TEXT NOT NULL,
    "expertProfileId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hackathon" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rules" TEXT,
    "bannerImageUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "registrationEndDate" TIMESTAMP(3) NOT NULL,
    "submissionEndDate" TIMESTAMP(3) NOT NULL,
    "status" "HackathonStatus" NOT NULL DEFAULT 'UPCOMING',
    "reviewType" "ReviewType" NOT NULL DEFAULT 'MANUAL',
    "createdByUserId" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hackathon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HackathonRegistration" (
    "id" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HackathonRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSubmission" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "submissionUrl" TEXT,
    "submissionText" TEXT,
    "score" INTEGER,
    "manualReviewScore" INTEGER,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertProfile_userId_key" ON "ExpertProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Hackathon_title_key" ON "Hackathon"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Hackathon_slug_key" ON "Hackathon"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HackathonRegistration_hackathonId_userId_key" ON "HackathonRegistration"("hackathonId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSubmission_registrationId_key" ON "ProjectSubmission"("registrationId");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertProfile" ADD CONSTRAINT "ExpertProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertProfile" ADD CONSTRAINT "ExpertProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyJoinRequest" ADD CONSTRAINT "CompanyJoinRequest_expertProfileId_fkey" FOREIGN KEY ("expertProfileId") REFERENCES "ExpertProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyJoinRequest" ADD CONSTRAINT "CompanyJoinRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hackathon" ADD CONSTRAINT "Hackathon_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hackathon" ADD CONSTRAINT "Hackathon_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackathonRegistration" ADD CONSTRAINT "HackathonRegistration_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackathonRegistration" ADD CONSTRAINT "HackathonRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "HackathonRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
