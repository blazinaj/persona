/**
 * Utility functions for working with CSV data
 */

/**
 * Convert an array of objects to CSV string
 * @param data Array of objects to convert to CSV
 * @param includeHeaders Whether to include headers in the CSV
 * @returns CSV formatted string
 */
export function objectsToCSV(data: Record<string, any>[], includeHeaders: boolean = true): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Get all possible headers from all objects
  const headers = Array.from(
    new Set(
      data.flatMap(obj => Object.keys(obj))
    )
  );

  const rows: string[] = [];

  // Add headers row if requested
  if (includeHeaders) {
    rows.push(headers.join(','));
  }

  // Add data rows
  data.forEach(obj => {
    const row = headers.map(header => {
      // Get the value or empty string if not present
      const value = obj[header] !== undefined ? obj[header] : '';
      
      // Escape and quote values if needed
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes by doubling them and wrap in quotes
        const escaped = value.replace(/"/g, '""');
        // Quote if the value contains commas, quotes, or newlines
        return /[,"\n\r]/.test(value) ? `"${escaped}"` : escaped;
      } else {
        return String(value);
      }
    });
    
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * Parse CSV string into an array of objects
 * @param csv CSV string to parse
 * @param hasHeaders Whether the CSV has headers
 * @returns Array of objects parsed from CSV
 */
export function parseCSV(csv: string, hasHeaders: boolean = true): Record<string, any>[] {
  if (!csv || csv.trim() === '') {
    return [];
  }

  const rows = csv.split(/\r?\n/).filter(row => row.trim() !== '');
  
  if (rows.length === 0) {
    return [];
  }

  // Parse headers
  let headers: string[] = [];
  let dataStartIndex = 0;
  
  if (hasHeaders) {
    // Handle quoted headers with commas inside
    headers = parseCSVRow(rows[0]);
    dataStartIndex = 1;
  } else {
    // If no headers, use column indices as keys
    const firstRow = parseCSVRow(rows[0]);
    headers = firstRow.map((_, i) => `column${i + 1}`);
  }

  // Parse data rows
  const result: Record<string, any>[] = [];
  for (let i = dataStartIndex; i < rows.length; i++) {
    const values = parseCSVRow(rows[i]);
    
    if (values.length === 0) continue;
    
    const obj: Record<string, any> = {};
    
    // Map values to headers
    values.forEach((value, index) => {
      if (index < headers.length) {
        obj[headers[index]] = value;
      }
    });
    
    result.push(obj);
  }

  return result;
}

/**
 * Parse a CSV row, handling quoted values
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];
    
    if (char === '"') {
      // Handle escaped quotes (two double quotes in a row)
      if (nextChar === '"') {
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quotes mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last field
  result.push(currentValue);
  
  return result;
}

/**
 * Convert CSV data to HTML table
 * @param csvData CSV string to convert to HTML table
 * @param hasHeaders Whether the CSV has headers
 * @returns HTML table string
 */
export function csvToHtmlTable(csvData: string, hasHeaders: boolean = true): string {
  const data = parseCSV(csvData, hasHeaders);
  
  if (data.length === 0) {
    return '<p>No data available</p>';
  }
  
  // Get all headers from all objects
  const headers = Array.from(
    new Set(
      data.flatMap(obj => Object.keys(obj))
    )
  );
  
  let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">';
  
  // Add header row
  if (hasHeaders) {
    html += '<thead><tr>';
    headers.forEach(header => {
      html += `<th style="background-color: #f2f2f2; text-align: left;">${header}</th>`;
    });
    html += '</tr></thead>';
  }
  
  // Add data rows
  html += '<tbody>';
  data.forEach(row => {
    html += '<tr>';
    headers.forEach(header => {
      html += `<td>${row[header] !== undefined ? row[header] : ''}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';
  
  html += '</table>';
  
  return html;
}

/**
 * Detect if a string is likely CSV data
 * @param text Text to check for CSV format
 * @returns True if text appears to be CSV data
 */
export function isLikelyCSV(text: string): boolean {
  if (!text || text.trim() === '') {
    return false;
  }
  
  // Split into lines
  const lines = text.trim().split(/\r?\n/);
  
  // Need at least one line
  if (lines.length === 0) {
    return false;
  }
  
  // Check if all lines have roughly the same number of commas
  const commasInFirstLine = (lines[0].match(/,/g) || []).length;
  
  // If no commas, it's not a CSV
  if (commasInFirstLine === 0) {
    return false;
  }
  
  // Check at least the first few lines (up to 5) to confirm pattern
  const linesToCheck = Math.min(lines.length, 5);
  for (let i = 0; i < linesToCheck; i++) {
    const commasInLine = (lines[i].match(/,/g) || []).length;
    // Allow some flexibility in comma count (±1) for irregular data
    if (Math.abs(commasInLine - commasInFirstLine) > 1) {
      return false;
    }
  }
  
  return true;
}