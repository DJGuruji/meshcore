// JSON Generator utility for creating default API responses

export interface JsonTemplate {
  name: string;
  description: string;
  template: any;
}

export interface EndpointFieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
  nestedFields?: EndpointFieldDefinition[];
  arrayItemType?: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

// Helper function to generate user data
const generateUsers = (count: number) => {
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Rose', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zack', 'Amy', 'Ben', 'Chloe', 'David', 'Emma', 'Felix', 'Gina', 'Hugo', 'Iris', 'James', 'Kelly', 'Liam', 'Maya', 'Nick', 'Oscar', 'Paula', 'Rachel', 'Steve', 'Tara', 'Ursula', 'Vince', 'Zoe'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@example.com`,
    avatar: `https://picsum.photos/seed/user${i + 1}/150/150`
  }));
};

// Helper function to generate product data
const generateProducts = (count: number) => {
  const products = ['Laptop', 'Smartphone', 'Headphones', 'Tablet', 'Smartwatch', 'Camera', 'Speaker', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Router', 'Hard Drive', 'SSD', 'RAM', 'Graphics Card', 'Motherboard', 'CPU', 'Power Supply', 'Case', 'Webcam', 'Microphone', 'Charger', 'Cable', 'Adapter', 'Hub', 'Dock', 'Stand', 'Bag', 'Sleeve', 'Screen Protector', 'Case Cover', 'Stylus', 'Earbuds', 'Gaming Console', 'Controller', 'VR Headset', 'Drone', 'Action Camera', 'Tripod', 'Gimbal', 'Light Ring', 'Projector', 'TV', 'Soundbar', 'Receiver', 'Turntable', 'Vinyl', 'CD Player', 'Radio'];
  const categories = ['Electronics', 'Audio', 'Computing', 'Gaming', 'Photography', 'Accessories', 'Home Entertainment', 'Networking', 'Storage', 'Components'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: products[i % products.length],
    price: parseFloat((Math.random() * 1000 + 50).toFixed(2)),
    category: categories[i % categories.length],
    inStock: i % 3 !== 0
  }));
};

// Helper function to generate blog posts
const generateBlogPosts = (count: number) => {
  const titles = ['Getting Started with APIs', 'Advanced JavaScript Techniques', 'Building Scalable Applications', 'Understanding Database Design', 'Modern Web Development', 'Cloud Computing Essentials', 'Cybersecurity Best Practices', 'Machine Learning Basics', 'DevOps Fundamentals', 'Mobile App Development', 'UI/UX Design Principles', 'Agile Methodology', 'Microservices Architecture', 'Containerization with Docker', 'Kubernetes for Beginners', 'GraphQL vs REST', 'Serverless Computing', 'Progressive Web Apps', 'React Performance Optimization', 'Vue.js Deep Dive', 'Angular Best Practices', 'Node.js Scalability', 'Python for Data Science', 'Go Programming Guide', 'Rust Language Tutorial', 'TypeScript Mastery', 'Testing Strategies', 'CI/CD Pipelines', 'Git Workflow', 'Code Review Tips', 'Debugging Techniques', 'Performance Monitoring', 'API Security', 'OAuth Implementation', 'JWT Authentication', 'WebSockets Real-time', 'GraphQL Subscriptions', 'Redis Caching', 'MongoDB Optimization', 'PostgreSQL Advanced', 'MySQL Performance', 'SQL vs NoSQL', 'Blockchain Basics', 'Smart Contracts', 'Web3 Development', 'NFT Creation', 'DeFi Explained', 'Crypto Trading Bots', 'AI Ethics', 'Quantum Computing'];
  const authors = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'];
  const tags = [['API', 'Development', 'Tutorial'], ['JavaScript', 'Programming'], ['Architecture', 'Scalability'], ['Database', 'Design'], ['Web', 'Frontend'], ['Cloud', 'AWS'], ['Security', 'Best Practices'], ['AI', 'ML'], ['DevOps', 'Automation'], ['Mobile', 'iOS', 'Android']];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: titles[i % titles.length],
    slug: titles[i % titles.length].toLowerCase().replace(/\s+/g, '-'),
    excerpt: `Learn about ${titles[i % titles.length].toLowerCase()} in this comprehensive guide.`,
    author: {
      id: (i % authors.length) + 1,
      name: authors[i % authors.length],
      avatar: `https://picsum.photos/seed/author${(i % authors.length) + 1}/100/100`
    },
    tags: tags[i % tags.length],
    publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    viewCount: Math.floor(Math.random() * 10000)
  }));
};

