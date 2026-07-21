import { brand } from '@/config/brand';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Careers',
  description:
    'Join Veydria. We are a small team building one honest workflow for AI compliance. See our open roles.',
  path: '/careers'
});

const jobsEmail = `jobs@${brand.contact.sales.split('@')[1]}`;

type Role = {
  title: string;
  type: string;
  location: string;
  description: string;
};

const roles: Role[] = [
  {
    title: 'Founding Engineer',
    type: 'Full time',
    location: 'Remote (US and EU hours)',
    description:
      'Work across the stack on the product that runs the whole compliance loop. You will ship features end to end, from the Postgres schema to the screen, and help set the patterns the rest of the team builds on. We want someone who has taken a product to production and cares about the details users feel.'
  },
  {
    title: 'Compliance Lead',
    type: 'Full time',
    location: 'Remote (EU preferred)',
    description:
      'Own the mapping between regulations and the obligations we generate. You will turn the EU AI Act, the NIST AI RMF, and ISO 42001 into rules an engineer can build and an auditor can trust. Deep knowledge of AI regulation matters more than a legal title here.'
  },
  {
    title: 'Developer Advocate',
    type: 'Full time',
    location: 'Remote',
    description:
      'Help developers connect their agents and get value in an afternoon. You will write the docs and examples, build the SDK and MCP samples, and bring what you hear from users back to the team. Strong writing and real coding experience are both required.'
  },
  {
    title: 'Account Executive',
    type: 'Full time',
    location: 'Remote (US)',
    description:
      'Talk with teams that need to prove their AI is in order and help them decide whether we fit. You will run demos, scope proofs of concept, and close deals without overpromising. Experience selling technical products to engineering and risk buyers is a plus.'
  }
];

export default function CareersPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-16 sm:px-6'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Careers</h1>
      <p className='text-muted-foreground mt-4 text-lg text-pretty'>
        We are a small team building one workflow for AI compliance instead of a pile of tools. The
        work is close to real regulation and real production systems, and everyone here ships. If
        that sounds good, take a look at the open roles below.
      </p>

      <div className='mt-10 space-y-4'>
        {roles.map((role) => (
          <article key={role.title} className='border-border rounded-xl border p-6'>
            <h2 className='text-xl font-medium'>{role.title}</h2>
            <p className='text-muted-foreground mt-1 text-sm'>
              {role.type} · {role.location}
            </p>
            <p className='text-muted-foreground mt-3'>{role.description}</p>
            <a
              href={`mailto:${jobsEmail}?subject=${encodeURIComponent(`Application: ${role.title}`)}`}
              className='text-foreground mt-4 inline-block text-sm font-medium underline'
            >
              Apply for this role
            </a>
          </article>
        ))}
      </div>

      <p className='text-muted-foreground mt-10 text-sm'>
        Do not see your role but think you would be a good fit? Write to{' '}
        <a href={`mailto:${jobsEmail}`} className='text-foreground underline'>
          {jobsEmail}
        </a>{' '}
        and tell us what you want to work on.
      </p>
    </div>
  );
}
