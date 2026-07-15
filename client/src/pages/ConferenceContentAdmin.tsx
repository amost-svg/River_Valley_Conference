import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, ExternalLink, FileText, Newspaper, Save, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { useToast } from "@/hooks/use-toast";
import { getRvcUserContext } from "@/lib/supabaseAuth";
import { deleteRows, getCurrentUserId, insertRows, memberSelect, updateRows } from "@/lib/rvcData";
import { queryClient } from "@/lib/queryClient";

interface UserContext {
  role: string;
  isSuperAdmin: boolean;
}

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  category: string | null;
  image_path: string | null;
  pdf_path: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

interface ConferenceDocument {
  id: string;
  title: string;
  category: string;
  external_url: string | null;
  visibility: string;
  status: string;
  updated_at: string;
}

interface ContentData {
  news: NewsItem[];
  documents: ConferenceDocument[];
}

const controlClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-conference-navy focus:outline-none focus:ring-2 focus:ring-conference-navy/20";

function slugify(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `conference-update-${Date.now()}`;
}

function formatDate(value: string | null) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

async function loadContentData(): Promise<ContentData> {
  const user = await getRvcUserContext() as UserContext | null;
  if (!user) throw new Error("Please sign in to manage conference content.");
  const canManageContent = user.isSuperAdmin || ["SuperAdmin", "conference_admin", "conference_official", "press_editor"].includes(user.role);
  if (!canManageContent) throw new Error("Conference administrator, official, or communications access is required.");

  const [news, documents] = await Promise.all([
    memberSelect<NewsItem[]>(
      "news_items?select=id,title,slug,excerpt,body,category,image_path,pdf_path,status,published_at,created_at&order=created_at.desc",
    ),
    memberSelect<ConferenceDocument[]>(
      "conference_documents?select=id,title,category,external_url,visibility,status,updated_at&order=category.asc,title.asc",
    ),
  ]);

  return { news, documents };
}

