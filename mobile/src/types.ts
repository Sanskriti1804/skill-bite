export type ContentLabel = {
  name: string;
  slug: string;
};

export type ContentItem = {
  contentId: string;
  title: string;
  contentType: string;
  publishedAt?: string | null;
  categories?: ContentLabel[];
  tags?: ContentLabel[];
};

export type Lesson = {
  lessonId?: string;
  title: string;
  position: number;
  videoContentId: string;
};

export type Module = {
  moduleId?: string;
  title: string;
  position?: number;
  lessons: Lesson[];
};

export type Attachment = {
  attachmentId?: string;
  kind: string;
  reference: string;
};

export type ContentDetail = {
  contentId: string;
  title: string;
  description: string | null;
  contentType: string;
  status?: string;
  modules?: Module[];
  attachments?: Attachment[];
};

export type Category = {
  categoryId?: string;
  slug: string;
  name: string;
};

export type BookmarkItem = {
  contentId: string;
};

export type ProgressItem = {
  videoContentId: string;
  lastPositionSeconds: number;
  completedAt: string | null;
};

export type NotificationItem = {
  notificationId: string;
  title?: string | null;
  body?: string | null;
  readAt: string | null;
};

export type Me = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  accountStatus: string;
};
