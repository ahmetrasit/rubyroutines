-- AlterTable
ALTER TABLE "persons" ADD COLUMN     "isAccountOwner" BOOLEAN NOT NULL DEFAULT false;

-- Mark existing "Me" persons as account owners
UPDATE "persons" SET "isAccountOwner" = true WHERE "name" = 'Me';
