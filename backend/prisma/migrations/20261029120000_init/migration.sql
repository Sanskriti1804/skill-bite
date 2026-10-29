-- Initial physical model from documentation/database.md.
-- Reversing this migration is a later forward migration. Do not drop a shared database to reset.

CREATE TABLE "role" (
  "role_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);
CREATE UNIQUE INDEX "role_code_key" ON "role"("code");

CREATE TABLE "app_user" (
  "user_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  "email_normalized" TEXT NOT NULL,
  "password_hash" TEXT,
  "display_name" TEXT NOT NULL,
  "account_status" TEXT NOT NULL,
  "email_verified_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "app_user_pkey" PRIMARY KEY ("user_id")
);
CREATE UNIQUE INDEX "app_user_email_normalized_key" ON "app_user"("email_normalized");
CREATE INDEX "app_user_role_id_idx" ON "app_user"("role_id");
CREATE INDEX "app_user_account_status_idx" ON "app_user"("account_status");

CREATE TABLE "auth_identity" (
  "identity_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "provider_user_id" TEXT NOT NULL,
  "linked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_identity_pkey" PRIMARY KEY ("identity_id")
);
CREATE UNIQUE INDEX "auth_identity_provider_provider_user_id_key" ON "auth_identity"("provider", "provider_user_id");

CREATE TABLE "auth_token" (
  "token_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_type" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "consumed_at" TIMESTAMPTZ(6),
  "revoked_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_token_pkey" PRIMARY KEY ("token_id")
);
CREATE UNIQUE INDEX "auth_token_token_hash_key" ON "auth_token"("token_hash");
CREATE INDEX "auth_token_user_id_token_type_idx" ON "auth_token"("user_id", "token_type");
CREATE INDEX "auth_token_live_idx" ON "auth_token"("user_id", "token_type") WHERE "consumed_at" IS NULL AND "revoked_at" IS NULL;

CREATE TABLE "user_session" (
  "session_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMPTZ(6),
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "revoked_at" TIMESTAMPTZ(6),
  CONSTRAINT "user_session_pkey" PRIMARY KEY ("session_id")
);
CREATE INDEX "user_session_user_id_idx" ON "user_session"("user_id");
CREATE INDEX "user_session_open_idx" ON "user_session"("user_id") WHERE "revoked_at" IS NULL;

CREATE TABLE "refresh_token" (
  "refresh_token_id" UUID NOT NULL,
  "session_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "issued_at" TIMESTAMPTZ(6) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "used_at" TIMESTAMPTZ(6),
  "revoked_at" TIMESTAMPTZ(6),
  "replaced_by_token_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("refresh_token_id")
);
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");
CREATE UNIQUE INDEX "refresh_token_replaced_by_token_id_key" ON "refresh_token"("replaced_by_token_id");
CREATE INDEX "refresh_token_session_id_idx" ON "refresh_token"("session_id");
CREATE UNIQUE INDEX "refresh_token_one_active" ON "refresh_token"("session_id") WHERE "used_at" IS NULL AND "revoked_at" IS NULL;

CREATE TABLE "content" (
  "content_id" UUID NOT NULL,
  "creator_id" UUID NOT NULL,
  "content_type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "keywords" TEXT,
  "status" TEXT NOT NULL,
  "published_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "content_pkey" PRIMARY KEY ("content_id")
);
CREATE INDEX "content_creator_id_status_idx" ON "content"("creator_id", "status");
CREATE INDEX "content_published_browse_idx" ON "content"("status", "published_at" DESC) WHERE "status" = 'PUBLISHED' AND "deleted_at" IS NULL;

CREATE TABLE "video_details" (
  "content_id" UUID NOT NULL,
  "media_reference" TEXT NOT NULL,
  "duration_seconds" INTEGER NOT NULL,
  "sources" TEXT,
  CONSTRAINT "video_details_pkey" PRIMARY KEY ("content_id")
);

CREATE TABLE "course_details" (
  "content_id" UUID NOT NULL,
  CONSTRAINT "course_details_pkey" PRIMARY KEY ("content_id")
);

CREATE TABLE "course_module" (
  "module_id" UUID NOT NULL,
  "course_content_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "course_module_pkey" PRIMARY KEY ("module_id")
);
CREATE UNIQUE INDEX "course_module_course_content_id_position_key" ON "course_module"("course_content_id", "position");

CREATE TABLE "lesson" (
  "lesson_id" UUID NOT NULL,
  "module_id" UUID NOT NULL,
  "video_content_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "lesson_pkey" PRIMARY KEY ("lesson_id")
);
CREATE UNIQUE INDEX "lesson_video_content_id_key" ON "lesson"("video_content_id");
CREATE UNIQUE INDEX "lesson_module_id_position_key" ON "lesson"("module_id", "position");

CREATE TABLE "video_caption" (
  "caption_id" UUID NOT NULL,
  "video_content_id" UUID NOT NULL,
  "language_code" TEXT NOT NULL,
  "caption_reference" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "method" TEXT,
  "reviewed_at" TIMESTAMPTZ(6),
  CONSTRAINT "video_caption_pkey" PRIMARY KEY ("caption_id")
);
CREATE UNIQUE INDEX "video_caption_video_content_id_language_code_format_key" ON "video_caption"("video_content_id", "language_code", "format");

CREATE TABLE "category" (
  "category_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL,
  CONSTRAINT "category_pkey" PRIMARY KEY ("category_id")
);
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

CREATE TABLE "content_category" (
  "content_id" UUID NOT NULL,
  "category_id" UUID NOT NULL,
  CONSTRAINT "content_category_pkey" PRIMARY KEY ("content_id", "category_id")
);
CREATE INDEX "content_category_category_id_idx" ON "content_category"("category_id");

CREATE TABLE "tag" (
  "tag_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  CONSTRAINT "tag_pkey" PRIMARY KEY ("tag_id")
);
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");
CREATE UNIQUE INDEX "tag_slug_key" ON "tag"("slug");

CREATE TABLE "content_tag" (
  "content_id" UUID NOT NULL,
  "tag_id" UUID NOT NULL,
  CONSTRAINT "content_tag_pkey" PRIMARY KEY ("content_id", "tag_id")
);
CREATE INDEX "content_tag_tag_id_idx" ON "content_tag"("tag_id");

CREATE TABLE "content_attachment" (
  "attachment_id" UUID NOT NULL,
  "content_id" UUID NOT NULL,
  "kind" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  CONSTRAINT "content_attachment_pkey" PRIMARY KEY ("attachment_id")
);

CREATE TABLE "bookmark" (
  "user_id" UUID NOT NULL,
  "content_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bookmark_pkey" PRIMARY KEY ("user_id", "content_id")
);
CREATE INDEX "bookmark_user_created_idx" ON "bookmark"("user_id", "created_at" DESC);

CREATE TABLE "video_progress" (
  "progress_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "video_content_id" UUID NOT NULL,
  "last_position_seconds" INTEGER NOT NULL,
  "last_watched_at" TIMESTAMPTZ(6) NOT NULL,
  "completed_at" TIMESTAMPTZ(6),
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "video_progress_pkey" PRIMARY KEY ("progress_id")
);
CREATE UNIQUE INDEX "video_progress_user_id_video_content_id_key" ON "video_progress"("user_id", "video_content_id");
CREATE INDEX "video_progress_user_id_last_watched_at_idx" ON "video_progress"("user_id", "last_watched_at" DESC);

CREATE TABLE "notification" (
  "notification_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "notification_type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "target_reference" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "read_at" TIMESTAMPTZ(6),
  CONSTRAINT "notification_pkey" PRIMARY KEY ("notification_id")
);
CREATE INDEX "notification_user_id_created_at_idx" ON "notification"("user_id", "created_at" DESC);

CREATE TABLE "notification_preference" (
  "user_id" UUID NOT NULL,
  "notification_type" TEXT NOT NULL,
  "in_app_enabled" BOOLEAN NOT NULL,
  "push_enabled" BOOLEAN NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("user_id", "notification_type")
);

CREATE TABLE "push_device" (
  "device_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "platform" TEXT NOT NULL,
  "encrypted_push_token" TEXT NOT NULL,
  "token_fingerprint" TEXT,
  "last_registered_at" TIMESTAMPTZ(6) NOT NULL,
  "revoked_at" TIMESTAMPTZ(6),
  CONSTRAINT "push_device_pkey" PRIMARY KEY ("device_id")
);
CREATE UNIQUE INDEX "push_device_token_fingerprint_key" ON "push_device"("token_fingerprint");
CREATE INDEX "push_device_user_open_idx" ON "push_device"("user_id") WHERE "revoked_at" IS NULL;

CREATE TABLE "audit_log" (
  "audit_id" UUID NOT NULL,
  "actor_user_id" UUID,
  "action" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_log_pkey" PRIMARY KEY ("audit_id")
);
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at" DESC);
CREATE INDEX "audit_log_actor_user_id_created_at_idx" ON "audit_log"("actor_user_id", "created_at" DESC);

CREATE TABLE "system_setting" (
  "setting_key" TEXT NOT NULL,
  "setting_value" TEXT NOT NULL,
  "updated_by" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "system_setting_pkey" PRIMARY KEY ("setting_key")
);

ALTER TABLE "app_user" ADD CONSTRAINT "app_user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "auth_identity" ADD CONSTRAINT "auth_identity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "auth_token" ADD CONSTRAINT "auth_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_session"("session_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_replaced_by_token_id_fkey" FOREIGN KEY ("replaced_by_token_id") REFERENCES "refresh_token"("refresh_token_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "content" ADD CONSTRAINT "content_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "video_details" ADD CONSTRAINT "video_details_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("content_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "course_details" ADD CONSTRAINT "course_details_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("content_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "course_module" ADD CONSTRAINT "course_module_course_content_id_fkey" FOREIGN KEY ("course_content_id") REFERENCES "course_details"("content_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_module"("module_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_video_content_id_fkey" FOREIGN KEY ("video_content_id") REFERENCES "video_details"("content_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "video_caption" ADD CONSTRAINT "video_caption_video_content_id_fkey" FOREIGN KEY ("video_content_id") REFERENCES "video_details"("content_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "content_category" ADD CONSTRAINT "content_category_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("content_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "content_category" ADD CONSTRAINT "content_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("category_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "content_tag" ADD CONSTRAINT "content_tag_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("content_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "content_tag" ADD CONSTRAINT "content_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("tag_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "content_attachment" ADD CONSTRAINT "content_attachment_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("content_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("content_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_video_content_id_fkey" FOREIGN KEY ("video_content_id") REFERENCES "video_details"("content_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "push_device" ADD CONSTRAINT "push_device_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "system_setting" ADD CONSTRAINT "system_setting_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "app_user" ADD CONSTRAINT "app_user_account_status_check" CHECK ("account_status" IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED'));
ALTER TABLE "content" ADD CONSTRAINT "content_type_check" CHECK ("content_type" IN ('VIDEO', 'COURSE'));
ALTER TABLE "content" ADD CONSTRAINT "content_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'REMOVED'));
ALTER TABLE "auth_token" ADD CONSTRAINT "auth_token_type_check" CHECK ("token_type" IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'));
ALTER TABLE "content_attachment" ADD CONSTRAINT "content_attachment_kind_check" CHECK ("kind" IN ('PDF', 'TEXT', 'HYPERLINK'));
ALTER TABLE "video_caption" ADD CONSTRAINT "video_caption_method_check" CHECK ("method" IS NULL OR "method" IN ('UPLOADED', 'GENERATED'));
ALTER TABLE "push_device" ADD CONSTRAINT "push_device_platform_check" CHECK ("platform" IN ('IOS', 'ANDROID', 'WEB'));
ALTER TABLE "video_details" ADD CONSTRAINT "video_details_duration_check" CHECK ("duration_seconds" >= 0);
ALTER TABLE "course_module" ADD CONSTRAINT "course_module_position_check" CHECK ("position" >= 1);
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_position_check" CHECK ("position" >= 1);
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_position_check" CHECK ("last_position_seconds" >= 0);
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_not_self_check" CHECK ("replaced_by_token_id" IS NULL OR "replaced_by_token_id" <> "refresh_token_id");
