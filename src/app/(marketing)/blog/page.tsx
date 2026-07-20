import Link from 'next/link';
import { blogPosts } from '@/content/blog';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Blog',
  description:
    'Plain writing on AI compliance: how to classify systems under the EU AI Act, why audit logs matter, and what we learn building AgentProof.',
  path: '/blog'
});

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(iso));
}

export default function BlogPage() {
  const posts = [...blogPosts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Blog</h1>
      <p className='text-muted-foreground mt-4 text-lg text-pretty'>
        Notes on AI compliance from the team building AgentProof. We keep it practical and skip the
        hype.
      </p>

      <div className='mt-10 space-y-4'>
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className='border-border hover:border-foreground/20 hover:bg-muted/40 block rounded-xl border p-6 transition-colors'
          >
            <article>
              <h2 className='text-xl font-medium'>{post.title}</h2>
              <p className='text-muted-foreground mt-2 text-sm'>{post.description}</p>
              <p className='text-muted-foreground mt-4 text-xs'>
                <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.author} ·{' '}
                {post.readingMinutes} min read
              </p>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
