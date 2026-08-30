-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateTable
CREATE TABLE "Interview" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "round" "JobStatus" NOT NULL,
    "mode" "InterviewMode" NOT NULL,
    "scheduledAt" TIMESTAMPTZ(3) NOT NULL,
    "platform" TEXT,
    "meetingUrl" TEXT,
    "meetingId" TEXT,
    "meetingPassword" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Interview_jobId_idx" ON "Interview"("jobId");

-- CreateIndex
CREATE INDEX "Interview_scheduledAt_idx" ON "Interview"("scheduledAt");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
