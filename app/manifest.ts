import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return { name: 'PodScape Labs', short_name: 'PodScape', start_url: '/admin/preview', scope: '/', display: 'standalone', background_color: '#f2eee3', theme_color: '#f2eee3' };
}
