"use client";

import { useEffect, useState } from "react";
import { Button, ErrorState, Field, StatusBadge } from "../../components/ui";
import { useSession } from "../../components/session";
import { Guard } from "../../components/guard";
import { content as contentApi } from "../../lib/services/content";
import { loadDrafts, upsertDraft, updateDraftStatus, type CreatorDraft } from "../../lib/drafts";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      resolve(value.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

export default function CreatorPage() {
  const session = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sources, setSources] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tagId, setTagId] = useState("");
  const [duration, setDuration] = useState("60");
  const [drafts, setDrafts] = useState<CreatorDraft[]>([]);
  const [selected, setSelected] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [modulePosition, setModulePosition] = useState(1);
  const [lessonPosition, setLessonPosition] = useState(1);
  const [courseTitle, setCourseTitle] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonVideoId, setLessonVideoId] = useState("");
  const [attachmentKind, setAttachmentKind] = useState("HYPERLINK");
  const [attachmentRef, setAttachmentRef] = useState("");
  const [captionMethod, setCaptionMethod] = useState("UPLOADED");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session.ready || !session.userId) return;
    setDrafts(loadDrafts(session.userId));
  }, [session.ready, session.userId]);

  if (session.role !== "CREATOR" && session.role !== "ADMIN") {
    return <Guard roles={["CREATOR", "ADMIN"]}><span /></Guard>;
  }

  async function run(work: () => Promise<void>) {
    setError("");
    setBusy(true);
    try {
      await work();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  function remember(item: CreatorDraft) {
    const next = upsertDraft(session.userId, item);
    setDrafts(next);
    setSelected(item.contentId);
  }

  async function openExisting(contentId: string) {
    await run(async () => {
      const detail = await contentApi.detail(contentId, session.token) as {
        title?: string;
        description?: string | null;
        contentType?: string;
        status?: string;
      };
      remember({
        contentId,
        title: detail.title ?? contentId,
        status: detail.status ?? "DRAFT",
        kind: detail.contentType === "COURSE" ? "COURSE" : "VIDEO",
      });
      setTitle(detail.title ?? "");
      setDescription(detail.description ?? "");
      setMessage("Loaded from the server. Drafts stay listed for this account on this browser.");
    });
  }

  return (
    <div className="stack">
      <h1>Content</h1>
      <p className="muted">The API has no owner content list. Drafts created here are stored for this account on this browser and reloaded from the server when selected.</p>

      <h2>Your drafts</h2>
      {!drafts.length ? <p>No saved drafts on this browser yet.</p> : null}
      {drafts.map((item) => (
        <article className="card" key={item.contentId}>
          <p>{item.title} <StatusBadge status={item.status} /> <span className="muted">{item.kind}</span></p>
          <Button onClick={() => void openExisting(item.contentId)}>Open</Button>
        </article>
      ))}
      <Field label="Open content id" value={selected} onChange={setSelected} hint="Paste a known draft or course id owned by this account." />
      <Button disabled={busy || !selected} onClick={() => void openExisting(selected)}>Load by id</Button>

      <h2>Video draft</h2>
      <Field label="Title" value={title} onChange={setTitle} />
      <Field label="Description" value={description} onChange={setDescription} />
      <Field label="Sources" value={sources} onChange={setSources} />
      <Field label="Keywords" value={keywords} onChange={setKeywords} />
      <Field label="Tag id" value={tagId} onChange={setTagId} hint="An admin creates tags. Paste that tag id. Publish requires one tag." />
      <Field label="Duration seconds" value={duration} onChange={setDuration} />
      <div className="row">
        <Button primary disabled={busy} onClick={() => void run(async () => {
          const result = await contentApi.createVideo(session.token, {
            title,
            description,
            sources,
            keywords,
            durationSeconds: Number(duration),
            tagIds: tagId.trim() ? [tagId.trim()] : [],
          });
          remember({ contentId: result.contentId, status: result.status, title, kind: "VIDEO" });
          setMessage("Draft saved.");
        })}>Save draft</Button>
        <Button disabled={busy || !selected} onClick={() => void run(async () => {
          await contentApi.updateVideo(session.token, selected, {
            title,
            description,
            sources,
            keywords,
            durationSeconds: Number(duration),
            tagIds: tagId.trim() ? [tagId.trim()] : [],
          });
          remember({ contentId: selected, status: "DRAFT", title, kind: "VIDEO" });
          setMessage("Draft updated.");
        })}>Update draft</Button>
      </div>

      <h2>Selected item</h2>
      <label className="field">Video file
        <input type="file" accept="video/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file || !selected) return;
          void run(async () => {
            const dataBase64 = await fileToBase64(file);
            await contentApi.saveMedia(session.token, selected, {
              mimeType: file.type || "video/mp4",
              dataBase64,
              durationSeconds: Number(duration),
            });
            setMessage("Video file stored.");
          });
        }} />
      </label>
      <div className="row">
        <Button disabled={busy || !selected} onClick={() => void run(async () => {
          const result = await contentApi.publishVideo(session.token, selected);
          setDrafts(updateDraftStatus(session.userId, selected, result.status));
          setMessage("Published. A published video is not edited in place. Take it down, then edit and publish again.");
        })}>Publish</Button>
        <Button disabled={busy || !selected} onClick={() => void run(async () => {
          const result = await contentApi.takedown(session.token, selected);
          setDrafts(updateDraftStatus(session.userId, selected, result.status));
          setMessage("Taken down. You can edit the draft and publish it again.");
        })}>Take down</Button>
      </div>
      <Field label="Attachment reference" value={attachmentRef} onChange={setAttachmentRef} hint="Supporting PDF, text, or link. This is not the lesson." />
      <label className="field">Attachment kind
        <select value={attachmentKind} onChange={(event) => setAttachmentKind(event.target.value)}>
          <option value="HYPERLINK">HYPERLINK</option>
          <option value="PDF">PDF</option>
          <option value="TEXT">TEXT</option>
        </select>
      </label>
      <Button disabled={busy || !selected} onClick={() => void run(async () => {
        await contentApi.addAttachment(session.token, selected, { kind: attachmentKind, reference: attachmentRef });
        setMessage("Attachment added.");
      })}>Add attachment</Button>
      <label className="field">Caption method
        <select value={captionMethod} onChange={(event) => setCaptionMethod(event.target.value)}>
          <option value="UPLOADED">UPLOADED</option>
          <option value="GENERATED">GENERATED</option>
        </select>
      </label>
      <Button disabled={busy || !selected} onClick={() => void run(async () => {
        await contentApi.addCaption(session.token, selected, {
          method: captionMethod,
          languageCode: "en",
          format: "vtt",
          captionReference: "inline",
          reviewed: false,
        });
        setMessage("Caption recorded. It still needs review, and it does not block publish.");
      })}>Add caption</Button>

      <h2>Course</h2>
      <Field label="Course title" value={courseTitle} onChange={setCourseTitle} />
      <Button disabled={busy} onClick={() => void run(async () => {
        const result = await contentApi.createCourse(session.token, courseTitle);
        remember({ contentId: result.contentId, status: "DRAFT", title: courseTitle, kind: "COURSE" });
        setModulePosition(1);
        setLessonPosition(1);
        setMessage("Course draft saved.");
      })}>Create course</Button>
      <Field label="Module name" value={moduleTitle} onChange={setModuleTitle} />
      <Field label="Module position" value={String(modulePosition)} onChange={(value) => setModulePosition(Number(value) || 1)} />
      <Button disabled={busy || !selected} onClick={() => void run(async () => {
        const result = await contentApi.addModule(session.token, selected, moduleTitle, modulePosition);
        setModuleId(result.moduleId);
        setModulePosition((current) => current + 1);
        setMessage("Module added.");
      })}>Add module</Button>
      <Field label="Lesson name" value={lessonTitle} onChange={setLessonTitle} />
      <Field label="Lesson video id" value={lessonVideoId} onChange={setLessonVideoId} />
      <Field label="Lesson position" value={String(lessonPosition)} onChange={(value) => setLessonPosition(Number(value) || 1)} />
      <Button disabled={busy || !moduleId} onClick={() => void run(async () => {
        await contentApi.addLesson(session.token, moduleId, {
          title: lessonTitle,
          position: lessonPosition,
          videoContentId: lessonVideoId,
        });
        setLessonPosition((current) => current + 1);
        setMessage("Lesson added. One video can belong to only one lesson.");
      })}>Add lesson</Button>
      <Button disabled={busy || !selected} onClick={() => void run(async () => {
        await contentApi.publishCourse(session.token, selected);
        setDrafts(updateDraftStatus(session.userId, selected, "PUBLISHED"));
        setMessage("Course published.");
      })}>Publish course</Button>

      {message ? <p>{message}</p> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}
    </div>
  );
}
