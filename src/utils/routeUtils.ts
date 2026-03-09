// Generate breadcrumb data for current route
export const generateBreadcrumbs = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Home', path: '/' }];

  if (parts.length === 0) return breadcrumbs;

  // Handle different route patterns
  if (parts[0] === 'search') {
    breadcrumbs.push({ label: 'Search', path: '/search' });
  } else if (parts[0] === 'admin') {
    breadcrumbs.push({ label: 'Admin', path: '/admin' });

    if (parts[1] === 'files') {
      breadcrumbs.push({ label: 'Files', path: '/admin/files' });
    } else if (parts[1] === 'edit') {
      breadcrumbs.push({ label: 'Files', path: '/admin/files' });
      const filePath = parts.slice(2).join('/');
      if (filePath) {
        breadcrumbs.push({ label: 'Edit', path: `/admin/edit/${filePath}` });
      }
    } else if (parts[1] === 'settings') {
      breadcrumbs.push({ label: 'Settings', path: '/admin/settings' });
    }
  }

  return breadcrumbs;
};

// Check if current route is admin route
export const isAdminRoute = (pathname: string): boolean => {
  return pathname.startsWith('/admin');
};

// Get route metadata for SEO
export const getRouteMetadata = (pathname: string) => {
  const defaultMeta = {
    title: 'Vector',
    description: 'Vector knowledge base',
    keywords: ['vector', 'knowledge', 'documents']
  };

  if (pathname === '/') {
    return defaultMeta;
  }

  if (pathname === '/search') {
    return {
      title: 'Search - Vector',
      description: 'Search through the collection',
      keywords: [...defaultMeta.keywords, 'search']
    };
  }

  if (pathname.startsWith('/admin')) {
    return {
      title: 'Admin - Vector',
      description: 'Administrative interface',
      keywords: [...defaultMeta.keywords, 'admin']
    };
  }

  return defaultMeta;
};
