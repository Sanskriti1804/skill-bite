import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import EmbeddedPostgres from "embedded-postgres";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createLogger } from "../src/logger.js";
import type { GoogleVerifier } from "../src/google.js";
import type { MailMessage, MailPort } from "../src/routes.js";
import { sha256 } from "../src/security.js";
import { seedReferenceData } from "../src/db/seed.js";
import { localMediaStorage } from "../src/storage.js";

const port = 55432;
const databaseDir = mkdtempSync(path.join(tmpdir(), "skillbite-pg-"));
const mediaRoot = mkdtempSync(path.join(tmpdir(), "skillbite-media-"));
const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/skillbite`;
const captured: MailMessage[] = [];
const mail: MailPort = { async deliver(message) { captured.push(message); } };
let googleResult: { subject: string; email: string; emailVerified: boolean } | "throw" = "throw";
const google: GoogleVerifier = {
  async verify() {
    if (googleResult === "throw") throw new Error("bad token");
    return googleResult;
  },
};

const config = loadConfig({
  NODE_ENV: "test",
  PORT: "3000",
  LOG_LEVEL: "error",
  DATABASE_URL: databaseUrl,
  TOKEN_SIGNING_SECRET: "test-signing-secret-value",
  PUSH_TOKEN_KEY: "test-push-token-key-value",
  ACCESS_TOKEN_TTL_SECONDS: "900",
  MEDIA_ROOT: mediaRoot,
});
const logger = createLogger(config);
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const app = createApp(config, logger, { prisma, mail, google, storage: localMediaStorage(mediaRoot) });

async function listen(): Promise<{ base: string; close: () => Promise<void> }> {
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  return {
    base: `http://127.0.0.1:${address.port}`,
    close: async () => {
      server.close();
      await once(server, "close");
    },
  };
}

