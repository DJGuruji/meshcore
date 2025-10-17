// Code Generator for API Tester - Generates code snippets in various languages

interface Request {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string; enabled: boolean }>;
  params: Array<{ key: string; value: string; enabled: boolean }>;
  body?: {
    type: string;
    json?: string;
    raw?: string;
  };
  auth?: {
    type: string;
    bearer?: { token: string };
    basic?: { username: string; password: string };
    apiKey?: { key: string; value: string; addTo: string };
  };
}

export class CodeGenerator {
  generateCurl(request: Request): string {
    let curl = `curl -X ${request.method}`;

    // Add URL with params
    const url = this.buildUrl(request.url, request.params);
    curl += ` '${url}'`;

    // Add headers
    const headers = request.headers.filter(h => h.enabled);
    headers.forEach(h => {
      curl += ` \\\n  -H '${h.key}: ${h.value}'`;
    });

    // Add auth
    if (request.auth) {
      if (request.auth.type === 'bearer' && request.auth.bearer) {
        curl += ` \\\n  -H 'Authorization: Bearer ${request.auth.bearer.token}'`;
      } else if (request.auth.type === 'basic' && request.auth.basic) {
        curl += ` \\\n  -u '${request.auth.basic.username}:${request.auth.basic.password}'`;
      } else if (request.auth.type === 'api-key' && request.auth.apiKey && request.auth.apiKey.addTo === 'header') {
        curl += ` \\\n  -H '${request.auth.apiKey.key}: ${request.auth.apiKey.value}'`;
      }
    }

    // Add body
    if (request.body && request.body.type !== 'none' && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (request.body.type === 'json' && request.body.json) {
        curl += ` \\\n  -H 'Content-Type: application/json'`;
        curl += ` \\\n  -d '${request.body.json.replace(/'/g, "'\\''")}'`;
      } else if (request.body.type === 'raw' && request.body.raw) {
        curl += ` \\\n  -d '${request.body.raw.replace(/'/g, "'\\''")}'`;
      }
    }

    return curl;
  }

