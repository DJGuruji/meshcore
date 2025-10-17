import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// JSON Validator + Transformer API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { json, action } = body;

    if (!json) {
      return NextResponse.json({ error: 'JSON input is required' }, { status: 400 });
    }

    let parsedJson;
    try {
      parsedJson = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (error) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid JSON format',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
    }

    // Perform requested action
    switch (action) {
      case 'validate':
        return NextResponse.json({ 
          valid: true, 
          message: 'Valid JSON',
          data: parsedJson
        });

      case 'beautify':
        return NextResponse.json({ 
          result: JSON.stringify(parsedJson, null, 2),
          message: 'JSON beautified successfully'
        });

      case 'minify':
        return NextResponse.json({ 
          result: JSON.stringify(parsedJson),
          message: 'JSON minified successfully'
        });

      case 'flatten':
        const flattened = flattenObject(parsedJson);
        return NextResponse.json({ 
          result: flattened,
          message: 'JSON flattened successfully'
        });

      case 'toCSV':
        const csv = jsonToCSV(parsedJson);
        return NextResponse.json({ 
          result: csv,
          format: 'csv',
          message: 'JSON converted to CSV successfully'
        });

      case 'toXML':
        const xml = jsonToXML(parsedJson);
        return NextResponse.json({ 
          result: xml,
          format: 'xml',
          message: 'JSON converted to XML successfully'
        });

      default:
        return NextResponse.json({ 
          valid: true, 
          data: parsedJson,
          message: 'JSON validated successfully'
        });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Flatten nested JSON object
function flattenObject(obj: any, prefix = ''): any {
  const flattened: any = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    }
  }
  
  return flattened;
}

// Convert JSON to CSV
function jsonToCSV(json: any): string {
  if (Array.isArray(json)) {
    if (json.length === 0) return '';
    
    const headers = Object.keys(json[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of json) {
      const values = headers.map(header => {
        const value = row[header];
        const escaped = ('' + value).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  } else {
    // Convert single object to CSV
    const headers = Object.keys(json);
    const values = headers.map(header => {
      const value = json[header];
      const escaped = ('' + value).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    return headers.join(',') + '\n' + values.join(',');
  }
}

// Convert JSON to XML
function jsonToXML(json: any, rootName = 'root'): string {
  function convertToXML(obj: any, nodeName: string, indent = ''): string {
    if (obj === null || obj === undefined) {
      return `${indent}<${nodeName}/>\n`;
    }
    
    if (typeof obj !== 'object') {
      return `${indent}<${nodeName}>${escapeXML(obj)}</${nodeName}>\n`;
    }
    
    if (Array.isArray(obj)) {
      let xml = '';
      obj.forEach((item, index) => {
        xml += convertToXML(item, 'item', indent);
      });
      return xml;
    }
    
    let xml = `${indent}<${nodeName}>\n`;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        xml += convertToXML(obj[key], key, indent + '  ');
      }
    }
    xml += `${indent}</${nodeName}>\n`;
    return xml;
  }
  
  function escapeXML(str: any): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + convertToXML(json, rootName, '');
}
