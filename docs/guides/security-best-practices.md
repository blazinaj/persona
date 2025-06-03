# Security Best Practices

This guide outlines security best practices for using the Persona platform, including API key management, data privacy considerations, and secure integration patterns.

## API Key Management

### Types of API Keys

Persona offers different types of API keys with varying levels of access:

1. **Public Keys**: Used for client-side applications with limited permissions
2. **Secret Keys**: Used for server-side applications with elevated permissions
3. **Admin Keys**: Used for administrative tasks with full access (use with extreme caution)

### Secure Storage

Always store API keys securely:

#### Never store API keys in:
- Public GitHub repositories
- Client-side JavaScript that's visible to users
- Unencrypted configuration files
- Environment variables in public build logs

#### Instead, store API keys in:
- Environment variables on your server
- Secret management services (AWS Secrets Manager, Google Secret Manager, etc.)
- Encrypted configuration files with restricted access
- Secure key vaults provided by your hosting platform

### Example: Environment Variables in Node.js

```javascript
// Load environment variables from .env file (in development)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const apiKey = process.env.PERSONA_API_KEY;
if (!apiKey) {
  throw new Error('PERSONA_API_KEY environment variable is required');
}

// Use the API key
const client = new PersonaClient(apiKey);
```

### Example: AWS Secrets Manager

```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getApiKey() {
  const params = {
    SecretId: 'persona/api-key',
    VersionStage: 'AWSCURRENT'
  };
  
  try {
    const data = await secretsManager.getSecretValue(params).promise();
    const secret = JSON.parse(data.SecretString);
    return secret.apiKey;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    throw error;
  }
}

// Use the API key
getApiKey().then(apiKey => {
  const client = new PersonaClient(apiKey);
  // Use client...
});
```

### Key Rotation

Regularly rotate your API keys to limit the impact of potential breaches:

1. Create a new API key
2. Update your applications to use the new key
3. Verify that everything works correctly
4. Delete the old key

Implement a key rotation schedule based on your security requirements:
- Low-risk environments: Every 90 days
- Medium-risk environments: Every 30-60 days
- High-risk environments: Every 7-30 days

### Access Control

Follow the principle of least privilege:

1. Use different API keys for different applications or services
2. Limit each key to only the permissions it needs
3. Set appropriate expiration dates for temporary access
4. Regularly audit and revoke unused or unnecessary keys

## Secure Integration Patterns

### Backend Proxy Pattern

Instead of exposing your API key in client-side code, use a backend proxy:

```
Client → Your Backend → Persona API
```

#### Example: Node.js Express Proxy

```javascript
const express = require('express');
const fetch = require('node-fetch');
const app = express();

// Parse JSON request bodies
app.use(express.json());

// Environment variables
const PERSONA_API_KEY = process.env.PERSONA_API_KEY;
const PERSONA_API_URL = 'https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1';

// Proxy endpoint for chat
app.post('/api/chat/:personaId', async (req, res) => {
  try {
    // Validate request
    const { personaId } = req.params;
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }
    
    // Forward request to Persona API
    const response = await fetch(`${PERSONA_API_URL}/personas/${personaId}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERSONA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });
    
    // Handle errors
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }
    
    // Return response
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Signed Requests

For enhanced security, implement request signing:

1. Generate a signature on your server using your API key
2. Send the signature along with your request
3. The API verifies the signature before processing the request

#### Example: HMAC Request Signing

```javascript
const crypto = require('crypto');

function generateSignature(payload, apiKey) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const data = timestamp + JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', apiKey)
    .update(data)
    .digest('hex');
  
  return {
    signature,
    timestamp
  };
}

async function makeSignedRequest(endpoint, payload, apiKey) {
  const { signature, timestamp } = generateSignature(payload, apiKey);
  
  const response = await fetch(`https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Timestamp': timestamp
    },
    body: JSON.stringify(payload)
  });
  
  return await response.json();
}
```

### Temporary Tokens

For client-side applications, use temporary tokens with limited permissions:

1. Your backend generates a short-lived token
2. The client uses this token instead of your API key
3. The token expires after a short period

#### Example: Token Generation Service

```javascript
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();

// Environment variables
const API_KEY = process.env.PERSONA_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

