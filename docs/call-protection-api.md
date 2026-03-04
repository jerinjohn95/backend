# Call Protection API Documentation

## Overview
The Call Protection API provides comprehensive real-time call monitoring, spam detection, and call blocking capabilities. It integrates with device call logs and contacts to provide intelligent call protection.

## Base URL
```
https://backend-0s9d.onrender.com/api/call-protection
```

## Authentication
All endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Sync Call Logs
**POST** `/sync`

Synchronizes call logs from the device to the backend.

**Request Body:**
```json
{
  "userId": "user_id_here",
  "callLogs": [
    {
      "phoneNumber": "+1234567890",
      "callerName": "John Doe",
      "callType": "incoming",
      "timestamp": "2024-03-04T10:30:00Z",
      "duration": 120,
      "riskScore": 0.2,
      "riskLevel": "Low",
      "suspiciousPatterns": [],
      "callerInfo": {
        "name": "John Doe",
        "type": "personal",
        "location": "New York, USA",
        "carrier": "Verizon"
      },
      "contactSource": "contacts"
    }
  ],
  "deviceInfo": {
    "deviceId": "device_123",
    "platform": "android",
    "appVersion": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Call logs synced successfully",
  "data": {
    "syncedCount": 25,
    "blockedCount": 3,
    "callLogs": [...]
  }
}
```

### 2. Get Call History
**GET** `/call-history`

Retrieves user's call history with optional filters.

**Query Parameters:**
- `userId` (required): User ID
- `callType` (optional): Filter by call type (incoming, outgoing, missed, rejected, blocked)
- `isSpam` (optional): Filter spam calls (true/false)
- `isBlocked` (optional): Filter blocked calls (true/false)
- `startDate` (optional): Filter start date (ISO string)
- `endDate` (optional): Filter end date (ISO string)
- `limit` (optional): Number of results (default: 50)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "callLogs": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "pages": 3
    }
  }
}
```

### 3. Block Phone Number
**POST** `/block`

Blocks a phone number from calling.

**Request Body:**
```json
{
  "userId": "user_id_here",
  "phoneNumber": "+1234567890",
  "callerName": "Spam Caller",
  "blockReason": "spam",
  "isTemporary": false,
  "duration": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Number blocked successfully",
  "data": {
    "blockedNumber": {...},
    "updatedCallLogs": 5
  }
}
```

### 4. Unblock Phone Number
**POST** `/unblock`

Unblocks a previously blocked phone number.

**Request Body:**
```json
{
  "userId": "user_id_here",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Number unblocked successfully",
  "data": {
    "updatedCallLogs": 5
  }
}
```

### 5. Get Blocked Numbers
**GET** `/blocked-numbers`

Retrieves list of blocked numbers for a user.

**Query Parameters:**
- `userId` (required): User ID
- `blockReason` (optional): Filter by block reason
- `riskLevel` (optional): Filter by risk level
- `limit` (optional): Number of results (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "blockedNumbers": [...],
    "count": 15
  }
}
```

### 6. Report Spam Call
**POST** `/report-spam`

Reports a phone number as spam.

**Request Body:**
```json
{
  "userId": "user_id_here",
  "phoneNumber": "+1234567890",
  "callerName": "Scam Caller",
  "reportReason": "scam",
  "reportNotes": "Claimed to be from IRS",
  "riskScore": 0.9,
  "riskLevel": "Critical"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Spam call reported successfully",
  "data": {
    "callLog": {...},
    "autoBlocked": true
  }
}
```

### 7. Get Call Protection Statistics
**GET** `/statistics`

Retrieves comprehensive call protection statistics.

