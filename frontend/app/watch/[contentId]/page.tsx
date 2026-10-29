"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, EmptyState, ErrorState, LoadingState } from "../../../components/ui";
import { useSession } from "../../../components/session";
import { api, apiBase } from "../../../lib/api";

type Content = {
  title: string;
  description: string | null;
  contentType: string;
  modules?: { title: string; lessons: { title: string; position: number; videoContentId: string }[] }[];
  attachments?: { kind: string; reference: string }[];
};

export default function WatchPage() {
  const params = useParams<{ contentId: string }>();
  const session = useSession();
  const [content, setContent] = useState<Content | null>(null);
  const [position, setPosition] = useState(0);
  const [courseProgress, setCourseProgress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Content>(`/api/v1/content/${params.contentId}`)
      .then(setContent)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unavailable"))
      .finally(() => setLoading(false));
  }, [params.contentId]);

  async function save(videoId: string) {
    if (!session.token) return;
    const result = await api<{ lastPositionSeconds: number; completedAt: string | null }>(`/api/v1/videos/${videoId}/progress`, {
      method: "PUT",
      token: session.token,
      body: { lastPositionSeconds: position },
    });
    setPosition(result.lastPositionSeconds);
  }

  async function loadCourse() {
    if (!session.token) return;
    const result = await api<{ totalDurationSeconds: number; completedDurationSeconds: number }>(`/api/v1/courses/${params.contentId}/progress`, { token: session.token });
    setCourseProgress(`${result.completedDurationSeconds} of ${result.totalDurationSeconds} seconds completed`);
  }

  if (loading) return <LoadingState />;
  if (error || !content) return <ErrorState>{error || "Unavailable"}</ErrorState>;
  const videoId = content.contentType === "VIDEO" ? params.contentId : content.modules?.[0]?.lessons[0]?.videoContentId;
  return (
    <div className="stack">
      <h1>{content.title}</h1>
      <p>Resume at {position} seconds. Completion is not shown from the playback position.</p>
      {videoId ? <video controls src={`${apiBase}/api/v1/videos/${videoId}/media`} /> : <EmptyState>No video.</EmptyState>}
      {content.description ? <p>{content.description}</p> : null}
      {content.modules?.map((module) => (
        <section key={module.title}>
          <h2>{module.title}</h2>
          {module.lessons.map((lesson) => <p key={lesson.videoContentId}>{lesson.position}. {lesson.title}</p>)}
        </section>
      ))}
      {content.attachments?.length ? <h2>Supporting material</h2> : null}
      {content.attachments?.map((item) => <p key={item.reference}>{item.kind}: {item.reference}</p>)}
      {courseProgress ? <p>{courseProgress}</p> : null}
      {session.token && videoId ? <Button onClick={() => void save(videoId)}>Save progress</Button> : null}
      {session.token && content.contentType === "COURSE" ? <Button onClick={() => void loadCourse()}>Course progress</Button> : null}
      {session.token ? <Button onClick={() => void api("/api/v1/bookmarks", { method: "POST", token: session.token, body: { contentId: params.contentId } })}>Bookmark</Button> : null}
      <Button onClick={() => void navigator.clipboard.writeText(window.location.href)}>Copy share link</Button>
    </div>
  );
}
