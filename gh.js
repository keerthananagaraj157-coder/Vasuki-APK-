// Netlify Function: build proxy at /gh/*. Token stays secret in Netlify env vars.
const H = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"};
export default async (req) => {
  const env = process.env;
  if (req.method === "OPTIONS") return new Response(null, {headers: {...H, "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type"}});
  const url = new URL(req.url);
  const p = url.pathname.replace(/^\/gh/, "") + url.search;
  const base = `/repos/${env.GH_OWNER}/${env.GH_REPO}`;
  const ok = (req.method === "GET" && (p === "/user" || p.startsWith(base))) ||
             (req.method === "POST" && p.startsWith(base) && /\/git\/(blobs|trees|commits|refs)$/.test(p));
  if (!ok) return new Response("Forbidden", {status: 403, headers: H});
  if (p === "/user") return new Response(JSON.stringify({login: env.GH_OWNER}), {headers: H});
  const r = await fetch("https://api.github.com" + p, {
    method: req.method,
    headers: {"Authorization": "Bearer " + env.GH_TOKEN, "Accept": "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "vasuki-apk-proxy"},
    body: req.method === "POST" ? await req.text() : undefined });
  return new Response(await r.text(), {status: r.status, headers: H});
};
export const config = { path: "/gh/*" };
