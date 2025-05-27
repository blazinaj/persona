# Custom Functions

Custom Functions allow you to extend your personas with JavaScript code that can be executed during chat interactions. This powerful feature enables your personas to perform calculations, format data, make API calls, and more.

## Overview

Custom Functions are JavaScript functions that:

- Are associated with a specific persona
- Can be called during chat interactions
- Run in a secure, sandboxed environment
- Return structured data that the persona can use in its responses

## Creating Custom Functions

### Access the Function Editor

1. Navigate to your persona's detail page
2. Click the "Functions" button in the top navigation
3. Click "Add Function" to create a new function

### Function Structure

Each function must follow this structure:

```javascript
async function execute(input) {
  try {
    // Your code here
    
    // Return success response with result
    return { 
      success: true, 
      result: "Your result here" 
    };
  } catch (error) {
    // Return error response
    return { 
      success: false, 
      error: error.message 
    };
  }
}
```

### Function Properties

When creating a function, you'll need to provide:

- **Name**: A descriptive name for the function (e.g., `calculateBMI`)
- **Description**: What the function does (e.g., "Calculates Body Mass Index from height and weight")
- **Code**: The JavaScript implementation following the structure above
- **Active**: Whether the function is currently enabled

### Input Parameters

Your function receives an `input` object containing parameters passed from the chat. For example:

```javascript
async function execute(input) {
  try {
    // Access input parameters
    const { height, weight } = input;
    
    if (!height || !weight) {
      throw new Error("Height and weight are required");
    }
    
    // Calculate BMI
    const bmi = weight / ((height / 100) ** 2);
    
    return { 
      success: true, 
      result: {
        bmi: bmi.toFixed(1),
        category: getBMICategory(bmi)
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
```

## Security and Limitations

Custom Functions run in a secure, sandboxed environment with the following limitations:

### Allowed

- JavaScript ES2020 features
- Async/await and Promises
- JSON manipulation
- String operations
- Mathematical calculations
- Array and object operations

### Not Allowed

- File system access
- Network requests (except through approved integrations)
- Database access (except through approved integrations)
- Access to system resources
- Importing external libraries
- Long-running operations (functions timeout after 10 seconds)

### Best Practices

- Keep functions focused on a single task
- Include proper error handling
- Validate all input parameters
- Return structured data in a consistent format
- Keep functions stateless
- Document your functions with clear descriptions

## Example Functions

### Currency Converter