export default function ConferenceContentAdmin() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Conference Update");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [supportingUrl, setSupportingUrl] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentCategory, setDocumentCategory] = useState("Rules & Operations");
  const [documentUrl, setDocumentUrl] = useState("");
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["rvc-content-admin"],
    queryFn: loadContentData,
    staleTime: 15_000,
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["rvc-content-admin"] }),
      queryClient.invalidateQueries({ queryKey: ["public-news-items"] }),
      queryClient.invalidateQueries({ queryKey: ["rvc-source-of-truth-admin"] }),
    ]);
  };

  const run = async (work: () => Promise<unknown>, success: string) => {
    try {
      await work();
      await refresh();
      toast({ title: success });
    } catch (actionError) {
      toast({
        title: "The content could not be updated",
        description: actionError instanceof Error ? actionError.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveNews = async (publish: boolean) => {
    if (!title.trim() || !excerpt.trim() || !body.trim()) {
      throw new Error("A public announcement needs a headline, summary, and full story.");
    }
    const authorId = await getCurrentUserId();
    const publishedAt = publish ? new Date().toISOString() : null;
    await insertRows("news_items", {
      title: title.trim(),
      slug: `${slugify(title)}-${Date.now().toString().slice(-6)}`,
      excerpt: excerpt.trim(),
      body: body.trim(),
      category: category.trim() || "Conference Update",
      image_path: imageUrl.trim() || null,
      pdf_path: supportingUrl.trim() || null,
      author_id: authorId,
      status: publish ? "published" : "draft",
      published_at: publishedAt,
    });
    setTitle("");
    setExcerpt("");
    setBody("");
    setImageUrl("");
    setSupportingUrl("");
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 p-10 text-center text-slate-600">Loading news and resources…</div>;
  if (error || !data) return <div className="min-h-screen bg-slate-50 p-10 text-center text-red-700">{error instanceof Error ? error.message : "Content management is unavailable."}</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo title="RVC News and Resources" description="Private River Valley Conference news and resource management." type="website" />
      <header className="bg-conference-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-9 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-conference-gold"><Newspaper className="h-4 w-4" /> RVC Admin Domain</div>
            <h1 className="mt-2 text-3xl font-bold">News and Conference Resources</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">Write public conference communication here. Rules and operations resources remain inside the authenticated RVC domain.</p>
          </div>
          <Link href="/conference-admin"><Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10"><ArrowLeft className="mr-2 h-4 w-4" /> Admin home</Button></Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-conference-navy text-white"><Newspaper className="h-5 w-5" /></div>
            <div><h2 className="text-xl font-bold text-slate-950">Write a public announcement</h2><p className="mt-1 text-sm text-slate-600">Use this for conference statements, event recaps, schedule announcements, features, and complete recognition stories—not individual certificates.</p></div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Headline<input className={`${controlClass} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="text-sm font-semibold text-slate-700">Category<input className={`${controlClass} mt-1`} value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Conference Update, Athletics, Academics…" /></label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">Homepage summary<textarea className={`${controlClass} mt-1`} rows={3} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="Two or three sentences explaining why this matters." /></label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">Full story<textarea className={`${controlClass} mt-1`} rows={8} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write the complete public-facing conference communication." /></label>
            <label className="text-sm font-semibold text-slate-700">Optional image URL<input className={`${controlClass} mt-1`} type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} /></label>
            <label className="text-sm font-semibold text-slate-700">Optional supporting link<input className={`${controlClass} mt-1`} type="url" value={supportingUrl} onChange={(event) => setSupportingUrl(event.target.value)} placeholder="A release, registration page, or official document" /></label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void run(() => saveNews(false), "Draft saved")}><Save className="mr-2 h-4 w-4" /> Save draft</Button>
            <Button onClick={() => void run(() => saveNews(true), "Announcement published") }><Send className="mr-2 h-4 w-4" /> Publish announcement</Button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4"><h2 className="font-bold text-slate-950">News queue</h2></div>
          <div className="divide-y divide-slate-200">
            {data.news.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-950">{item.title}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{item.status}</span></div><p className="mt-1 text-sm text-slate-600">{item.excerpt}</p><p className="mt-1 text-xs text-slate-500">{item.category ?? "Conference"} · {formatDate(item.published_at ?? item.created_at)}</p></div>
                <div className="flex flex-wrap gap-2">
                  {item.status === "published" ? (
                    <Button variant="outline" size="sm" onClick={() => void run(() => updateRows("news_items", `id=eq.${item.id}`, { status: "draft", published_at: null }), "Announcement returned to draft")}>Unpublish</Button>
                  ) : (
                    <Button size="sm" onClick={() => void run(() => updateRows("news_items", `id=eq.${item.id}`, { status: "published", published_at: new Date().toISOString() }), "Announcement published")}>Publish</Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => void run(() => deleteRows("news_items", `id=eq.${item.id}`), "Announcement deleted")}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {!data.news.length && <div className="px-6 py-10 text-center text-sm text-slate-600">No news stories are currently saved. The public site will show a neutral empty state until an actual conference announcement is published.</div>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white"><BookOpen className="h-5 w-5" /></div>
            <div><h2 className="text-xl font-bold text-slate-950">Rules and conference resources</h2><p className="mt-1 text-sm text-slate-600">These links stay inside the authenticated RVC domain. A database safeguard prevents them from being exposed through the public website.</p></div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px_1fr_auto] md:items-end">
            <label className="text-sm font-semibold text-slate-700">Title<input className={`${controlClass} mt-1`} value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} /></label>
            <label className="text-sm font-semibold text-slate-700">Category<input className={`${controlClass} mt-1`} value={documentCategory} onChange={(event) => setDocumentCategory(event.target.value)} /></label>
            <label className="text-sm font-semibold text-slate-700">Google Drive or resource URL<input className={`${controlClass} mt-1`} type="url" value={documentUrl} onChange={(event) => setDocumentUrl(event.target.value)} /></label>
            <Button onClick={() => void run(async () => {
              if (!documentTitle.trim() || !documentUrl.trim()) throw new Error("Enter a title and resource URL.");
              await insertRows("conference_documents", {
                title: documentTitle.trim(),
                category: documentCategory.trim() || "Rules & Operations",
                storage_path: `external/admin/${crypto.randomUUID()}`,
                external_url: documentUrl.trim(),
                source_name: "RVC Admin Domain",
                visibility: "members",
                status: "published",
                published_at: new Date().toISOString(),
              });
              setDocumentTitle("");
              setDocumentUrl("");
            }, "Internal resource added")}><FileText className="mr-2 h-4 w-4" /> Add</Button>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100"><tr><th className="px-4 py-3 text-left">Resource</th><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-left">Access</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-200">
                {data.documents.map((document) => (
                  <tr key={document.id}>
                    <td className="px-4 py-3 font-semibold text-slate-950">{document.title}</td>
                    <td className="px-4 py-3 text-slate-600">{document.category}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">Authenticated RVC domain</span></td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-2">{document.external_url && <a href={document.external_url} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" /></Button></a>}<Button variant="destructive" size="sm" onClick={() => void run(() => deleteRows("conference_documents", `id=eq.${document.id}`), "Resource removed")}><Trash2 className="h-4 w-4" /></Button></div></td>
                  </tr>
                ))}
                {!data.documents.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-600">No conference resources are loaded.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
