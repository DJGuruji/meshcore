// Script Runner for API Tester - Executes pre-request and test scripts

interface ScriptContext {
  pm: {
    environment: {
      get: (key: string) => any;
      set: (key: string, value: any) => void;
      unset: (key: string) => void;
    };
    variables: {
      get: (key: string) => any;
      set: (key: string, value: any) => void;
    };
    request: {
      url: string;
      method: string;
      headers: any;
      body: any;
    };
    response?: {
      code: number;
      status: string;
      headers: any;
      body: any;
      responseTime: number;
      responseSize: number;
      json: () => any;
      text: () => string;
    };
    expect: (value: any) => ExpectChain;
    test: (name: string, fn: () => void) => void;
    sendRequest: (request: any) => Promise<any>;
  };
  console: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
  };
}

interface ExpectChain {
  to: {
    equal: (expected: any) => void;
    eql: (expected: any) => void;
    be: {
      a: (type: string) => void;
      an: (type: string) => void;
      true: void;
      false: void;
      null: void;
      undefined: void;
      ok: void;
      empty: void;
      above: (value: number) => void;
      below: (value: number) => void;
      within: (min: number, max: number) => void;
    };
    have: {
      property: (prop: string, value?: any) => void;
      length: (len: number) => void;
      keys: (...keys: string[]) => void;
      members: (members: any[]) => void;
    };
    include: (value: any) => void;
    match: (pattern: RegExp) => void;
  };
  not: ExpectChain;
}

export class ScriptRunner {
  private envVars: Map<string, any>;
  private localVars: Map<string, any>;
  private testResults: Array<{ name: string; passed: boolean; error?: string }>;
  private consoleLogs: Array<{ type: string; message: string }>;

  constructor(envVars: any[] = []) {
    this.envVars = new Map();
    this.localVars = new Map();
    this.testResults = [];
    this.consoleLogs = [];
    
    // Initialize environment variables
    envVars.forEach(v => {
      if (v.enabled) {
        this.envVars.set(v.key, v.value);
      }
    });
  }