async function json(base: string, method: string, urlPath: string, body?: unknown, token?: string) {
  const response = await fetch(`${base}${urlPath}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

test("migration, constraints, and API", async (t) => {
  const pg = new EmbeddedPostgres({
    databaseDir,
    port,
    user: "postgres",
    password: "postgres",
    persistent: false,
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("skillbite");
  execSync("npx prisma migrate deploy", {
    cwd: path.resolve("."),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
  await seedReferenceData(prisma);
  const { base, close } = await listen();

  t.after(async () => {
    await close();
    await prisma.$disconnect();
    await pg.stop();
  });

  await t.test("duplicate email, bookmark, progress, lesson position, and video reuse fail", async () => {
    const userRole = await prisma.role.findUniqueOrThrow({ where: { code: "USER" } });
    const user = await prisma.appUser.create({
      data: {
        roleId: userRole.roleId,
        emailNormalized: "dup@example.com",
        displayName: "Dup",
        accountStatus: "ACTIVE",
      },
    });
    await assert.rejects(() => prisma.appUser.create({
      data: { roleId: userRole.roleId, emailNormalized: "dup@example.com", displayName: "Dup2", accountStatus: "ACTIVE" },
    }));
    const video = await prisma.content.create({
      data: {
        creatorId: user.userId,
        contentType: "VIDEO",
        title: "V",
        status: "DRAFT",
        video: { create: { mediaReference: "a", durationSeconds: 10 } },
      },
    });
    const video2 = await prisma.content.create({
      data: {
        creatorId: user.userId,
        contentType: "VIDEO",
        title: "V2",
        status: "DRAFT",
        video: { create: { mediaReference: "b", durationSeconds: 10 } },
      },
    });
    const course = await prisma.content.create({
      data: { creatorId: user.userId, contentType: "COURSE", title: "C", status: "DRAFT", course: { create: {} } },
    });
    const module = await prisma.courseModule.create({
      data: { courseContentId: course.contentId, title: "M", position: 1 },
    });
    await prisma.lesson.create({ data: { moduleId: module.moduleId, videoContentId: video.contentId, title: "L", position: 1 } });
    await assert.rejects(() => prisma.lesson.create({
      data: { moduleId: module.moduleId, videoContentId: video2.contentId, title: "L2", position: 1 },
    }));
    await assert.rejects(() => prisma.lesson.create({
      data: { moduleId: module.moduleId, videoContentId: video.contentId, title: "L3", position: 2 },
    }));
    await prisma.bookmark.create({ data: { userId: user.userId, contentId: video.contentId } });
    await assert.rejects(() => prisma.bookmark.create({ data: { userId: user.userId, contentId: video.contentId } }));
    await prisma.videoProgress.create({
      data: { userId: user.userId, videoContentId: video.contentId, lastPositionSeconds: 1, lastWatchedAt: new Date() },
    });
    await assert.rejects(() => prisma.videoProgress.create({
      data: { userId: user.userId, videoContentId: video.contentId, lastPositionSeconds: 2, lastWatchedAt: new Date() },
    }));
  });

  await t.test("register, verify, login, refresh reuse, logout, and me", async () => {
    captured.length = 0;
    const created = await json(base, "POST", "/api/v1/auth/register", {
      email: "ada@example.com",
      password: "password1",
      displayName: "Ada",
      role: "CREATOR",
    });
    assert.equal(created.status, 201);
    const weak = await json(base, "POST", "/api/v1/auth/register", {
      email: "weak@example.com",
      password: "short",
      displayName: "Weak",
      role: "USER",
    });
    assert.equal(weak.status, 400);
    const duplicate = await json(base, "POST", "/api/v1/auth/register", {
      email: "ada@example.com",
      password: "password1",
      displayName: "Ada",
      role: "USER",
    });
    assert.equal(duplicate.status, 409);
    const token = captured[0]?.token ?? "";
    const stored = await prisma.authToken.findFirst({ where: { tokenHash: sha256(token) } });
    assert.ok(stored);
    assert.equal((await json(base, "POST", "/api/v1/auth/verify-email", { token })).status, 200);
    assert.equal((await json(base, "POST", "/api/v1/auth/verify-email", { token })).status, 400);
    const unknown = await json(base, "POST", "/api/v1/auth/login", { email: "missing@example.com", password: "password1" });
    const wrong = await json(base, "POST", "/api/v1/auth/login", { email: "ada@example.com", password: "wrong-password" });
    assert.equal(unknown.status, 401);
    assert.equal(wrong.status, 401);
    assert.equal(unknown.body.error.message, wrong.body.error.message);
    const login = await json(base, "POST", "/api/v1/auth/login", { email: "ada@example.com", password: "password1" });
    assert.equal(login.status, 200);
    const me = await json(base, "GET", "/api/v1/me", undefined, login.body.accessToken);
    assert.equal(me.body.role, "CREATOR");
    const refreshed = await json(base, "POST", "/api/v1/auth/refresh", { refreshToken: login.body.refreshToken });
    assert.equal(refreshed.status, 200);
    const reused = await json(base, "POST", "/api/v1/auth/refresh", { refreshToken: login.body.refreshToken });
    assert.equal(reused.status, 401);
    const afterReuse = await json(base, "GET", "/api/v1/me", undefined, login.body.accessToken);
    assert.equal(afterReuse.status, 401);
    const login2 = await json(base, "POST", "/api/v1/auth/login", { email: "ada@example.com", password: "password1" });
    assert.equal((await json(base, "POST", "/api/v1/auth/logout", undefined, login2.body.accessToken)).status, 200);
    assert.equal((await json(base, "GET", "/api/v1/me", undefined, login2.body.accessToken)).status, 401);
  });

  await t.test("google identity and unverified email", async () => {
    googleResult = { subject: "google-1", email: "ada@example.com", emailVerified: false };
    assert.equal((await json(base, "POST", "/api/v1/auth/google", { identityToken: "x" })).status, 401);
    const links = await prisma.authIdentity.count({ where: { providerUserId: "google-1" } });
    assert.equal(links, 0);
    googleResult = { subject: "google-2", email: "gia@example.com", emailVerified: true };
    const first = await json(base, "POST", "/api/v1/auth/google", { identityToken: "good" });
    const second = await json(base, "POST", "/api/v1/auth/google", { identityToken: "good" });
    const me1 = await json(base, "GET", "/api/v1/me", undefined, first.body.accessToken);
    const me2 = await json(base, "GET", "/api/v1/me", undefined, second.body.accessToken);
    assert.equal(me1.body.userId, me2.body.userId);
    googleResult = "throw";
    assert.equal((await json(base, "POST", "/api/v1/auth/google", { identityToken: "tampered" })).status, 401);
  });

  await t.test("role switch and account status", async () => {
    const login = await json(base, "POST", "/api/v1/auth/login", { email: "ada@example.com", password: "password1" });
    const token = login.body.accessToken;
    assert.equal((await json(base, "PATCH", "/api/v1/me/role", { role: "ADMIN" }, token)).status, 400);
    assert.equal((await json(base, "PATCH", "/api/v1/me/role", { role: "USER" }, token)).status, 200);
    assert.equal((await json(base, "POST", "/api/v1/videos", { title: "Nope" }, token)).status, 403);
    const contentCount = await prisma.content.count({ where: { creator: { emailNormalized: "ada@example.com" } } });
    assert.equal((await json(base, "PATCH", "/api/v1/me/role", { role: "CREATOR" }, token)).status, 200);
    assert.equal(await prisma.content.count({ where: { creator: { emailNormalized: "ada@example.com" } } }), contentCount);
    assert.equal((await json(base, "GET", "/api/v1/admin/users", undefined, token)).status, 403);
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "ADMIN" } });
    await prisma.appUser.create({
      data: {
        roleId: adminRole.roleId,
        emailNormalized: "admin@example.com",
        displayName: "Admin",
        accountStatus: "ACTIVE",
        passwordHash: (await prisma.appUser.findUniqueOrThrow({ where: { emailNormalized: "ada@example.com" } })).passwordHash,
      },
    });
    const admin = await json(base, "POST", "/api/v1/auth/login", { email: "admin@example.com", password: "password1" });
    const ada = await prisma.appUser.findUniqueOrThrow({ where: { emailNormalized: "ada@example.com" } });
    assert.equal((await json(base, "PATCH", `/api/v1/admin/users/${ada.userId}/status`, { accountStatus: "SUSPENDED" }, admin.body.accessToken)).status, 200);
    assert.equal((await json(base, "POST", "/api/v1/auth/login", { email: "ada@example.com", password: "password1" })).status, 403);
    assert.equal((await json(base, "POST", "/api/v1/auth/refresh", { refreshToken: login.body.refreshToken })).status, 403);
    captured.length = 0;
    await json(base, "POST", "/api/v1/auth/password-reset", { email: "ada@example.com" });
    const reset = await json(base, "POST", "/api/v1/auth/password-reset/confirm", { token: captured.at(-1)?.token, password: "password2" });
    assert.equal(reset.status, 403);
    await json(base, "PATCH", `/api/v1/admin/users/${ada.userId}/status`, { accountStatus: "ACTIVE" }, admin.body.accessToken);
  });

  await t.test("video publish, takedown, course, discovery, progress, admin", async () => {
    const creator = await json(base, "POST", "/api/v1/auth/login", { email: "ada@example.com", password: "password1" });
    const token = creator.body.accessToken;
    const admin = await json(base, "POST", "/api/v1/auth/login", { email: "admin@example.com", password: "password1" });
    const adminToken = admin.body.accessToken;
    const tag = await json(base, "POST", "/api/v1/admin/tags", { name: "Basics", slug: "basics" }, adminToken);
    const other = await json(base, "POST", "/api/v1/auth/register", {
      email: "bea@example.com", password: "password1", displayName: "Bea", role: "CREATOR",
    });
    assert.equal(other.status, 201);
    const bea = await json(base, "POST", "/api/v1/auth/login", { email: "bea@example.com", password: "password1" });
    const video = await json(base, "POST", "/api/v1/videos", { title: "Intro", durationSeconds: 100 }, token);
    const contentId = video.body.contentId;
    assert.equal((await json(base, "PATCH", `/api/v1/videos/${contentId}`, { title: "Stolen" }, bea.body.accessToken)).status, 403);
    assert.equal((await json(base, "PUT", `/api/v1/videos/${contentId}/media`, { mimeType: "text/plain", dataBase64: Buffer.from("hi").toString("base64") }, token)).status, 400);
    const media = await json(base, "PUT", `/api/v1/videos/${contentId}/media`, {
      mimeType: "video/mp4",
      dataBase64: Buffer.from("video-bytes").toString("base64"),
      durationSeconds: 100,
    }, token);
    assert.equal(media.status, 200);
    assert.equal((await json(base, "GET", `/api/v1/videos/${contentId}/media`, undefined, bea.body.accessToken)).status, 403);
    assert.equal((await json(base, "POST", `/api/v1/videos/${contentId}/publish`)).status, 401);
    assert.equal((await json(base, "POST", `/api/v1/videos/${contentId}/publish`, undefined, token)).status, 400);
    await json(base, "PATCH", `/api/v1/videos/${contentId}`, { description: "About", keywords: "intro", sources: "notes" }, token);
    await prisma.contentTag.create({ data: { contentId, tagId: tag.body.tagId } });
    assert.equal((await json(base, "POST", `/api/v1/videos/${contentId}/publish`, undefined, token)).status, 200);
    assert.equal((await json(base, "PATCH", `/api/v1/videos/${contentId}`, { title: "Changed" }, token)).status, 409);
    assert.equal((await json(base, "POST", `/api/v1/videos/${contentId}/takedown`, undefined, token)).status, 200);
    assert.equal((await json(base, "PATCH", `/api/v1/videos/${contentId}`, { title: "Revised" }, token)).status, 200);
    await json(base, "POST", `/api/v1/videos/${contentId}/publish`, undefined, token);
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: "trending" } });
    await prisma.contentCategory.create({ data: { contentId, categoryId: category.categoryId } });
    const listed = await json(base, "GET", "/api/v1/content?category=trending&q=Revised");
    assert.equal(listed.body.items.length, 1);
    const draft = await json(base, "POST", "/api/v1/videos", { title: "Hidden" }, token);
    const browse = await json(base, "GET", "/api/v1/content?q=Hidden");
    assert.equal(browse.body.items.length, 0);
    const bookmark = await json(base, "POST", "/api/v1/bookmarks", { contentId }, token);
    assert.equal(bookmark.status, 201);
    assert.equal((await json(base, "POST", "/api/v1/bookmarks", { contentId }, token)).status, 409);
    const progress = await json(base, "PUT", `/api/v1/videos/${contentId}/progress`, { lastPositionSeconds: 100 }, token);
    assert.equal(progress.body.completedAt, null);
    const again = await json(base, "PUT", `/api/v1/videos/${contentId}/progress`, { lastPositionSeconds: 10 }, token);
    assert.equal(again.body.lastPositionSeconds, 10);
    const rows = await prisma.videoProgress.count({ where: { videoContentId: contentId, userId: (await prisma.appUser.findUniqueOrThrow({ where: { emailNormalized: "ada@example.com" } })).userId } });
    assert.equal(rows, 1);
    const course = await json(base, "POST", "/api/v1/courses", { title: "Course" }, token);
    const module = await json(base, "POST", `/api/v1/courses/${course.body.contentId}/modules`, { title: "Module", position: 1 }, token);
    assert.equal((await json(base, "POST", `/api/v1/modules/${module.body.moduleId}/lessons`, { title: "One", position: 1, videoContentId: contentId }, token)).status, 201);
    const videoB = await json(base, "POST", "/api/v1/videos", { title: "Second", durationSeconds: 50 }, token);
    await json(base, "PUT", `/api/v1/videos/${videoB.body.contentId}/media`, { mimeType: "video/mp4", dataBase64: Buffer.from("more").toString("base64"), durationSeconds: 50 }, token);
    assert.equal((await json(base, "POST", `/api/v1/modules/${module.body.moduleId}/lessons`, { title: "Two", position: 1, videoContentId: videoB.body.contentId }, token)).status, 409);
    assert.equal((await json(base, "POST", `/api/v1/modules/${module.body.moduleId}/lessons`, { title: "Two", position: 2, videoContentId: contentId }, token)).status, 409);
    assert.equal((await json(base, "POST", `/api/v1/modules/${module.body.moduleId}/lessons`, { title: "Two", position: 2, videoContentId: videoB.body.contentId }, token)).status, 201);
    assert.equal((await json(base, "POST", `/api/v1/courses/${course.body.contentId}/publish`, undefined, token)).status, 400);
    await json(base, "PATCH", `/api/v1/videos/${videoB.body.contentId}`, { description: "Second video", keywords: "second", sources: "notes" }, token);
    await prisma.contentTag.create({ data: { contentId: videoB.body.contentId, tagId: tag.body.tagId } });
    assert.equal((await json(base, "POST", `/api/v1/courses/${course.body.contentId}/publish`, undefined, token)).status, 200);
    const courseProgress = await json(base, "GET", `/api/v1/courses/${course.body.contentId}/progress`, undefined, token);
    assert.equal(courseProgress.body.totalDurationSeconds, 150);
    assert.equal(courseProgress.body.completedDurationSeconds, 0);
    const attachment = await json(base, "POST", `/api/v1/videos/${contentId}/attachments`, { kind: "HYPERLINK", reference: "https://example.com" }, token);
    assert.equal(attachment.status, 201);
    assert.equal((await json(base, "POST", `/api/v1/videos/${contentId}/attachments`, { kind: "HYPERLINK", reference: "https://example.com" }, bea.body.accessToken)).status, 403);
    assert.equal((await json(base, "POST", `/api/v1/videos/${contentId}/captions`, { method: "UPLOADED", languageCode: "en", format: "vtt" }, token)).status, 201);
    assert.equal((await json(base, "POST", `/api/v1/videos/${contentId}/captions`, { method: "GENERATED", languageCode: "en", format: "vtt" }, token)).status, 409);
    const before = await prisma.videoProgress.findFirst({ where: { videoContentId: contentId } });
    assert.equal((await json(base, "PUT", "/api/v1/admin/settings/completion-threshold", { value: 80 }, adminToken)).status, 200);
    const after = await prisma.videoProgress.findFirst({ where: { videoContentId: contentId } });
    assert.equal(after?.completedAt, before?.completedAt);
    const audit = await json(base, "GET", "/api/v1/admin/audit", undefined, adminToken);
    assert.equal(JSON.stringify(audit.body).includes("password"), false);
    assert.equal((await json(base, "POST", `/api/v1/admin/content/${contentId}/delete`, undefined, adminToken)).status, 200);
    assert.equal((await json(base, "GET", "/api/v1/content?q=Revised")).body.items.length, 0);
    assert.equal((await json(base, "POST", `/api/v1/admin/content/${contentId}/restore`, undefined, adminToken)).status, 200);
    assert.equal((await json(base, "GET", "/api/v1/content?q=Revised")).body.items.length, 1);
    assert.equal((await json(base, "PUT", "/api/v1/notification-preferences/account", { pushEnabled: false }, token)).status, 409);
    assert.equal((await json(base, "PUT", "/api/v1/notification-preferences/promo", {}, token)).status, 409);
    const device = await json(base, "POST", "/api/v1/devices", { platform: "WEB", pushToken: "device-token" }, token);
    assert.equal((await json(base, "DELETE", `/api/v1/devices/${device.body.deviceId}`, undefined, token)).status, 200);
    assert.equal((await prisma.videoProgress.findFirst({ where: { videoContentId: contentId } }))?.lastPositionSeconds, 10);
    assert.equal((await json(base, "GET", "/api/v1/notifications", undefined, token)).status, 200);
  });
});
