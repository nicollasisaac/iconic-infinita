/*
  Warnings:

  - You are about to drop the column `date` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Event` table. All the data in the column will be lost.
  - Added the required column `start_at` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "date",
DROP COLUMN "time",
ADD COLUMN     "end_at" TIMESTAMP(3),
ADD COLUMN     "start_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "EventCheckin" ALTER COLUMN "checkin_time" SET DEFAULT '1970-01-01 00:00:00+00'::timestamptz;