```javascript
async function execute(input) {
  try {
    const { amount, from, to } = input;
    
    if (!amount || !from || !to) {
      throw new Error("Amount, from currency, and to currency are required");
    }
    
    // Exchange rates (in a real implementation, these would come from an API)
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.82,
      CAD: 1.36
    };
    
    if (!rates[from] || !rates[to]) {
      throw new Error("Unsupported currency");
    }
    
    // Convert to USD first, then to target currency
    const inUSD = amount / rates[from];
    const converted = inUSD * rates[to];
    
    return {
      success: true,
      result: {
        amount: parseFloat(amount),
        from,
        to,
        converted: parseFloat(converted.toFixed(2)),
        rate: parseFloat((rates[to] / rates[from]).toFixed(4))
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Date Calculator

```javascript
async function execute(input) {
  try {
    const { date, addDays } = input;
    
    if (!date) {
      throw new Error("Date is required");
    }
    
    const baseDate = new Date(date);
    if (isNaN(baseDate.getTime())) {
      throw new Error("Invalid date format");
    }
    
    let resultDate;
    
    if (addDays !== undefined) {
      resultDate = new Date(baseDate);
      resultDate.setDate(resultDate.getDate() + parseInt(addDays));
    } else {
      resultDate = baseDate;
    }
    
    const formatDate = (d) => {
      return {
        iso: d.toISOString(),
        formatted: d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'long' }),
        dayOfYear: Math.floor((d - new Date(d.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))
      };
    };
    
    return {
      success: true,
      result: formatDate(resultDate)
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Text Analyzer

```javascript
async function execute(input) {
  try {
    const { text } = input;
    
    if (!text) {
      throw new Error("Text is required");
    }
    
    const words = text.trim().split(/\s+/);
    const characters = text.length;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    
    // Calculate reading time (average reading speed: 200 words per minute)
    const readingTimeMinutes = words.length / 200;
    const readingTime = readingTimeMinutes < 1 
      ? `${Math.ceil(readingTimeMinutes * 60)} seconds` 
      : `${Math.ceil(readingTimeMinutes)} minutes`;
    
    // Find most frequent words (excluding common words)
    const commonWords = new Set(['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with']);
    const wordFrequency = {};
    
    words.forEach(word => {
      const normalized = word.toLowerCase().replace(/[^\w]/g, '');
      if (normalized && !commonWords.has(normalized)) {
        wordFrequency[normalized] = (wordFrequency[normalized] || 0) + 1;
      }
    });
    
    const topWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));
    
    return {
      success: true,
      result: {
        wordCount: words.length,
        characterCount: characters,
        sentenceCount: sentences,
        readingTime,
        topWords
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## Using Functions in Chat

When chatting with a persona that has custom functions, the AI will automatically determine when to call these functions based on the conversation context.

For example, if your persona has the BMI calculator function and a user asks "Can you calculate my BMI? I'm 180cm tall and weigh 75kg", the persona will:

1. Recognize that the BMI calculator function is appropriate
2. Extract the height and weight parameters from the message
3. Call the function with these parameters
4. Receive the result and incorporate it into its response

The user doesn't need to explicitly request the function by name - the AI will intelligently determine when to use it.

## Troubleshooting

### Common Errors

**Syntax Errors**
- Check for missing brackets, parentheses, or semicolons
- Ensure all variables are properly declared
- Verify that all functions are properly defined

**Runtime Errors**
- Ensure all input parameters are properly validated
- Check for potential null or undefined values
- Handle edge cases appropriately

**Timeout Errors**
- Simplify complex operations
- Avoid infinite loops
- Consider breaking complex functions into smaller ones

### Debugging Tips

1. Add temporary logging in your function:
   ```javascript
   console.log('Input:', JSON.stringify(input));
   ```

2. Return intermediate values to check calculation steps:
   ```javascript
   return {
     success: true,
     result: {
       input,
       intermediateValue,
       finalResult
     }
   };
   ```

3. Test with simple inputs first, then gradually add complexity

## Advanced Techniques

### Function Chaining

You can create multiple functions that work together by having one function call another:

```javascript
async function execute(input) {
  try {
    const { operation, values } = input;
    
    let result;
    switch (operation) {
      case 'mean':
        result = calculateMean(values);
        break;
      case 'median':
        result = calculateMedian(values);
        break;
      case 'mode':
        result = calculateMode(values);
        break;
      default:
        throw new Error("Unknown operation");
    }
    
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function calculateMean(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Values must be a non-empty array");
  }
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

function calculateMedian(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Values must be a non-empty array");
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

function calculateMode(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Values must be a non-empty array");
  }
  
  const counts = {};
  values.forEach(val => {
    counts[val] = (counts[val] || 0) + 1;
  });
  
  let mode;
  let maxCount = 0;
  
  for (const [value, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mode = parseFloat(value);
    }
  }
  
  return mode;
}
```

### Data Transformation

Custom functions are excellent for transforming data into different formats:

```javascript
async function execute(input) {
  try {
    const { data, format } = input;
    
    if (!data) {
      throw new Error("Data is required");
    }
    
    switch (format?.toLowerCase()) {
      case 'csv':
        return { success: true, result: convertToCSV(data) };
      case 'html':
        return { success: true, result: convertToHTML(data) };
      case 'markdown':
      default:
        return { success: true, result: convertToMarkdown(data) };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Data must be a non-empty array");
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return `"${value}"`; // Wrap in quotes to handle commas in values
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

function convertToHTML(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Data must be a non-empty array");
  }
  
  const headers = Object.keys(data[0]);
  let html = '<table border="1">\n<thead>\n<tr>\n';
  
  // Add headers
  headers.forEach(header => {
    html += `<th>${header}</th>\n`;
  });
  html += '</tr>\n</thead>\n<tbody>\n';
  
  // Add rows
  for (const row of data) {
    html += '<tr>\n';
    headers.forEach(header => {
      html += `<td>${row[header]}</td>\n`;
    });
    html += '</tr>\n';
  }
  
  html += '</tbody>\n</table>';
  return html;
}

function convertToMarkdown(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Data must be a non-empty array");
  }
  
  const headers = Object.keys(data[0]);
  let markdown = '';
  
  // Add headers
  markdown += '| ' + headers.join(' | ') + ' |\n';
  markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  
  // Add rows
  for (const row of data) {
    markdown += '| ' + headers.map(header => row[header]).join(' | ') + ' |\n';
  }
  
  return markdown;
}
```

## Best Practices for Production

When using Custom Functions in production environments:

1. **Thoroughly test** your functions with various inputs
2. **Document** what each function does and its expected inputs/outputs
3. **Keep functions simple** and focused on a single task
4. **Handle errors gracefully** with informative error messages
5. **Validate all inputs** to prevent unexpected behavior
6. **Use descriptive names** for functions and parameters
7. **Maintain version control** for your function code
8. **Monitor function performance** in production