// Helper function to generate products with images
const generateProductsWithImages = (count: number) => {
  const products = ['Laptop', 'Smartphone', 'Headphones', 'Tablet', 'Smartwatch', 'Camera', 'Speaker', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Router', 'Hard Drive', 'SSD', 'RAM', 'Graphics Card', 'Motherboard', 'CPU', 'Power Supply', 'Case', 'Webcam', 'Microphone', 'Charger', 'Cable', 'Adapter', 'Hub', 'Dock', 'Stand', 'Bag', 'Sleeve', 'Screen Protector', 'Case Cover', 'Stylus', 'Earbuds', 'Gaming Console', 'Controller', 'VR Headset', 'Drone', 'Action Camera', 'Tripod', 'Gimbal', 'Light Ring', 'Projector', 'TV', 'Soundbar', 'Receiver', 'Turntable', 'Vinyl', 'CD Player', 'Radio'];
  const categories = ['Electronics', 'Audio', 'Computing', 'Gaming', 'Photography', 'Accessories', 'Home Entertainment', 'Networking', 'Storage', 'Components'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: products[i % products.length],
    description: `High-quality ${products[i % products.length].toLowerCase()} with advanced features and excellent performance.`,
    price: parseFloat((Math.random() * 1000 + 50).toFixed(2)),
    currency: 'USD',
    category: categories[i % categories.length],
    inStock: i % 3 !== 0,
    rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
    reviews: Math.floor(Math.random() * 500),
    image: `https://picsum.photos/seed/product${i + 1}/400/300`,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

export const defaultJsonTemplates: JsonTemplate[] = [
  {
    name: 'User List',
    description: 'Array of 50 users',
    template: generateUsers(50)
  },
  {
    name: 'Product List',
    description: 'Array of 50 products',
    template: generateProducts(50)
  },
  {
    name: 'Blog List',
    description: 'Array of 50 blog posts',
    template: generateBlogPosts(50)
  },
  {
    name: 'Product List with Image',
    description: 'Array of 50 products with detailed images',
    template: generateProductsWithImages(50)
  }
];

export function generateRandomJson(template: JsonTemplate): string {
  return JSON.stringify(template.template, null, 2);
}

export function getTemplateByName(name: string): JsonTemplate | undefined {
  return defaultJsonTemplates.find(template => template.name === name);
}

const inferStringSample = (fieldName: string): string => {
  const normalized = fieldName.toLowerCase();
  if (normalized.includes('email')) {
    return 'user@example.com';
  }
  if (normalized.includes('phone')) {
    return '+1234567890';
  }
  if (normalized.includes('name')) {
    return 'Sample Name';
  }
  if (normalized.includes('status')) {
    return 'active';
  }
  return `sample ${fieldName}`;
};

const inferNumberSample = (fieldName: string): number => {
  const normalized = fieldName.toLowerCase();
  if (normalized.includes('age')) {
    return 25;
  }
  if (normalized.includes('price')) {
    return 9.99;
  }
  if (normalized.includes('count') || normalized.includes('total')) {
    return 1;
  }
  if (normalized.includes('id')) {
    return 1;
  }
  return 0;
};

const buildObjectFromFieldsInternal = (fields: EndpointFieldDefinition[] = []): Record<string, any> => {
  const obj: Record<string, any> = {};

  fields.forEach((field) => {
    obj[field.name] = getSampleValueForField(field);
  });

  return obj;
};

const getSampleValueForField = (field: EndpointFieldDefinition): any => {
  switch (field.type) {
    case 'string':
      return inferStringSample(field.name);
    case 'number':
      return inferNumberSample(field.name);
    case 'boolean':
      return true;
    case 'object': {
      const nested = field.nestedFields || [];
      if (nested.length === 0) {
        return {};
      }
      return buildObjectFromFieldsInternal(nested);
    }
    case 'array': {
      const itemType = field.arrayItemType || 'string';

      if (itemType === 'object') {
        return [buildObjectFromFieldsInternal(field.nestedFields || [])];
      }

      if (itemType === 'number') {
        return [inferNumberSample(field.name)];
      }

      if (itemType === 'boolean') {
        return [true];
      }

      if (itemType === 'array') {
        return [[]];
      }

      return [inferStringSample(field.name)];
    }
    default:
      return `sample ${field.name}`;
  }
};

export function buildSampleObjectFromFields(
  fields: EndpointFieldDefinition[] = [],
  options?: { includeMeta?: boolean }
): Record<string, any> {
  const objectFromFields = buildObjectFromFieldsInternal(fields);

  if (options?.includeMeta) {
    if (!('id' in objectFromFields)) {
      objectFromFields.id = 1;
    }
    if (!('createdAt' in objectFromFields)) {
      objectFromFields.createdAt = new Date().toISOString();
    }
  }

  return objectFromFields;
}

// Function to generate JSON response based on endpoint fields
export function generateJsonFromFields(fields: EndpointFieldDefinition[] | undefined): string {
  if (!fields || fields.length === 0) {
    return '{"message": "Hello World"}';
  }

  const responseObject = buildSampleObjectFromFields(fields, { includeMeta: true });

  return JSON.stringify(responseObject, null, 2);
}