// Generate temporary token
app.post('/api/auth/token', (req, res) => {
  // Authenticate the user (implementation depends on your auth system)
  const user = authenticateUser(req);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Create a token with limited permissions and short expiration
  const token = jwt.sign(
    {
      sub: user.id,
      permissions: ['chat:read', 'chat:write'],
      personaId: req.body.personaId // Limit to specific persona
    },
    JWT_SECRET,
    { expiresIn: '15m' } // Token expires in 15 minutes
  );
  
  res.json({ token });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Data Privacy Considerations

### Personal Information Handling

1. **Minimize Data Collection**: Only collect the data you need
2. **Secure Transmission**: Always use HTTPS for API requests
3. **Data Retention**: Implement appropriate retention policies
4. **User Consent**: Obtain and document user consent for data processing
5. **Access Controls**: Limit who can access conversation data

### Compliance Considerations

Depending on your jurisdiction and use case, consider these regulations:

- **GDPR** (European Union)
- **CCPA** (California, USA)
- **HIPAA** (Healthcare, USA)
- **COPPA** (Children's privacy, USA)
- **PIPEDA** (Canada)

### Privacy-Enhancing Techniques

1. **Data Minimization**: Only send necessary information to the API
2. **Anonymization**: Remove identifying information when possible
3. **Pseudonymization**: Replace identifiers with pseudonyms
4. **Purpose Limitation**: Only use data for its intended purpose
5. **Transparency**: Clearly communicate how data is used

### Example: Data Minimization

```javascript
// AVOID: Sending unnecessary personal data
const badRequest = {
  messages: [
    { role: 'user', content: 'My name is John Smith, my email is john@example.com, and my question is about JavaScript closures.' }
  ],
  personaId: 'YOUR_PERSONA_ID',
  // Unnecessary user data
  userData: {
    fullName: 'John Smith',
    email: 'john@example.com',
    location: 'New York',
    phoneNumber: '555-123-4567'
  }
};

// BETTER: Send only what's needed
const goodRequest = {
  messages: [
    { role: 'user', content: 'My question is about JavaScript closures.' }
  ],
  personaId: 'YOUR_PERSONA_ID',
  // Optional minimal user context if needed
  userContext: {
    skillLevel: 'intermediate'
  }
};
```

## Secure Embedding

### Content Security Policy (CSP)

Implement a Content Security Policy to control which resources can be loaded:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://vveuiuwsmndxmrmupnqj.supabase.co; connect-src 'self' https://vveuiuwsmndxmrmupnqj.supabase.co;">
```

Or via HTTP header:

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://vveuiuwsmndxmrmupnqj.supabase.co; connect-src 'self' https://vveuiuwsmndxmrmupnqj.supabase.co;
```

### Subresource Integrity (SRI)

Use SRI to ensure the script hasn't been tampered with:

```html
<script 
  src="https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-widget.js" 
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC" 
  crossorigin="anonymous">
</script>
```

### Iframe Sandboxing

For additional security, consider embedding the chat widget in a sandboxed iframe:

```html
<iframe 
  src="https://vveuiuwsmndxmrmupnqj.supabase.co/functions/v1/chat-embed?personaId=YOUR_PERSONA_ID&apiKey=YOUR_API_KEY" 
  sandbox="allow-scripts allow-same-origin allow-forms"
  style="width: 100%; height: 500px; border: none;">
</iframe>
```

## Monitoring and Incident Response

### Logging and Monitoring

Implement comprehensive logging and monitoring:

1. **API Usage Logs**: Track all API requests and responses
2. **Error Monitoring**: Set up alerts for unusual error rates
3. **Rate Limiting**: Implement and monitor rate limits
4. **Anomaly Detection**: Watch for unusual patterns of activity

### Example: Basic Logging Middleware

```javascript
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'persona-client' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Middleware for Express
function logApiRequests(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  logger.info({
    type: 'request',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info({
      type: 'response',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      contentLength: Buffer.byteLength(body)
    });
    
    return originalSend.call(this, body);
  };
  
  next();
}

// Use in Express app
app.use(logApiRequests);
```

### Incident Response Plan

Develop a plan for security incidents:

1. **Detection**: How will you identify potential security incidents?
2. **Containment**: What immediate actions will you take to limit damage?
3. **Eradication**: How will you remove the threat?
4. **Recovery**: How will you restore normal operations?
5. **Lessons Learned**: How will you improve your security posture?

#### Example: API Key Compromise Response

If you suspect an API key has been compromised:

1. **Immediately revoke the compromised key**
2. **Generate a new key** and update your applications
3. **Review API logs** for unauthorized activity
4. **Check for data exfiltration** or other malicious activity
5. **Notify affected users** if necessary
6. **Document the incident** and implement preventive measures

## Compliance and Auditing

### Regular Security Audits

Conduct regular security audits of your Persona integrations:

1. **Code Reviews**: Review integration code for security issues
2. **Dependency Scanning**: Check for vulnerabilities in dependencies
3. **Penetration Testing**: Test for security weaknesses
4. **Configuration Review**: Verify secure configuration settings
5. **Access Control Review**: Ensure appropriate access controls

### Compliance Documentation

Maintain documentation for compliance purposes:

1. **Data Flow Diagrams**: Document how data moves through your systems
2. **Risk Assessments**: Identify and evaluate security risks
3. **Security Controls**: Document implemented security measures
4. **Incident Response Procedures**: Document your response plan
5. **Training Materials**: Document security training for team members

## Conclusion

Implementing these security best practices will help protect your Persona integration and the data it processes. Remember that security is an ongoing process that requires regular attention and updates as threats and technologies evolve.

For specific security questions or concerns, contact the Persona security team at security@personify.mobi.