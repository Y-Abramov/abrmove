import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const items = await getCollection('news', ({ data }) => !data.draft);
  const payload = items
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((item) => ({
      title: item.data.title,
      date: item.data.date.toISOString(),
      summary: item.data.summary,
      link: item.data.link ?? null,
    }));

  return new Response(JSON.stringify(payload, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
