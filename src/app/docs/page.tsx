import React from 'react';

const DocsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white" style={{ scrollPaddingTop: '5rem' }}>
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Developer Documentation
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Comprehensive guides and resources for developers working with our platform
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:col-span-1">
            <div className="sticky top-24 bg-slate-800/50 backdrop-blur rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-4 text-indigo-300">Documentation</h2>
              <ul className="space-y-2">
                <li>
                  <a href="#introduction" className="block py-2 px-4 rounded-lg hover:bg-white/5 transition">
                    Introduction
                  </a>
                </li>
                <li>
                  <a href="#mock-server" className="block py-2 px-4 rounded-lg hover:bg-white/5 transition">
                    Mock Server
                  </a>
                </li>
                <li>
                  <a href="#rest-api-tester" className="block py-2 px-4 rounded-lg hover:bg-white/5 transition">
                    REST API Tester
                  </a>
                </li>
                <li>
                  <a href="#graphql-tester" className="block py-2 px-4 rounded-lg hover:bg-white/5 transition">
                    GraphQL Tester
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Introduction Section */}
            <section id="introduction" className="mb-16 bg-slate-800/50 backdrop-blur rounded-2xl border border-white/10 p-8 pt-20">
              <h2 className="text-3xl font-bold mb-6 text-indigo-300">Introduction</h2>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-lg mb-6">
                  Welcome to our comprehensive developer platform designed to streamline your API development and testing workflow. Our suite of tools empowers developers to create, test, and debug APIs with unprecedented ease and efficiency.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-700/50 p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-semibold mb-3 text-purple-300">API Development Made Simple</h3>
                    <p>
                      Create realistic mock servers, test RESTful APIs, and debug GraphQL endpoints all within a single integrated environment. Our platform eliminates the complexity traditionally associated with API development and testing.
                    </p>
                  </div>
                  
                  <div className="bg-slate-700/50 p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-semibold mb-3 text-purple-300">Real-World Testing Scenarios</h3>
                    <p>
                      Simulate various network conditions, test edge cases, and validate your API responses with our robust testing tools. Ensure your applications work flawlessly in production environments.
                    </p>
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold mb-4 mt-8">Why Choose Our Platform?</h3>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 text-indigo-400">✓</div>
                    <span><strong>Cross-Origin Resource Sharing (CORS) Solutions:</strong> Seamlessly test localhost APIs without CORS restrictions using our WebSocket relay technology.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 text-indigo-400">✓</div>
                    <span><strong>JSON Data Handling:</strong> Effortlessly work with JSON payloads, validate structures, and transform data with our intuitive interface.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 text-indigo-400">✓</div>
                    <span><strong>Fake API Generation:</strong> Instantly create mock APIs with customizable responses for rapid prototyping and testing.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 text-indigo-400">✓</div>
                    <span><strong>Localhost API Testing:</strong> Test your locally hosted APIs securely without exposing them to the public internet.</span>
                  </li>
                </ul>
                
                <p>
                  Whether you're building a simple REST API or a complex GraphQL service, our platform provides all the tools you need to develop, test, and deploy with confidence. Dive into the specific sections below to learn how each tool can enhance your development workflow.
                </p>
              </div>
            </section>

            {/* Mock Server Section */}
            <section id="mock-server" className="mb-16 bg-slate-800/50 backdrop-blur rounded-2xl border border-white/10 p-8 pt-20">
              <h2 className="text-3xl font-bold mb-6 text-indigo-300">Mock Server</h2>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-lg mb-6">
                  Create realistic mock APIs instantly for testing and development purposes. Our mock server allows you to simulate backend services without writing any code, making it perfect for frontend development, testing, and prototyping.
                </p>
                
                <div className="bg-slate-700/50 p-6 rounded-xl border border-white/10 mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-purple-300">Key Benefits</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>Rapid prototyping without backend dependencies</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>Test different API responses and error scenarios</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>Work offline with simulated API endpoints</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>Collaborate with team members using shared mock APIs</span>
                    </li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold mb-4">Creating Static Content APIs</h3>
                <p className="mb-4">
                  For simple use cases, you can create static JSON responses that simulate real API endpoints. This is ideal for frontend developers who need to work with sample data.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Predefined Templates</h4>
                    <p className="mb-3">
                      Choose from a variety of predefined JSON templates for common use cases:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        User profiles and authentication responses
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Product catalogs and e-commerce data
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Blog posts and content management
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Analytics and reporting data
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Custom JSON</h4>
                    <p className="mb-3">
                      Paste your own JSON structure to create completely customized API responses:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Support for complex nested JSON structures
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Arrays, objects, and primitive data types
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Custom HTTP status codes and headers
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 mt-8">Complete CRUD API Generation</h3>
                <p className="mb-4">
                  For more advanced scenarios, generate a full CRUD (Create, Read, Update, Delete) API with persistent data storage. This simulates a real backend database with RESTful endpoints.
                </p>
                
                <div className="bg-slate-700/30 p-6 rounded-xl border border-white/10 mb-6">
                  <h4 className="text-xl font-semibold mb-4 text-indigo-300">Step-by-Step Process</h4>
                  
                  <div className="space-y-6">
                    <div className="flex">
                      <div className="mr-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold">1</div>
                      </div>
                      <div>
                        <h5 className="text-lg font-semibold mb-2">Create POST Endpoint</h5>
                        <p>
                          Start by defining your data model through a POST endpoint. This establishes the structure of your resources and enables data creation.
                        </p>
                        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg text-sm">
                          <p className="font-mono text-indigo-300">POST /api/mock/users</p>
                          <p className="mt-1 text-slate-400">Creates new user resources with automatic ID generation</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="mr-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold">2</div>
                      </div>
                      <div>
                        <h5 className="text-lg font-semibold mb-2">Generate GET Endpoint with Pagination</h5>
                        <p>
                          Create a GET endpoint to retrieve collections of resources with built-in pagination support.
                        </p>
                        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg text-sm">
                          <p className="font-mono text-indigo-300">GET /api/mock/users?page=1&limit=10</p>
                          <p className="mt-1 text-slate-400">Returns paginated results with metadata</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="mr-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold">3</div>
                      </div>
                      <div>
                        <h5 className="text-lg font-semibold mb-2">Add PUT Endpoint for Updates</h5>
                        <p>
                          Implement full resource updates with the PUT method.
                        </p>
                        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg text-sm">
                          <p className="font-mono text-indigo-300">PUT /api/mock/users/&#123;id&#125;</p>
                          <p className="mt-1 text-slate-400">Completely replaces a resource with new data</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="mr-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold">4</div>
                      </div>
                      <div>
                        <h5 className="text-lg font-semibold mb-2">Implement DELETE Endpoint</h5>
                        <p>
                          Enable resource deletion with the DELETE method.
                        </p>
                        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg text-sm">
                          <p className="font-mono text-indigo-300">DELETE /api/mock/users/&#123;id&#125;</p>
                          <p className="mt-1 text-slate-400">Permanently removes a resource</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 mt-8">Advanced Mock Server Features</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Dynamic Response Control</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Customizable HTTP status codes and response times</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Simulate network delays and timeouts</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Conditional responses based on request parameters</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Data Persistence</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>In-memory storage for session persistence</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Data export/import capabilities</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Reset and clear data functionality</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">SEO-Friendly Mock APIs</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Optimized JSON structures for search engines</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Schema.org integration for rich snippets</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Meta tags and structured data support</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Integration Capabilities</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>CORS-enabled endpoints for cross-origin requests</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>WebSocket support for real-time data</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Authentication simulation (JWT, OAuth, etc.)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-6 rounded-xl border border-indigo-400/30">
                  <h4 className="text-lg font-semibold mb-2 text-indigo-300">Perfect for SEO Testing</h4>
                  <p>
                    Our mock server is ideal for testing how search engines interpret your API responses. Create fake APIs with realistic data structures to see how Google and other search engines would index your content. Test JSON-LD structured data, meta tags, and other SEO elements without affecting your production environment.
                  </p>
                </div>
              </div>
            </section>

            {/* REST API Tester Section */}
            <section id="rest-api-tester" className="mb-16 bg-slate-800/50 backdrop-blur rounded-2xl border border-white/10 p-8 pt-20">
              <h2 className="text-3xl font-bold mb-6 text-indigo-300">REST API Tester</h2>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-lg mb-6">
                  A powerful and intuitive tool for testing RESTful APIs with comprehensive features for developers. Test any HTTP endpoint with full control over requests, headers, authentication, and response analysis.
                </p>
                
                <div className="bg-slate-700/50 p-6 rounded-xl border border-white/10 mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-purple-300">Key Features</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>All HTTP methods support (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>Advanced authentication options (Basic Auth, Bearer Token, API Keys)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>Comprehensive request body options (JSON, form data, raw text, binary)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>Real-time response analysis with syntax highlighting</span>
                    </li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold mb-4">Testing Localhost APIs</h3>
                <p className="mb-4">
                  Our REST API Tester seamlessly handles localhost API testing without CORS restrictions through our innovative WebSocket relay technology.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">WebSocket Relay Solution</h4>
                    <p className="mb-3">
                      Our secure WebSocket relay creates a tunnel between your localhost API and our testing environment, eliminating CORS issues:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        No need to modify your API code
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Works with any localhost server
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Enterprise-grade security
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Alternative Methods</h4>
                    <p className="mb-3">
                      For different development scenarios, you can also:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Add our domain to your API's allowed origins
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Use ngrok to make your localhost API publicly accessible
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Enable CORS in your development server
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 mt-8">Input Options</h3>
                <p className="mb-4">
                  Configure every aspect of your API request with our comprehensive input options:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Request Configuration</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Method Selection:</strong> Choose from all standard HTTP methods</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>URL Input:</strong> Full URL with protocol support (http/https)</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Query Parameters:</strong> Add key-value pairs for URL parameters</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Headers:</strong> Custom headers with key-value pairs</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Authentication:</strong> Basic Auth, Bearer Token, API Key options</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Request Body Options</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>None:</strong> For requests without body content</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Form Data:</strong> Key-value pairs for form submissions</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>JSON:</strong> Structured JSON data with validation</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Raw Text:</strong> Plain text or XML content</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Binary:</strong> File uploads and binary data</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 mt-8">Scripts & Automation</h3>
                <p className="mb-4">
                  Enhance your API testing workflow with pre-request and test scripts:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Pre-Request Scripts</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Set dynamic variables before sending requests</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Generate timestamps, random values, or UUIDs</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Modify request data based on conditions</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Access environment variables and global data</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Test Scripts</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Automatically validate API responses</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Check status codes, response times, and data structures</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Set test results and pass/fail conditions</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Log custom messages for debugging</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 mt-8">Output Analysis</h3>
                <p className="mb-4">
                  Comprehensive response analysis tools to understand and debug your API responses:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Response Body</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Syntax-highlighted JSON viewer</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Raw response data display</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Response size and timing information</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Response Headers</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Complete header key-value pairs</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Content-Type and authentication headers</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>CORS and caching information</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Response Info</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Status code with descriptive messages</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Response time measurement</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Data size in bytes</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 mt-8">Keyboard Shortcuts</h3>
                <p className="mb-4">
                  Work efficiently with our keyboard shortcut system:
                </p>
                
                <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10 mb-6">
                  <h4 className="text-lg font-semibold mb-3 text-indigo-300">Input Section Navigation</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="w-20 text-indigo-400">Alt + P</div>
                      <span>Switch to Params tab</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-20 text-indigo-400">Alt + H</div>
                      <span>Switch to Headers tab</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-20 text-indigo-400">Alt + B</div>
                      <span>Switch to Body tab</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-20 text-indigo-400">Alt + A</div>
                      <span>Switch to Auth tab</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-20 text-indigo-400">Alt + S</div>
                      <span>Switch to Scripts tab</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-20 text-indigo-400">Alt + T</div>
                      <span>Switch to Tests tab</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-5 rounded-xl border border-indigo-400/30">
                  <h4 className="text-lg font-semibold mb-2 text-indigo-300">Universal Shortcuts</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="w-32 text-indigo-400">Ctrl/Cmd + Enter</div>
                      <span>Send request</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-32 text-indigo-400">Enter (on URL field)</div>
                      <span>Send request</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* GraphQL Tester Section */}
            <section id="graphql-tester" className="mb-16 bg-slate-800/50 backdrop-blur rounded-2xl border border-white/10 p-8 pt-20">
              <h2 className="text-3xl font-bold mb-6 text-indigo-300">GraphQL Tester</h2>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-lg mb-6">
                  A specialized tool for testing GraphQL APIs with full schema introspection, query validation, and real-time execution capabilities. Perfect for developers working with GraphQL endpoints.
                </p>
                
                <div className="bg-slate-700/50 p-6 rounded-xl border border-white/10 mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-purple-300">Key Features</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>Full schema introspection and documentation explorer</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>Real-time query validation and syntax highlighting</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>Variable support with type checking</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 mr-3 text-indigo-400">•</div>
                      <span>Response visualization with collapsible nodes</span>
                    </li>
                  </ul>
                </div>

                <h3 className="text-2xl font-semibold mb-4">Testing Localhost GraphQL APIs</h3>
                <p className="mb-4">
                  Our GraphQL Tester seamlessly handles localhost GraphQL API testing without CORS restrictions through our WebSocket relay technology.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">WebSocket Relay Solution</h4>
                    <p className="mb-3">
                      Our secure WebSocket relay creates a tunnel between your localhost GraphQL API and our testing environment:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        No need to modify your GraphQL schema
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Works with Apollo Server, Express GraphQL, and more
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Automatic schema introspection
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Alternative Methods</h4>
                    <p className="mb-3">
                      For different development scenarios, you can also:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Add our domain to your GraphQL server's allowed origins
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Use ngrok to make your localhost GraphQL API publicly accessible
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                        Enable CORS in your development server
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 mt-8">Input Options</h3>
                <p className="mb-4">
                  Configure your GraphQL requests with our comprehensive input options:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Query Configuration</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>GraphQL Query:</strong> Write queries with full syntax highlighting</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Mutation Support:</strong> Execute mutations with variable binding</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Subscription Testing:</strong> Real-time subscription testing</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Schema Explorer:</strong> Interactive schema documentation</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Authentication & Headers</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Bearer Token:</strong> JWT authentication support</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Basic Auth:</strong> Username/password authentication</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>Custom Headers:</strong> Add any required headers</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span><strong>API Keys:</strong> Secure API key authentication</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 mt-8">Variables & Environment</h3>
                <p className="mb-4">
                  Manage dynamic data and environment-specific values:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Query Variables</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>JSON format variable definition</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Type validation and error checking</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Dynamic variable substitution</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Environment variable integration</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Environment Management</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Create multiple environments (dev, staging, prod)</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Environment-specific variables</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Variable interpolation in queries</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">✓</div>
                        <span>Secure storage of sensitive values</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 mt-8">Output Analysis</h3>
                <p className="mb-4">
                  Comprehensive response analysis tools to understand and debug your GraphQL responses:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Response Visualization</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Structured JSON response viewer</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Collapsible nodes for complex data</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Syntax highlighting for readability</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Error highlighting and location</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold mb-3 text-indigo-300">Response Metadata</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Status code with descriptive messages</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Response time measurement</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Data size in bytes</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mt-1 mr-2 text-indigo-400">•</div>
                        <span>Header information display</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 mt-8">Keyboard Shortcuts</h3>
                <p className="mb-4">
                  Work efficiently with our keyboard shortcut system:
                </p>
                
                <div className="bg-slate-700/30 p-5 rounded-xl border border-white/10 mb-6">
                  <h4 className="text-lg font-semibold mb-3 text-indigo-300">Input Section Navigation</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="w-20 text-indigo-400">Alt + Q</div>
                      <span>Switch to Query tab</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-20 text-indigo-400">Alt + C</div>
                      <span>Switch to CodeQL tab</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-20 text-indigo-400">Alt + A</div>
                      <span>Switch to Auth tab</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-5 rounded-xl border border-indigo-400/30">
                  <h4 className="text-lg font-semibold mb-2 text-indigo-300">Universal Shortcuts</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="w-32 text-indigo-400">Ctrl/Cmd + Enter</div>
                      <span>Execute query</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-32 text-indigo-400">Enter (on URL field)</div>
                      <span>Execute query</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;