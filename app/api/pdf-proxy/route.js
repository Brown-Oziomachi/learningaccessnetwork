// app/api/pdf-proxy/route.js
export const runtime = "nodejs";

// Add the hosts your pdfUrl files live on (SSRF protection)
const ALLOWED_HOSTS = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "res.cloudinary.com",
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const url = searchParams.get("url");

  let target = null;
  if (id && /^[\w-]{20,}$/.test(id)) {
    target = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
  } else if (url) {
    try {
      const u = new URL(url);
      if (u.protocol === "https:" && ALLOWED_HOSTS.includes(u.hostname)) target = u.toString();
    } catch {}
  }
  if (!target) return new Response("Bad request", { status: 400 });

  const headers = {};
  const range = req.headers.get("range");
  if (range) headers.Range = range;

  const upstream = await fetch(target, { headers, redirect: "follow" });
  if (!upstream.ok && upstream.status !== 206) return new Response("Upstream error", { status: 502 });

  const out = new Headers();
  out.set("Content-Type", "application/pdf");
  out.set("Accept-Ranges", "bytes");
  for (const h of ["content-length", "content-range"]) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  out.set("Cache-Control", "public, max-age=3600");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}