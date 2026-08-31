-- CreateEnum
CREATE TYPE "JobStatusChangeType" AS ENUM ('ADVANCE', 'CORRECTION', 'UNDO');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "previousJobStatus" "JobStatus";

-- CreateTable
CREATE TABLE "JobStatusHistory" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "fromStatus" "JobStatus" NOT NULL,
    "toStatus" "JobStatus" NOT NULL,
    "changeType" "JobStatusChangeType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobStatusHistory_jobId_createdAt_idx" ON "JobStatusHistory"("jobId", "createdAt");

-- AddForeignKey
ALTER TABLE "JobStatusHistory" ADD CONSTRAINT "JobStatusHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
