import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Placeholder Component API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'text';
    const count = parseInt(searchParams.get('count') || '1');
    const width = searchParams.get('width') || '300';
    const height = searchParams.get('height') || '200';

    switch (type) {
      case 'text':
        return NextResponse.json(generatePlaceholderText(count));

      case 'image':
        // Return SVG placeholder image
        const svg = generatePlaceholderImage(parseInt(width), parseInt(height));
        return new NextResponse(svg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000'
          }
        });

      case 'avatar':
        const avatarSvg = generatePlaceholderAvatar(parseInt(width));
        return new NextResponse(avatarSvg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000'
          }
        });

      case 'chart':
        const chartData = generatePlaceholderChart(type);
        return NextResponse.json(chartData);

      case 'user':
        return NextResponse.json(generatePlaceholderUsers(count));

      case 'product':
        return NextResponse.json(generatePlaceholderProducts(count));

      case 'post':
        return NextResponse.json(generatePlaceholderPosts(count));

      default:
        return NextResponse.json({ 
          error: 'Invalid placeholder type',
          availableTypes: ['text', 'image', 'avatar', 'chart', 'user', 'product', 'post']
        }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generatePlaceholderText(count: number) {
  const sentences = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.'
  ];

  return {
    text: sentences.slice(0, count).join(' '),
    sentences: sentences.slice(0, count)
  };
}

function generatePlaceholderImage(width: number, height: number): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#e5e7eb"/>
  <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
    ${width} × ${height}
  </text>
</svg>`;
}

function generatePlaceholderAvatar(size: number): string {
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size/3}" fill="white" text-anchor="middle" dy=".3em">
    ?
  </text>
</svg>`;
}

function generatePlaceholderChart(chartType: string) {
  return {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Sample Data',
      data: [65, 59, 80, 81, 56, 55],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  };
}

function generatePlaceholderUsers(count: number) {
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  
  return Array(count).fill(0).map((_, i) => ({
    id: i + 1,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    email: `user${i + 1}@example.com`,
    avatar: `/api/tools/placeholder?type=avatar&width=100`,
    role: i % 2 === 0 ? 'Admin' : 'User',
    createdAt: new Date(Date.now() - i * 86400000).toISOString()
  }));
}

function generatePlaceholderProducts(count: number) {
  const products = ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 'Headphones', 'Speaker'];
  
  return Array(count).fill(0).map((_, i) => ({
    id: i + 1,
    name: `${products[i % products.length]} Pro ${i + 1}`,
    description: 'High-quality product with excellent features and performance.',
    price: Math.floor(Math.random() * 1000) + 100,
    category: i % 2 === 0 ? 'Electronics' : 'Accessories',
    image: `/api/tools/placeholder?type=image&width=400&height=300`,
    inStock: Math.random() > 0.3,
    rating: (Math.random() * 2 + 3).toFixed(1)
  }));
}

function generatePlaceholderPosts(count: number) {
  const titles = [
    'Getting Started with Next.js',
    'Understanding React Hooks',
    'Tailwind CSS Best Practices',
    'Building RESTful APIs',
    'Introduction to TypeScript',
    'Database Design Patterns',
    'Web Performance Optimization',
    'Security Best Practices'
  ];

  return Array(count).fill(0).map((_, i) => ({
    id: i + 1,
    title: titles[i % titles.length],
    excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    content: 'Full content of the post goes here with detailed information and examples.',
    author: `Author ${i + 1}`,
    image: `/api/tools/placeholder?type=image&width=800&height=400`,
    publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
    tags: ['Technology', 'Development', 'Tutorial']
  }));
}
