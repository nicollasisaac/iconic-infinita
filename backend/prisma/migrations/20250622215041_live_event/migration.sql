-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'iconic', 'admin', 'scanner');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('party', 'drop', 'dinner', 'fashion_show', 'other');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('confirmed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "instagram" TEXT,
    "nickname" VARCHAR(30) NOT NULL,
    "profile_picture_url" TEXT,
    "bio" TEXT,
    "show_public_profile" BOOLEAN NOT NULL DEFAULT true,
    "show_profile_to_iconics" BOOLEAN NOT NULL DEFAULT true,
    "is_iconic" BOOLEAN NOT NULL DEFAULT false,
    "iconic_expires_at" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'user',
    "date_of_birth" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPhoto" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "location" VARCHAR(200) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "category" "EventCategory" NOT NULL,
    "is_exclusive" BOOLEAN NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "max_attendees" INTEGER NOT NULL,
    "current_attendees" INTEGER NOT NULL DEFAULT 0,
    "partner_name" VARCHAR(100),
    "partner_logo_url" TEXT,
    "cover_image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" "ParticipationStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "EventParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCheckin" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "qr_token" VARCHAR(64) NOT NULL,
    "scanned_by_admin_id" TEXT,
    "checkin_time" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:00+00'::timestamptz,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IconicChatMessage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IconicChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveEvent" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "require_qr" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivePoll" (
    "id" TEXT NOT NULL,
    "live_event_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "duration_sec" INTEGER NOT NULL,
    "state_live_event" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LivePoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivePollOption" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "LivePollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivePollResponse" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LivePollResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveMatchGroup" (
    "id" TEXT NOT NULL,
    "live_event_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "duration_sec" INTEGER NOT NULL,
    "state_live_event" INTEGER NOT NULL,
    "ended_at" TIMESTAMP(3),
    "group_number" INTEGER NOT NULL,

    CONSTRAINT "LiveMatchGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveMatchParticipant" (
    "id" TEXT NOT NULL,
    "match_group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "LiveMatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "UserPhoto_user_id_url_key" ON "UserPhoto"("user_id", "url");

-- CreateIndex
CREATE UNIQUE INDEX "UserPhoto_user_id_position_key" ON "UserPhoto"("user_id", "position");

-- CreateIndex
CREATE INDEX "Event_owner_id_idx" ON "Event"("owner_id");

-- CreateIndex
CREATE INDEX "EventParticipation_user_id_event_id_idx" ON "EventParticipation"("user_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipation_user_id_event_id_key" ON "EventParticipation"("user_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "EventCheckin_qr_token_key" ON "EventCheckin"("qr_token");

-- CreateIndex
CREATE INDEX "EventCheckin_event_id_user_id_idx" ON "EventCheckin"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "LiveEvent_event_id_idx" ON "LiveEvent"("event_id");

-- CreateIndex
CREATE INDEX "LivePoll_live_event_id_idx" ON "LivePoll"("live_event_id");

-- CreateIndex
CREATE INDEX "LivePollOption_poll_id_idx" ON "LivePollOption"("poll_id");

-- CreateIndex
CREATE INDEX "LivePollResponse_poll_id_option_id_idx" ON "LivePollResponse"("poll_id", "option_id");

-- CreateIndex
CREATE UNIQUE INDEX "LivePollResponse_poll_id_user_id_key" ON "LivePollResponse"("poll_id", "user_id");

-- CreateIndex
CREATE INDEX "LiveMatchGroup_live_event_id_idx" ON "LiveMatchGroup"("live_event_id");

-- CreateIndex
CREATE INDEX "LiveMatchParticipant_match_group_id_idx" ON "LiveMatchParticipant"("match_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveMatchParticipant_match_group_id_user_id_key" ON "LiveMatchParticipant"("match_group_id", "user_id");

-- AddForeignKey
ALTER TABLE "UserPhoto" ADD CONSTRAINT "UserPhoto_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCheckin" ADD CONSTRAINT "EventCheckin_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCheckin" ADD CONSTRAINT "EventCheckin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCheckin" ADD CONSTRAINT "EventCheckin_scanned_by_admin_id_fkey" FOREIGN KEY ("scanned_by_admin_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IconicChatMessage" ADD CONSTRAINT "IconicChatMessage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveEvent" ADD CONSTRAINT "LiveEvent_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePoll" ADD CONSTRAINT "LivePoll_live_event_id_fkey" FOREIGN KEY ("live_event_id") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePollOption" ADD CONSTRAINT "LivePollOption_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "LivePoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePollResponse" ADD CONSTRAINT "LivePollResponse_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "LivePoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePollResponse" ADD CONSTRAINT "LivePollResponse_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "LivePollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePollResponse" ADD CONSTRAINT "LivePollResponse_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveMatchGroup" ADD CONSTRAINT "LiveMatchGroup_live_event_id_fkey" FOREIGN KEY ("live_event_id") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveMatchParticipant" ADD CONSTRAINT "LiveMatchParticipant_match_group_id_fkey" FOREIGN KEY ("match_group_id") REFERENCES "LiveMatchGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveMatchParticipant" ADD CONSTRAINT "LiveMatchParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
