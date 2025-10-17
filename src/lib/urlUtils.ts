// Utility functions for generating API URLs

export function generateProjectSlug(projectName: string): string {
  return projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

export function generateEndpointUrl(projectName: string, baseUrl: string, endpointPath: string): string {
  const baseUrlFromEnv = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const projectSlug = generateProjectSlug(projectName);
  
  // Ensure paths start with /
  const cleanBaseUrl = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  const cleanEndpointPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  
  return `${baseUrlFromEnv}/api/fake/${projectSlug}${cleanBaseUrl}${cleanEndpointPath}`;
}

export function parseEndpointUrl(url: string): { projectSlug: string; baseUrl: string; endpointPath: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/api/fake/');
    
    if (pathParts.length < 2) return null;
    
    const remainingPath = pathParts[1];
    const segments = remainingPath.split('/');
    
    if (segments.length < 2) return null;
    
    const projectSlug = segments[0];
    const restPath = '/' + segments.slice(1).join('/');
    
    // This is a simplified parser - in a real app you might need more sophisticated parsing
    // based on your baseUrl patterns
    
    return {
      projectSlug,
      baseUrl: '', // Would need more logic to extract baseUrl vs endpointPath
      endpointPath: restPath
    };
  } catch {
    return null;
  }
}