  generateJavaScript(request: Request): string {
    const url = this.buildUrl(request.url, request.params);
    const headers: any = {};

    // Add headers
    request.headers.filter(h => h.enabled).forEach(h => {
      headers[h.key] = h.value;
    });

    // Add auth
    if (request.auth) {
      if (request.auth.type === 'bearer' && request.auth.bearer) {
        headers['Authorization'] = `Bearer ${request.auth.bearer.token}`;
      } else if (request.auth.type === 'basic' && request.auth.basic) {
        const encoded = btoa(`${request.auth.basic.username}:${request.auth.basic.password}`);
        headers['Authorization'] = `Basic ${encoded}`;
      } else if (request.auth.type === 'api-key' && request.auth.apiKey && request.auth.apiKey.addTo === 'header') {
        headers[request.auth.apiKey.key] = request.auth.apiKey.value;
      }
    }

    let code = `// Using fetch API\nfetch('${url}', {\n  method: '${request.method}'`;

    if (Object.keys(headers).length > 0) {
      code += `,\n  headers: ${JSON.stringify(headers, null, 2)}`;
    }

    if (request.body && request.body.type !== 'none' && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (request.body.type === 'json' && request.body.json) {
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
        code += `,\n  body: JSON.stringify(${request.body.json})`;
      } else if (request.body.type === 'raw' && request.body.raw) {
        code += `,\n  body: '${request.body.raw.replace(/'/g, "\\'")}'`;
      }
    }

    code += `
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;

    return code;
  }

  generatePython(request: Request): string {
    const url = this.buildUrl(request.url, request.params);
    let code = `import requests\n\n`;

    code += `url = "${url}"\n`;

    // Headers
    const headers = request.headers.filter(h => h.enabled);
    if (headers.length > 0 || request.auth) {
      code += `headers = {\n`;
      headers.forEach(h => {
        code += `    "${h.key}": "${h.value}",\n`;
      });

      // Add auth
      if (request.auth) {
        if (request.auth.type === 'bearer' && request.auth.bearer) {
          code += `    "Authorization": "Bearer ${request.auth.bearer.token}",\n`;
        } else if (request.auth.type === 'api-key' && request.auth.apiKey && request.auth.apiKey.addTo === 'header') {
          code += `    "${request.auth.apiKey.key}": "${request.auth.apiKey.value}",\n`;
        }
      }

      code += `}\n\n`;
    }

    // Body
    if (request.body && request.body.type !== 'none' && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (request.body.type === 'json' && request.body.json) {
        code += `data = ${request.body.json}\n\n`;
      } else if (request.body.type === 'raw' && request.body.raw) {
        code += `data = """${request.body.raw}"""\n\n`;
      }
    }

    // Request
    code += `response = requests.${request.method.toLowerCase()}(url`;
    if (headers.length > 0 || request.auth) {
      code += `, headers=headers`;
    }
    if (request.body && request.body.type !== 'none' && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (request.body.type === 'json') {
        code += `, json=data`;
      } else {
        code += `, data=data`;
      }
    }

    // Basic auth
    if (request.auth?.type === 'basic' && request.auth.basic) {
      code += `, auth=("${request.auth.basic.username}", "${request.auth.basic.password}")`;
    }

    code += `)\n\nprint(response.json())`;

    return code;
  }

  generateNodeJS(request: Request): string {
    const url = this.buildUrl(request.url, request.params);
    let code = `const axios = require('axios');\n\n`;

    code += `const config = {\n  method: '${request.method.toLowerCase()}',\n  url: '${url}'`;

    // Headers
    const headers = request.headers.filter(h => h.enabled);
    const headersObj: any = {};
    headers.forEach(h => {
      headersObj[h.key] = h.value;
    });

    // Add auth
    if (request.auth) {
      if (request.auth.type === 'bearer' && request.auth.bearer) {
        headersObj['Authorization'] = `Bearer ${request.auth.bearer.token}`;
      } else if (request.auth.type === 'api-key' && request.auth.apiKey && request.auth.apiKey.addTo === 'header') {
        headersObj[request.auth.apiKey.key] = request.auth.apiKey.value;
      }
    }

    if (Object.keys(headersObj).length > 0) {
      code += `,\n  headers: ${JSON.stringify(headersObj, null, 2)}`;
    }

    // Body
    if (request.body && request.body.type !== 'none' && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (request.body.type === 'json' && request.body.json) {
        code += `,\n  data: ${request.body.json}`;
      } else if (request.body.type === 'raw' && request.body.raw) {
        code += `,\n  data: '${request.body.raw.replace(/'/g, "\\'")}'`;
      }
    }

    // Basic auth
    if (request.auth?.type === 'basic' && request.auth.basic) {
      code += `,
  auth: {
    username: '${request.auth.basic.username}',
    password: '${request.auth.basic.password}'
  }`;
    }

    code += `
};

axios(config)
  .then(response => console.log(response.data))
  .catch(error => console.error(error));`;

    return code;
  }

  private buildUrl(baseUrl: string, params: Array<{ key: string; value: string; enabled: boolean }>): string {
    const enabledParams = params.filter(p => p.enabled);
    if (enabledParams.length === 0) return baseUrl;

    const url = new URL(baseUrl);
    enabledParams.forEach(p => {
      url.searchParams.append(p.key, p.value);
    });
    return url.toString();
  }

  // Export collection to Postman format
  exportToPostman(collection: any): string {
    const postmanCollection = {
      info: {
        name: collection.name,
        description: collection.description || '',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: collection.requests.map((req: any) => ({
        name: req.name,
        request: {
          method: req.method,
          header: req.headers.filter((h: any) => h.enabled).map((h: any) => ({
            key: h.key,
            value: h.value,
            type: 'text'
          })),
          url: {
            raw: req.url,
            protocol: new URL(req.url).protocol.replace(':', ''),
            host: new URL(req.url).hostname.split('.'),
            path: new URL(req.url).pathname.split('/').filter(Boolean),
            query: req.params.filter((p: any) => p.enabled).map((p: any) => ({
              key: p.key,
              value: p.value
            }))
          },
          body: req.body && req.body.type !== 'none' ? {
            mode: req.body.type,
            raw: req.body.json || req.body.raw || ''
          } : undefined
        }
      }))
    };

    return JSON.stringify(postmanCollection, null, 2);
  }

  // Import from Postman format
  importFromPostman(postmanJson: string): any {
    try {
      const postman = JSON.parse(postmanJson);
      
      return {
        name: postman.info.name,
        description: postman.info.description || '',
        requests: postman.item.map((item: any) => ({
          name: item.name,
          method: item.request.method,
          url: item.request.url.raw,
          headers: (item.request.header || []).map((h: any) => ({
            key: h.key,
            value: h.value,
            enabled: true
          })),
          params: (item.request.url.query || []).map((q: any) => ({
            key: q.key,
            value: q.value,
            enabled: true
          })),
          body: item.request.body ? {
            type: item.request.body.mode,
            json: item.request.body.mode === 'json' ? item.request.body.raw : undefined,
            raw: item.request.body.mode === 'raw' ? item.request.body.raw : undefined
          } : { type: 'none' },
          auth: { type: 'none' }
        }))
      };
    } catch (error) {
      throw new Error('Invalid Postman collection format');
    }
  }
}
