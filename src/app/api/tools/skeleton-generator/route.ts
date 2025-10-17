import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// UI Skeleton Generator API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, count = 1, options = {} } = body;

    if (!type) {
      return NextResponse.json({ 
        error: 'Skeleton type is required',
        availableTypes: ['card', 'list', 'table', 'text', 'avatar', 'image', 'form']
      }, { status: 400 });
    }

    let skeletonCode = '';

    switch (type) {
      case 'card':
        skeletonCode = generateCardSkeleton(count, options);
        break;
      case 'list':
        skeletonCode = generateListSkeleton(count, options);
        break;
      case 'table':
        skeletonCode = generateTableSkeleton(options);
        break;
      case 'text':
        skeletonCode = generateTextSkeleton(count, options);
        break;
      case 'avatar':
        skeletonCode = generateAvatarSkeleton(count, options);
        break;
      case 'image':
        skeletonCode = generateImageSkeleton(count, options);
        break;
      case 'form':
        skeletonCode = generateFormSkeleton(options);
        break;
      default:
        return NextResponse.json({ 
          error: 'Invalid skeleton type',
          availableTypes: ['card', 'list', 'table', 'text', 'avatar', 'image', 'form']
        }, { status: 400 });
    }

    return NextResponse.json({
      type,
      count,
      code: skeletonCode,
      message: 'Skeleton code generated successfully'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateCardSkeleton(count: number, options: any): string {
  const cards = Array(count).fill(0).map((_, i) => `
  <div class="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div class="h-32 bg-gray-300 rounded mb-4"></div>
    <div class="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div class="h-4 bg-gray-300 rounded w-1/2"></div>
  </div>`).join('\n');

  return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${cards}\n</div>`;
}

function generateListSkeleton(count: number, options: any): string {
  const items = Array(count).fill(0).map((_, i) => `
  <div class="flex items-center space-x-4 p-4 animate-pulse">
    <div class="w-12 h-12 bg-gray-300 rounded-full"></div>
    <div class="flex-1 space-y-2">
      <div class="h-4 bg-gray-300 rounded w-3/4"></div>
      <div class="h-3 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>`).join('\n');

  return `<div class="divide-y divide-gray-200">${items}\n</div>`;
}

function generateTableSkeleton(options: any): string {
  const rows = options.rows || 5;
  const cols = options.columns || 4;

  const headerCells = Array(cols).fill(0).map(() => 
    '<th class="px-6 py-3"><div class="h-4 bg-gray-300 rounded"></div></th>'
  ).join('\n    ');

  const bodyRows = Array(rows).fill(0).map(() => {
    const cells = Array(cols).fill(0).map(() => 
      '<td class="px-6 py-4"><div class="h-4 bg-gray-300 rounded"></div></td>'
    ).join('\n      ');
    return `  <tr class="animate-pulse">\n      ${cells}\n  </tr>`;
  }).join('\n');

  return `<table class="min-w-full divide-y divide-gray-200">
  <thead class="bg-gray-50 animate-pulse">
    <tr>
    ${headerCells}
    </tr>
  </thead>
  <tbody class="bg-white divide-y divide-gray-200">
${bodyRows}
  </tbody>
</table>`;
}

function generateTextSkeleton(count: number, options: any): string {
  const lines = Array(count).fill(0).map((_, i) => {
    const width = i === count - 1 ? 'w-2/3' : 'w-full';
    return `  <div class="h-4 bg-gray-300 rounded ${width} mb-2"></div>`;
  }).join('\n');

  return `<div class="animate-pulse space-y-2">\n${lines}\n</div>`;
}

function generateAvatarSkeleton(count: number, options: any): string {
  const size = options.size || 'w-12 h-12';
  const avatars = Array(count).fill(0).map(() => 
    `  <div class="${size} bg-gray-300 rounded-full"></div>`
  ).join('\n');

  return `<div class="flex space-x-2 animate-pulse">\n${avatars}\n</div>`;
}

function generateImageSkeleton(count: number, options: any): string {
  const aspectRatio = options.aspectRatio || 'aspect-video';
  const images = Array(count).fill(0).map(() => 
    `  <div class="bg-gray-300 rounded ${aspectRatio}"></div>`
  ).join('\n');

  return `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">\n${images}\n</div>`;
}

function generateFormSkeleton(options: any): string {
  const fields = options.fields || 4;
  const formFields = Array(fields).fill(0).map((_, i) => `
  <div class="mb-4">
    <div class="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
    <div class="h-10 bg-gray-300 rounded"></div>
  </div>`).join('\n');

  return `<div class="animate-pulse">${formFields}
  <div class="h-10 bg-gray-300 rounded w-1/3 mt-6"></div>
</div>`;
}
