"use client";

import { useState } from "react";
import { Button, ErrorState, Field, StatusBadge } from "../../components/ui";
import { useSession } from "../../components/session";
import { api } from "../../lib/api";
import { Guard } from "../../components/guard";

type Draft = { contentId: string; status: string; title: string; kind: "VIDEO" | "COURSE" };

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
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selected, setSelected] = useState("");
  const [moduleId, setModuleId] = useState("");
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

  function remember(item: Draft) {
    setDrafts((current) => [item, ...current.filter((row) => row.contentId !== item.contentId)]);
    setSelected(item.contentId);
  }

  return (
    <div className="stack">
      <h1>Content</h1>
      <p className="muted">Drafts exist on the server. This screen keeps the ones created in this visit because the API has no owner content list.</p>
      <h2>Video draft</h2>
      <Field label="Title" value={title} onChange={setTitle} />
      <Field label="Description" value={description} onChange={setDescription} />
      <Field label="Sources" value={sources} onChange={setSources} />
      <Field label="Keywords" value={keywords} onChange={setKeywords} />
      <Field label="Tag id" value={tagId} onChange={setTagId} hint="An admin creates tags. Paste that tag id. Publish requires one tag." />
      <Field label="Duration seconds" value={duration} onChange={setDuration} />
      <Button primary disabled={busy} onClick={() => void run(async () => {
        const result = await api<{ contentId: string; status: string }>("/api/v1/videos", {
          method: "POST",
          token: session.token,
          body: {
            title,
            description,
            sources,
            keywords,
            durationSeconds: Number(duration),
            tagIds: tagId.trim() ? [tagId.trim()] : [],
          },
        });
        remember({ contentId: result.contentId, status: result.status, title, kind: "VIDEO" });
        setMessage("Draft saved.");
      })}>Save draft</Button>

      <h2>Selected item</h2>
      <Field label="Content id" value={selected} onChange={setSelected} />
      <label className="field">Video file
        <input type="file" accept="video/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file || !selected) return;
          void run(async () => {
            const dataBase64 = await fileToBase64(file);
            await api(`/api/v1/videos/${selected}/media`, {
              method: "PUT",
              token: session.token,
              body: { mimeType: file.type || "video/mp4", dataBase64, durationSeconds: Number(duration) },
            });
            setMessage("Video file stored.");
          });
        }} />
      </label>
      <div className="row">
        <Button disabled={busy || !selected} onClick={() => void run(async () => {
          const result = await api<{ status: string }>(`/api/v1/videos/${selected}/publish`, { method: "POST", token: session.token });
          setDrafts((current) => current.map((item) => item.contentId === selected ? { ...item, status: result.status } : item));
          setMessage("Published. A published video is not edited in place. Take it down, then edit and publish again.");
        })}>Publish</Button>
        <Button disabled={busy || !selected} onClick={() => void run(async () => {
          const result = await api<{ status: string }>(`/api/v1/videos/${selected}/takedown`, { method: "POST", token: session.token });
          setDrafts((current) => current.map((item) => item.contentId === selected ? { ...item, status: result.status } : item));
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
        await api(`/api/v1/videos/${selected}/attachments`, { method: "POST", token: session.token, body: { kind: attachmentKind, reference: attachmentRef } });
        setMessage("Attachment added.");
      })}>Add attachment</Button>
      <label className="field">Caption method
        <select value={captionMethod} onChange={(event) => setCaptionMethod(event.target.value)}>
          <option value="UPLOADED">UPLOADED</option>
          <option value="GENERATED">GENERATED</option>
        </select>
      </label>
      <Button disabled={busy || !selected} onClick={() => void run(async () => {
        await api(`/api/v1/videos/${selected}/captions`, {
          method: "POST",
          token: session.token,
          body: { method: captionMethod, languageCode: "en", format: "vtt", captionReference: "inline", reviewed: false },
        });
        setMessage("Caption recorded. It still needs review, and it does not block publish.");
      })}>Add caption</Button>

      <h2>Course</h2>
      <Field label="Course title" value={courseTitle} onChange={setCourseTitle} />
      <Button disabled={busy} onClick={() => void run(async () => {
        const result = await api<{ contentId: string }>("/api/v1/courses", { method: "POST", token: session.token, body: { title: courseTitle } });
        remember({ contentId: result.contentId, status: "DRAFT", title: courseTitle, kind: "COURSE" });
        setMessage("Course draft saved.");
      })}>Create course</Button>
      <Field label="Module name" value={moduleTitle} onChange={setModuleTitle} />
      <Button disabled={busy || !selected} onClick={() => void run(async () => {
        const result = await api<{ moduleId: string }>(`/api/v1/courses/${selected}/modules`, {
          method: "POST",
          token: session.token,
          body: { title: moduleTitle, position: 1 },
        });
        setModuleId(result.moduleId);
        setMessage("Module added.");
      })}>Add module at position 1</Button>
      <Field label="Lesson name" value={lessonTitle} onChange={setLessonTitle} />
      <Field label="Lesson video id" value={lessonVideoId} onChange={setLessonVideoId} />
      <Button disabled={busy || !moduleId} onClick={() => void run(async () => {
        await api(`/api/v1/modules/${moduleId}/lessons`, {
          method: "POST",
          token: session.token,
          body: { title: lessonTitle, position: 1, videoContentId: lessonVideoId },
        });
        setMessage("Lesson added. One video can belong to only one lesson.");
      })}>Add lesson</Button>
      <Button disabled={busy || !selected} onClick={() => void run(async () => {
        await api(`/api/v1/courses/${selected}/publish`, { method: "POST", token: session.token });
        setMessage("Course published.");
      })}>Publish course</Button>

      {message ? <p>{message}</p> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!drafts.length ? <p>No videos or courses in this visit yet.</p> : null}
      {drafts.map((item) => (
        <article className="card" key={item.contentId}>
          <p>{item.title} <StatusBadge status={item.status} /> <span className="muted">{item.kind}</span></p>
          <Button onClick={() => setSelected(item.contentId)}>Use this id</Button>
        </article>
      ))}
    </div>
  );
}
