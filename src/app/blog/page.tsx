'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { useState } from 'react';

export const metadata: Metadata = {
  title: 'API Development Blog - Tutorials, Best Practices & Insights',
  description: 'Expert guides, tutorials, and best practices for building, testing, and scaling modern APIs. Learn about mock servers, API testing, GraphQL, security, and more.',
  keywords: ['API development', 'API testing', 'mock server', 'REST API', 'GraphQL', 'API security', 'API design', 'developer tutorials'],
  openGraph: {
    title: 'API Development Blog - Expert Guides & Tutorials',
    description: 'Learn API development best practices, testing strategies, and modern techniques from industry experts.',
  },
};

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  author: string;
  tags: string[];
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Building Mock APIs: A Complete Guide for Frontend Developers',
    excerpt: 'Learn how to create realistic mock APIs that accelerate frontend development without waiting for backend teams. Includes best practices, common pitfalls, and real-world examples.',
    date: '2024-12-15',
    readTime: '8 min read',
    category: 'Tutorial',
    author: 'AnyTimeRequest Team',
    tags: ['mock server', 'API development', 'frontend', 'testing']
  },
  {
    id: '2',
    title: 'API Testing Best Practices: From Basics to Advanced',
    excerpt: 'Master API testing with our comprehensive guide covering HTTP methods, authentication flows, error handling, and performance testing strategies.',
    date: '2024-12-10',
    readTime: '12 min read',
    category: 'Best Practices',
    author: 'AnyTimeRequest Team',
    tags: ['API testing', 'REST API', 'quality assurance', 'automation']
  },
  {
    id: '3',
    title: 'GraphQL vs REST: When to Use Each for Your API',
    excerpt: 'Understand the key differences between GraphQL and REST APIs, their strengths, weaknesses, and how to choose the right approach for your project.',
    date: '2024-12-05',
    readTime: '10 min read',
    category: 'Comparison',
    author: 'AnyTimeRequest Team',
    tags: ['GraphQL', 'REST', 'API design', 'architecture']
  },
  {
    id: '4',
    title: 'Accelerating Development with Mock Servers',
    excerpt: 'Discover how mock servers can reduce development time by 40% and enable true parallel development between frontend and backend teams.',
    date: '2024-11-28',
    readTime: '6 min read',
    category: 'Productivity',
    author: 'AnyTimeRequest Team',
    tags: ['mock server', 'productivity', 'team collaboration', 'agile']
  },
  {
    id: '5',
    title: 'Securing Your APIs: Authentication and Authorization Patterns',
    excerpt: 'Explore modern API security patterns including JWT, OAuth 2.0, API keys, and best practices for implementing authentication in your applications.',
    date: '2024-11-20',
    readTime: '15 min read',
    category: 'Security',
    author: 'AnyTimeRequest Team',
    tags: ['security', 'authentication', 'JWT', 'OAuth']
  },
  {
    id: '6',
    title: 'API Design Principles: Creating Developer-Friendly Endpoints',
    excerpt: 'Learn the fundamental principles of API design that make your endpoints intuitive, consistent, and a joy for developers to work with.',
    date: '2024-11-15',
    readTime: '9 min read',
    category: 'Design',
    author: 'AnyTimeRequest Team',
    tags: ['API design', 'REST', 'developer experience', 'best practices']
  }
];

const categories = ['All', 'Tutorial', 'Best Practices', 'Comparison', 'Productivity', 'Security', 'Design'];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712]">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[160px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.4em] text-indigo-200 mb-6">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-orange-400" />
            Knowledge Hub
          </div>
          <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl mb-6">
            API Development <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-orange-300 bg-clip-text text-transparent">Insights</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-slate-300 sm:text-xl">
            Expert guides, tutorials, and best practices for building, testing, and scaling modern APIs
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search articles, topics, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder-slate-400 backdrop-blur-xl transition-all duration-300 focus:border-indigo-400/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <svg 
              className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 scale-105'
                    : 'border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white hover:scale-105'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) => (
            <article
              key={post.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_25px_60px_rgba(15,23,42,0.7)] hover:-translate-y-2"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 opacity-0 transition-opacity duration-500 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 group-hover:opacity-100" />
              
              <div className="relative z-10">
                {/* Category Badge */}
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/20 transition-all duration-300 group-hover:bg-indigo-500/20 group-hover:ring-indigo-500/40">
                  {post.category}
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-3 transition-colors duration-300 group-hover:text-indigo-300">
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="text-sm text-slate-300 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-400 transition-all duration-300 group-hover:bg-white/10 group-hover:text-indigo-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {post.readTime}
                    </span>
                  </div>
                  
                  {/* Read More Arrow */}
                  <div className="flex items-center gap-1 text-indigo-300 transition-all duration-300 group-hover:gap-2 group-hover:text-indigo-200">
                    <span className="text-xs font-semibold">Read</span>
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Shine Effect on Hover */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            </article>
          ))}
        </div>

        {/* No Results */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
            <p className="text-slate-400">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-20 rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900/60 p-12 text-center shadow-[0_25px_80px_rgba(2,6,23,0.9)] backdrop-blur-xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Build Better APIs?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-300 mb-8">
            Join thousands of developers using AnyTimeRequest to create mock servers, test APIs, and ship faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-blue-500 hover:to-indigo-600 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Get Started Free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-700 bg-gray-800/50 px-8 py-3 text-base font-semibold text-gray-200 backdrop-blur-sm transition-all duration-300 hover:border-blue-400/40 hover:bg-gray-800/70 hover:text-white hover:-translate-y-0.5"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
