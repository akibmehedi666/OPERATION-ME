import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Operation ME',
    short_name: 'Op: ME',
    description: 'Personal mission control for Agent Akib',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0b0d11',
    theme_color: '#0b0d11',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'New Mission',
        short_name: 'Mission',
        description: 'Quickly deploy a new mission directive',
        url: '/?action=new-mission',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Planner',
        short_name: 'Planner',
        description: 'View weekly tactical schedule',
        url: '/?tab=planner',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
