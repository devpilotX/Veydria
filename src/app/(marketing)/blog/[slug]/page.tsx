import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/marketing/json-ld';
import { blogPosts, getBlogPost } from '@/content/blog';
import { buildMetadata } from '@/lib/seo';

export function generateStaticParams(): { slug: string }[] {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) {
    return buildMetadata({
      title: 'Post not found',
      description: 'This post does not exist.',
      path: `/blog/${slug}`,
      noindex: true
    });
  }
  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.date,
    authors: [post.author]
  });
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(iso));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Person', name: post.author }
  };

  return (
    <article className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <JsonLd data={article} />

      <Link href='/blog' className='text-muted-foreground hover:text-foreground text-sm'>
        Back to blog
      </Link>

      <h1 className='mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl'>
        {post.title}
      </h1>
      <p className='text-muted-foreground mt-4 text-sm'>
        {post.author} · <time dateTime={post.date}>{formatDate(post.date)}</time> ·{' '}
        {post.readingMinutes} min read
      </p>

      <div className='mt-10'>
        {post.body.map((block, index) =>
          block.type === 'h2' ? (
            <h2 key={`h2-${index}`} className='mt-8 text-xl font-semibold'>
              {block.text}
            </h2>
          ) : (
            <p key={`p-${index}`} className='text-muted-foreground mt-4 leading-relaxed'>
              {block.text}
            </p>
          )
        )}
      </div>
    </article>
  );
}