  async runPreRequestScript(script: string, request: any): Promise<{ variables: any; logs: any[] }> {
    if (!script || script.trim() === '') {
      return { variables: Object.fromEntries(this.localVars), logs: [] };
    }

    const context = this.createContext(request);
    
    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('pm', 'console', script);
      await fn(context.pm, context.console);
    } catch (error) {
      this.consoleLogs.push({
        type: 'error',
        message: `Pre-request script error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return {
      variables: Object.fromEntries(this.localVars),
      logs: this.consoleLogs
    };
  }

  async runTestScript(script: string, request: any, response: any): Promise<{ 
    tests: Array<{ name: string; passed: boolean; error?: string }>;
    logs: any[];
  }> {
    if (!script || script.trim() === '') {
      return { tests: [], logs: [] };
    }

    this.testResults = [];
    const context = this.createContext(request, response);
    
    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('pm', 'console', script);
      await fn(context.pm, context.console);
    } catch (error) {
      this.consoleLogs.push({
        type: 'error',
        message: `Test script error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return {
      tests: this.testResults,
      logs: this.consoleLogs
    };
  }

  private createContext(request: any, response?: any): ScriptContext {
    const self = this;

    return {
      pm: {
        environment: {
          get: (key: string) => self.envVars.get(key),
          set: (key: string, value: any) => self.envVars.set(key, value),
          unset: (key: string) => self.envVars.delete(key)
        },
        variables: {
          get: (key: string) => self.localVars.get(key) || self.envVars.get(key),
          set: (key: string, value: any) => self.localVars.set(key, value)
        },
        request: {
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: request.body
        },
        response: response ? {
          code: response.status,
          status: response.statusText,
          headers: response.headers,
          body: response.body,
          responseTime: response.time,
          responseSize: response.size,
          json: () => typeof response.body === 'object' ? response.body : JSON.parse(response.body),
          text: () => typeof response.body === 'string' ? response.body : JSON.stringify(response.body)
        } : undefined,
        expect: (value: any) => self.createExpectChain(value, false),
        test: (name: string, fn: () => void) => {
          try {
            fn();
            self.testResults.push({ name, passed: true });
          } catch (error) {
            self.testResults.push({ 
              name, 
              passed: false, 
              error: error instanceof Error ? error.message : 'Test failed'
            });
          }
        },
        sendRequest: async (req: any) => {
          // This would need to call the actual send endpoint
          return Promise.resolve({});
        }
      },
      console: {
        log: (...args: any[]) => {
          self.consoleLogs.push({ type: 'log', message: args.map(a => String(a)).join(' ') });
        },
        error: (...args: any[]) => {
          self.consoleLogs.push({ type: 'error', message: args.map(a => String(a)).join(' ') });
        },
        warn: (...args: any[]) => {
          self.consoleLogs.push({ type: 'warn', message: args.map(a => String(a)).join(' ') });
        }
      }
    };
  }

  private createExpectChain(value: any, negate: boolean): ExpectChain {
    const self = this;
    
    const assert = (condition: boolean, message: string) => {
      if (negate ? condition : !condition) {
        throw new Error(message);
      }
    };

    return {
      to: {
        equal: (expected: any) => {
          assert(value === expected, `Expected ${value} to${negate ? ' not' : ''} equal ${expected}`);
        },
        eql: (expected: any) => {
          const eq = JSON.stringify(value) === JSON.stringify(expected);
          assert(eq, `Expected ${JSON.stringify(value)} to${negate ? ' not' : ''} deep equal ${JSON.stringify(expected)}`);
        },
        be: {
          a: (type: string) => {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            assert(actualType === type, `Expected ${value} to${negate ? ' not' : ''} be a ${type}`);
          },
          an: (type: string) => {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            assert(actualType === type, `Expected ${value} to${negate ? ' not' : ''} be an ${type}`);
          },
          true: (() => {
            assert(value === true, `Expected ${value} to${negate ? ' not' : ''} be true`);
          })(),
          false: (() => {
            assert(value === false, `Expected ${value} to${negate ? ' not' : ''} be false`);
          })(),
          null: (() => {
            assert(value === null, `Expected ${value} to${negate ? ' not' : ''} be null`);
          })(),
          undefined: (() => {
            assert(value === undefined, `Expected ${value} to${negate ? ' not' : ''} be undefined`);
          })(),
          ok: (() => {
            assert(!!value, `Expected ${value} to${negate ? ' not' : ''} be truthy`);
          })(),
          empty: (() => {
            const isEmpty = Array.isArray(value) ? value.length === 0 : 
                           typeof value === 'object' ? Object.keys(value).length === 0 :
                           !value;
            assert(isEmpty, `Expected ${value} to${negate ? ' not' : ''} be empty`);
          })(),
          above: (num: number) => {
            assert(value > num, `Expected ${value} to${negate ? ' not' : ''} be above ${num}`);
          },
          below: (num: number) => {
            assert(value < num, `Expected ${value} to${negate ? ' not' : ''} be below ${num}`);
          },
          within: (min: number, max: number) => {
            assert(value >= min && value <= max, `Expected ${value} to${negate ? ' not' : ''} be within ${min}..${max}`);
          }
        },
        have: {
          property: (prop: string, val?: any) => {
            const hasProp = value && value.hasOwnProperty(prop);
            assert(hasProp, `Expected object to${negate ? ' not' : ''} have property ${prop}`);
            if (val !== undefined && hasProp) {
              assert(value[prop] === val, `Expected property ${prop} to${negate ? ' not' : ''} equal ${val}`);
            }
          },
          length: (len: number) => {
            const actualLen = Array.isArray(value) ? value.length : 
                            typeof value === 'string' ? value.length : 
                            typeof value === 'object' ? Object.keys(value).length : 0;
            assert(actualLen === len, `Expected length to${negate ? ' not' : ''} be ${len}, got ${actualLen}`);
          },
          keys: (...keys: string[]) => {
            const objKeys = Object.keys(value);
            const hasAllKeys = keys.every(k => objKeys.includes(k));
            assert(hasAllKeys, `Expected object to${negate ? ' not' : ''} have keys ${keys.join(', ')}`);
          },
          members: (members: any[]) => {
            const hasAll = members.every(m => value.includes(m));
            assert(hasAll, `Expected array to${negate ? ' not' : ''} include all members`);
          }
        },
        include: (val: any) => {
          const includes = Array.isArray(value) ? value.includes(val) :
                          typeof value === 'string' ? value.includes(val) :
                          typeof value === 'object' ? Object.values(value).includes(val) : false;
          assert(includes, `Expected ${value} to${negate ? ' not' : ''} include ${val}`);
        },
        match: (pattern: RegExp) => {
          const matches = pattern.test(String(value));
          assert(matches, `Expected ${value} to${negate ? ' not' : ''} match ${pattern}`);
        }
      },
      get not() {
        return self.createExpectChain(value, !negate);
      }
    };
  }

  getEnvironmentVariables(): any[] {
    return Array.from(this.envVars.entries()).map(([key, value]) => ({
      key,
      value,
      enabled: true
    }));
  }

  getLocalVariables(): any {
    return Object.fromEntries(this.localVars);
  }
}
