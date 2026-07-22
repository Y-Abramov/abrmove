import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://abrmove.ru';

// Относительная ссылка новости → абсолютный URL.
const toAbsolute = (link?: string): string =>
  !link ? SITE
  : /^https?:\/\//i.test(link) ? link
  : SITE + (link.startsWith('/') ? '' : '/') + link;

// Формат news.json — обёртка {"news":[...]} со старыми ключами (body/url,
// дата yyyy-MM-dd). Так его читают И установленные сборки AbrModules (ждут
// news-обёртку + body/url), И новые (NewsFeed.Parse понимает оба формата:
// summary??body, link??url, массив-или-обёртка). Голый массив с summary/link
// выпущенные сборки 1.5.0 НЕ парсят - новости пропадают.
export const GET: APIRoute = async () => {
  const items = await getCollection('news', ({ data }) => !data.draft);
  const news = items
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((item) => ({
      id: item.id,
      date: item.data.date.toISOString().slice(0, 10), // yyyy-MM-dd
      title: item.data.title,
      body: item.data.summary,
      url: toAbsolute(item.data.link),
    }));

  return new Response(JSON.stringify({ news }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