**Query Parameters:**
- `userId` (required): User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "callStatistics": {
      "totalCalls": 250,
      "spamCalls": 15,
      "blockedCalls": 8,
      "reportedCalls": 12,
      "avgRiskScore": 0.15,
      "avgDuration": 120
    },
    "blockStatistics": {
      "totalBlocked": 8,
      "temporaryBlocks": 2,
      "permanentBlocks": 6,
      "avgRiskScore": 0.75
    },
    "recentCalls": [...],
    "riskDistribution": [...],
    "callTypeDistribution": [...]
  }
}
```

### 8. Analyze Phone Number
**POST** `/analyze`

Analyzes a phone number for spam detection and risk assessment.

**Request Body:**
```json
{
  "userId": "user_id_here",
  "phoneNumber": "+1234567890",
  "includeHistory": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "phoneNumber": "+1234567890",
    "isBlocked": false,
    "riskScore": 0.15,
    "riskLevel": "Low",
    "analysis": {
      "phoneNumber": "+1234567890",
      "riskScore": 0.15,
      "riskLevel": "Low",
      "suspiciousPatterns": ["US number"],
      "isKnownScam": false
    },
    "callHistory": [...],
    "recommendation": "Number appears to be legitimate."
  }
}
```

## Data Models

### CallLog
```json
{
  "_id": "call_log_id",
  "userId": "user_id",
  "phoneNumber": "+1234567890",
  "callerName": "John Doe",
  "callType": "incoming|outgoing|missed|rejected|blocked",
  "timestamp": "2024-03-04T10:30:00Z",
  "duration": 120,
  "isSpam": false,
  "isBlocked": false,
  "riskScore": 0.15,
  "riskLevel": "Low|Medium|High|Critical",
  "suspiciousPatterns": ["pattern1", "pattern2"],
  "callerInfo": {
    "name": "John Doe",
    "type": "personal|business|mobile",
    "location": "New York, USA",
    "carrier": "Verizon",
    "email": "john@example.com",
    "gender": "male|female|unknown",
    "verified": true,
    "source": "contacts|truecaller-database|backend",
    "spamCount": 0,
    "searchCount": 150
  },
  "contactSource": "contacts|truecaller-database|backend|unknown",
  "isReported": false,
  "reportReason": "spam|harassment|scam",
  "reportNotes": "User reported as spam",
  "deviceInfo": {
    "deviceId": "device_123",
    "platform": "android",
    "appVersion": "1.0.0"
  },
  "createdAt": "2024-03-04T10:30:00Z",
  "updatedAt": "2024-03-04T10:30:00Z"
}
```

### BlockedNumber
```json
{
  "_id": "blocked_number_id",
  "userId": "user_id",
  "phoneNumber": "+1234567890",
  "callerName": "Spam Caller",
  "blockReason": "spam|harassment|scam|telemarketing|unknown|user_preference",
  "blockDate": "2024-03-04T10:30:00Z",
  "isTemporary": false,
  "unblockDate": null,
  "isActive": true,
  "riskScore": 0.9,
  "riskLevel": "Critical",
  "suspiciousPatterns": ["pattern1", "pattern2"],
  "reportCount": 5,
  "lastReportDate": "2024-03-04T10:30:00Z",
  "deviceInfo": {
    "deviceId": "device_123",
    "platform": "android",
    "appVersion": "1.0.0"
  },
  "createdAt": "2024-03-04T10:30:00Z",
  "updatedAt": "2024-03-04T10:30:00Z"
}
```

## Risk Scoring

### Risk Score Range
- **0.0 - 0.3**: Low risk (Legitimate)
- **0.3 - 0.5**: Medium risk (Caution)
- **0.5 - 0.7**: High risk (Suspicious)
- **0.7 - 1.0**: Critical risk (Dangerous)

### Risk Level Mapping
- **Low**: Risk score < 0.3
- **Medium**: Risk score 0.3 - 0.5
- **High**: Risk score 0.5 - 0.7
- **Critical**: Risk score > 0.7

## Suspicious Patterns

The system detects various suspicious patterns:
- International numbers with unusual prefixes
- Fake number patterns (000, 999, repeated digits)
- Premium rate numbers (900, 866, 877, 888)
- Sequential numbers
- Unusually short or long numbers
- Known scam prefixes

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common Error Codes
- **400**: Bad Request (Missing required fields)
- **401**: Unauthorized (Invalid or missing token)
- **404**: Not Found (Resource not found)
- **500**: Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Sync operations**: 10 requests per minute
- **Analysis operations**: 30 requests per minute
- **Block/Unblock operations**: 20 requests per minute
- **Statistics operations**: 60 requests per minute

## Webhooks

The system supports webhooks for real-time notifications:

### Call State Changed
```json
{
  "event": "call_state_changed",
  "userId": "user_id",
  "phoneNumber": "+1234567890",
  "state": "ringing|answered|missed|blocked",
  "timestamp": "2024-03-04T10:30:00Z"
}
```

### Spam Detected
```json
{
  "event": "spam_detected",
  "userId": "user_id",
  "phoneNumber": "+1234567890",
  "riskScore": 0.9,
  "riskLevel": "Critical",
  "timestamp": "2024-03-04T10:30:00Z"
}
```

## Integration Examples

### Flutter/Dart Integration
```dart
// Sync call logs
final response = await http.post(
  Uri.parse('https://backend-0s9d.onrender.com/api/call-protection/sync'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'userId': userId,
    'callLogs': callLogs.map((call) => call.toJson()).toList(),
    'deviceInfo': deviceInfo,
  }),
);

// Analyze phone number
final analysisResponse = await http.post(
  Uri.parse('https://backend-0s9d.onrender.com/api/call-protection/analyze'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'userId': userId,
    'phoneNumber': phoneNumber,
    'includeHistory': true,
  }),
);
```

### JavaScript Integration
```javascript
// Block phone number
const blockResponse = await fetch('/api/call-protection/block', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'user_id_here',
    phoneNumber: '+1234567890',
    blockReason: 'spam'
  })
});

const result = await blockResponse.json();
```

## Testing

### Test Endpoints
- **Health Check**: `GET /api/health`
- **Statistics**: `GET /api/stats`

### Mock Data
The API provides mock data for testing purposes. Use the test phone numbers:
- `+1234567890`: Legitimate caller
- `+0987654321`: Spam caller
- `+18005551234`: IRS scam
- `+15551234567`: Business caller

## Support

For API support and questions:
- Email: support@decepticall.com
- Documentation: https://docs.decepticall.com
- Status Page: https://status.decepticall.com
