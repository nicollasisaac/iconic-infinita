-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lon" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "EventCheckin" ALTER COLUMN "checkin_time" SET DEFAULT '1970-01-01 00:00:00+00'::timestamptz;
