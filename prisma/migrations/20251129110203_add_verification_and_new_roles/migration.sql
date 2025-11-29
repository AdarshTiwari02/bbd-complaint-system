-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoleName" ADD VALUE 'FACULTY';
ALTER TYPE "RoleName" ADD VALUE 'CLASS_COORDINATOR';
ALTER TYPE "RoleName" ADD VALUE 'PROCTOR';
ALTER TYPE "RoleName" ADD VALUE 'DEAN';
ALTER TYPE "RoleName" ADD VALUE 'DIRECTOR_FINANCE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoutingLevel" ADD VALUE 'CLASS_COORDINATOR';
ALTER TYPE "RoutingLevel" ADD VALUE 'DEAN';
ALTER TYPE "RoutingLevel" ADD VALUE 'DIRECTOR_FINANCE';
ALTER TYPE "RoutingLevel" ADD VALUE 'SYSTEM_ADMIN';

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "canCreateRoles" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canVerify" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "verifiedBy" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verificationNote" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- CreateIndex
CREATE INDEX "users_isVerified_idx" ON "users"("isVerified");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
