"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button, EmptyState, ErrorState, LoadingState } from "../../../components/ui";
import { useSession } from "../../../components/session";
import { apiBase } from "../../../lib/api";
import { content as contentApi } from "../../../lib/services/content";
import { learning } from "../../../lib/services/learning";

type Lesson = { title: string; position: number; videoContentId: string };
type Module = { title: string; lessons: Lesson[] };
type Attachment = { kind: string; reference: string };
type Content = {
  title: string;
  description: string | null;
  contentType: string;
  modules?: Module[];
  attachments?: Attachment[];
};

export default function WatchPage() {
  const params = useParams<{ contentId: string }>();
  const paramsContentId = params.contentId;
  const session = useSession();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedRef = useRef(-1);
  const [content, setContent] = useState<Content | null>(null);
  const [activeVideoId, setActiveVideoId] = useState("");
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [courseProgress, setCourseProgress] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    contentApi.detail(paramsContentId, session.token || undefined)
      .then((result) => {
        const detail = result as Content;
        setContent(detail);
        if (detail.contentType === "VIDEO") {
          setActiveVideoId(paramsContentId);
        } else {
          const first = detail.modules?.flatMap((module) => module.lessons)[0]?.videoContentId ?? "";
          setActiveVideoId(first);
        }
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unavailable"))
      .finally(() => setLoading(false));
  }, [paramsContentId, session.token]);

  useEffect(() => {
    if (!session.token || !activeVideoId) return;
    learning.progress(session.token)
      .then((result) => {
        const row = result.items.find((item) => item.videoContentId === activeVideoId);
        setResumeSeconds(row?.lastPositionSeconds ?? 0);
        lastSavedRef.current = row?.lastPositionSeconds ?? -1;
      })
      .catch(() => undefined);
  }, [activeVideoId, session.token]);

  useEffect(() => {
    if (!session.token) {
      setBookmarked(false);
      return;
    }
    learning.bookmarks(session.token)
      .then((result) => setBookmarked(result.items.some((item) => item.contentId === paramsContentId)))
      .catch(() => setBookmarked(false));
  }, [paramsContentId, session.token]);

  useEffect(() => {
    if (!session.token || !content || content.contentType !== "COURSE") return;
    learning.courseProgress(session.token, paramsContentId)
      .then((result) => setCourseProgress(`${result.completedDurationSeconds} of ${result.totalDurationSeconds} seconds completed`))
      .catch(() => setCourseProgress(""));
  }, [content, paramsContentId, session.token]);

  const saveProgress = useCallback(async (seconds: number, force = false) => {
    if (!session.token || !activeVideoId) return;
    const position = Math.max(0, Math.floor(seconds));
    if (!force && Math.abs(position - lastSavedRef.current) < 5) return;
    try {
      const result = await learning.saveProgress(session.token, activeVideoId, position);
      lastSavedRef.current = result.lastPositionSeconds;
      setResumeSeconds(result.lastPositionSeconds);
      setSaveError("");
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Progress could not be saved");
    }
  }, [activeVideoId, session.token]);

  function applyResume() {
    const player = videoRef.current;
    if (!player || resumeSeconds <= 0) return;
    if (Math.abs(player.currentTime - resumeSeconds) > 1) {
      player.currentTime = resumeSeconds;
    }
  }

  async function toggleBookmark() {
    if (!session.token) return;
    setMessage("");
    try {
      if (bookmarked) {
        await learning.removeBookmark(session.token, paramsContentId);
        setBookmarked(false);
        setMessage("Bookmark removed.");
      } else {
        await learning.addBookmark(session.token, paramsContentId);
        setBookmarked(true);
        setMessage("Bookmarked.");
      }
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Bookmark failed");
    }
  }

  if (loading || !session.ready) return <LoadingState />;
  if (error || !content) return <ErrorState>{error || "Unavailable"}</ErrorState>;

  return (
    <div className="stack">
      <h1>{content.title}</h1>
      <p>Resume at {resumeSeconds} seconds. Completion is not shown from the playback position.</p>
      {activeVideoId ? (
        <video
          ref={videoRef}
          className="player"
          controls
          src={`${apiBase}/api/v1/videos/${activeVideoId}/media`}
          onLoadedMetadata={applyResume}
          onTimeUpdate={(event) => void saveProgress(event.currentTarget.currentTime)}
          onPause={(event) => void saveProgress(event.currentTarget.currentTime, true)}
          onEnded={(event) => void saveProgress(event.currentTarget.currentTime, true)}
        />
      ) : (
        <EmptyState>This content is unavailable.</EmptyState>
      )}
      {saveError ? <ErrorState>Progress save failed: {saveError}</ErrorState> : null}
      {content.description ? <p>{content.description}</p> : null}
      {content.modules?.map((module) => (
        <section key={module.title}>
          <h2>{module.title}</h2>
          {module.lessons.map((lesson) => (
            <button
              key={lesson.videoContentId}
              type="button"
              className={lesson.videoContentId === activeVideoId ? "chip" : ""}
              aria-pressed={lesson.videoContentId === activeVideoId}
              onClick={() => {
                const player = videoRef.current;
                if (player && session.token) void saveProgress(player.currentTime, true);
                setActiveVideoId(lesson.videoContentId);
              }}
            >
              {lesson.position}. {lesson.title}
            </button>
          ))}
        </section>
      ))}
      {content.attachments?.length ? <h2>Supporting material</h2> : null}
      {content.attachments?.map((item) => (
        item.kind === "HYPERLINK" ? (
          <p key={item.reference}><a href={item.reference} target="_blank" rel="noreferrer">{item.reference}</a></p>
        ) : (
          <p key={item.reference}>{item.kind}: {item.reference}</p>
        )
      ))}
      {courseProgress ? <p>{courseProgress}</p> : null}
      {message ? <p>{message}</p> : null}
      {session.token ? (
        <Button onClick={() => void toggleBookmark()}>{bookmarked ? "Remove bookmark" : "Bookmark"}</Button>
      ) : null}
      <Button onClick={() => void navigator.clipboard.writeText(window.location.href).then(() => setMessage("Share link copied."))}>Copy share link</Button>
    </div>
  );
}
