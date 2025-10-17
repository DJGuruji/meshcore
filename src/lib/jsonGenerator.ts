// JSON Generator utility for creating default API responses

export interface JsonTemplate {
  name: string;
  description: string;
  template: any;
}

export const defaultJsonTemplates: JsonTemplate[] = [
  {
    name: 'Simple Message',
    description: 'Basic success message',
    template: {
      message: 'Success',
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'User Object',
    description: 'Sample user data',
    template: {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://via.placeholder.com/150',
      createdAt: new Date().toISOString(),
      isActive: true
    }
  },
  {
    name: 'User List',
    description: 'Array of users',
    template: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: 'https://via.placeholder.com/150'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        avatar: 'https://via.placeholder.com/150'
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        avatar: 'https://via.placeholder.com/150'
      }
    ]
  },
  {
    name: 'Product Object',
    description: 'Sample product data',
    template: {
      id: 1,
      name: 'Awesome Product',
      description: 'This is an awesome product that you will love',
      price: 99.99,
      currency: 'USD',
      category: 'Electronics',
      inStock: true,
      rating: 4.5,
      reviews: 127,
      images: [
        'https://via.placeholder.com/400x300',
        'https://via.placeholder.com/400x300'
      ],
      createdAt: new Date().toISOString()
    }
  },
  {
    name: 'Product List',
    description: 'Array of products',
    template: [
      {
        id: 1,
        name: 'Laptop',
        price: 999.99,
        category: 'Electronics',
        inStock: true
      },
      {
        id: 2,
        name: 'Smartphone',
        price: 699.99,
        category: 'Electronics',
        inStock: false
      },
      {
        id: 3,
        name: 'Headphones',
        price: 199.99,
        category: 'Audio',
        inStock: true
      }
    ]
  },
  {
    name: 'Paginated Response',
    description: 'Paginated data with metadata',
    template: {
      data: [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' },
        { id: 3, title: 'Item 3' }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false
      }
    }
  },
  {
    name: 'Error Response',
    description: 'Standard error format',
    template: {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input provided',
        details: [
          {
            field: 'email',
            message: 'Email is required'
          },
          {
            field: 'password',
            message: 'Password must be at least 8 characters'
          }
        ]
      },
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Auth Token',
    description: 'Authentication response',
    template: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'refresh_token_here',
      expiresIn: 3600,
      user: {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'user'
      }
    }
  },
  {
    name: 'Blog Post',
    description: 'Sample blog post data',
    template: {
      id: 1,
      title: 'Getting Started with APIs',
      slug: 'getting-started-with-apis',
      content: 'This is a comprehensive guide to understanding APIs...',
      excerpt: 'Learn the basics of API development and integration.',
      author: {
        id: 1,
        name: 'John Doe',
        avatar: 'https://via.placeholder.com/100'
      },
      tags: ['API', 'Development', 'Tutorial'],
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: true,
      viewCount: 1250
    }
  },
  {
    name: 'Order Object',
    description: 'E-commerce order data',
    template: {
      id: 'ORD-001',
      customerId: 123,
      status: 'pending',
      items: [
        {
          productId: 1,
          name: 'Laptop',
          quantity: 1,
          price: 999.99
        },
        {
          productId: 2,
          name: 'Mouse',
          quantity: 2,
          price: 29.99
        }
      ],
      subtotal: 1059.97,
      tax: 84.80,
      shipping: 15.00,
      total: 1159.77,
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      },
      createdAt: new Date().toISOString()
    }
  }
];

export function generateRandomJson(template: JsonTemplate): string {
  return JSON.stringify(template.template, null, 2);
}

export function getTemplateByName(name: string): JsonTemplate | undefined {
  return defaultJsonTemplates.find(template => template.name === name);
}
