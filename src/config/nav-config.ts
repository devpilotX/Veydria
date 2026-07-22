import { NavGroup } from '@/types';

/**
 * Sidebar and command palette navigation.
 *
 * Groups follow the five jobs of the product: see the estate on the dashboard,
 * govern it, assure it with tests and monitoring, prove it with documents and
 * the audit trail, then manage the workspace. Access rules hide items the
 * current member cannot use. Real enforcement happens server side.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        shortcut: ['d', 'd'],
        items: []
      }
    ]
  },
  {
    label: 'Govern',
    items: [
      {
        title: 'AI Systems',
        url: '/dashboard/systems',
        icon: 'shield',
        shortcut: ['s', 's'],
        items: []
      },
      {
        title: 'Agents',
        url: '/dashboard/agents',
        icon: 'robot',
        shortcut: ['a', 'a'],
        items: []
      },
      {
        title: 'Obligations',
        url: '/dashboard/obligations',
        icon: 'checklist',
        shortcut: ['o', 'o'],
        items: []
      },
      {
        title: 'Regulations',
        url: '/dashboard/regulations',
        icon: 'regulations',
        shortcut: ['r', 'r'],
        items: []
      }
    ]
  },
  {
    label: 'Assure',
    items: [
      {
        title: 'Evaluations',
        url: '/dashboard/evaluations',
        icon: 'gauge',
        shortcut: ['e', 'e'],
        items: []
      },
      {
        title: 'Monitoring',
        url: '/dashboard/monitoring',
        icon: 'activity',
        shortcut: ['m', 'm'],
        items: []
      },
      {
        title: 'Alerts',
        url: '/dashboard/alerts',
        icon: 'notification',
        shortcut: ['l', 'l'],
        items: []
      }
    ]
  },
  {
    label: 'Prove',
    items: [
      {
        title: 'Documents',
        url: '/dashboard/documents',
        icon: 'page',
        shortcut: ['c', 'c'],
        items: []
      },
      {
        title: 'Audit Log',
        url: '/dashboard/audit',
        icon: 'fingerprint',
        shortcut: ['g', 'g'],
        items: []
      }
    ]
  },
  {
    label: 'Workspace',
    items: [
      {
        title: 'Team',
        url: '/dashboard/team',
        icon: 'teams',
        items: [],
        access: { requireOrg: true }
      },
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: 'settings',
        items: []
      }
    ]
  }
];
