# DECEPTICALL Backend API

A Node.js + Express + MongoDB backend API for the DECEPTICALL mobile application with comprehensive call protection features.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **User Management**: Admin can view all users and their details
- **Website Security**: Phishing detection for websites
- **Call Protection**: Real-time call monitoring, spam detection, and call blocking
- **Contact Integration**: Device contacts integration for caller ID
- **Reports**: Track user detection history and statistics
- **MongoDB Integration**: Scalable database with proper schemas

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## API Endpoints

### Authentication
- `POST /api/signup` - Register new user
- `POST /api/login` - User login
- `GET /api/profile` - Get current user profile

### User Management (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/user/:id` - Get specific user with reports
- `PUT /api/user/profile` - Update user profile

### Call Protection
- `POST /api/call-protection/sync` - Sync call logs from device
- `GET /api/call-protection/call-history` - Get user's call history
- `POST /api/call-protection/block` - Block a phone number
- `POST /api/call-protection/unblock` - Unblock a phone number
- `GET /api/call-protection/blocked-numbers` - Get blocked numbers
- `POST /api/call-protection/report-spam` - Report spam call
- `GET /api/call-protection/statistics` - Get call protection statistics
- `POST /api/call-protection/analyze` - Analyze phone number

### Reports
- `POST /api/check-website` - Check website for phishing
- `GET /api/reports/:userId` - Get user's reports
- `GET /api/reports` - Get all reports (Admin only)

### Caller ID & TrueCaller Integration
- `POST /api/caller-id` - Get caller ID information
- `POST /api/truecaller-lookup` - TrueCaller API lookup
- `POST /api/block-number` - Block number (legacy)
- `POST /api/unblock-number` - Unblock number (legacy)
- `POST /api/report-spam` - Report spam (legacy)
- `GET /api/blocked-numbers` - Get blocked numbers (legacy)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd decepticall/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/decepticall?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Setup Call Protection (Optional)**
   ```bash
   # Setup call protection database and sample data
   npm run setup:call-protection
   ```

### MongoDB Setup

1. **MongoDB Atlas (Recommended)**
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Get your connection string
   - Update the `MONGODB_URI` in your `.env` file

2. **Local MongoDB**
   - Install MongoDB locally
   - Start MongoDB service
   - Use `mongodb://localhost:27017/decepticall` as your `MONGODB_URI`

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  role: String (enum: ["user", "admin"]),
  createdAt: Date,
  updatedAt: Date
}
```

### Reports Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: String (enum: ["Website", "Call", "Message", "Email"]),
  status: String (enum: ["Fake", "Safe"]),
  data: String,
  details: String,
  createdAt: Date,
  updatedAt: Date
}
```

## API Response Format

All API responses follow this format:
```javascript
{
  "success": boolean,
  "message": string,
  "data": object | array
}
```

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Input Validation**: Request validation and sanitization
- **CORS Protection**: Configured for specific origins
- **Role-based Access**: Admin-only endpoints protected

## Development

### Project Structure
```
backend/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── userController.js  # User management
│   └── reportController.js # Report handling
├── middleware/
│   └── auth.js            # Authentication middleware
├── models/
│   ├── User.js            # User schema
│   └── Report.js           # Report schema
├── routes/
│   ├── authRoutes.js      # Auth endpoints
│   ├── userRoutes.js      # User endpoints
│   └── reportRoutes.js     # Report endpoints
├── server.js              # Main server file
├── package.json           # Dependencies
└── README.md              # This file
```

### Testing the API

Use tools like Postman or curl to test the endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","email":"john@example.com","phone":"+1234567890","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## Production Deployment

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use strong JWT secrets
   - Configure proper MongoDB URI

2. **Security**
   - Enable HTTPS
   - Use environment variables for secrets
   - Implement rate limiting
   - Add request logging

3. **Monitoring**
   - Add health check endpoints
   - Implement logging
   - Set up error tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.