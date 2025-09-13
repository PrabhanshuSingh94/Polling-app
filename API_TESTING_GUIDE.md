# API Testing Guide for Polling Application

## Server Information
- **Base URL:** http://localhost:3001
- **WebSocket URL:** ws://localhost:3001

## 1. Test Server Health

### GET /test
```bash
curl http://localhost:3001/test
```

**Expected Response:**
```json
{
  "message": "Server is working"
}
```

---

## 2. User Management APIs

### Create User
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "id": "clx1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Get User by ID
```bash
curl http://localhost:3001/api/users/clx1234567890
```

**Expected Response:**
```json
{
  "id": "clx1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "polls": []
}
```

---

## 3. Poll Management APIs

### Create Poll
```bash
curl -X POST http://localhost:3001/api/polls \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is your favorite programming language?",
    "options": ["JavaScript", "Python", "Java", "C++", "Go"],
    "creatorId": "clx1234567890",
    "isPublished": true
  }'
```

**Expected Response:**
```json
{
  "id": "clx9876543210",
  "question": "What is your favorite programming language?",
  "isPublished": true,
  "createdAt": "2024-01-15T10:35:00.000Z",
  "updatedAt": "2024-01-15T10:35:00.000Z",
  "creatorId": "clx1234567890",
  "options": [
    {"id": "opt1", "text": "JavaScript"},
    {"id": "opt2", "text": "Python"},
    {"id": "opt3", "text": "Java"},
    {"id": "opt4", "text": "C++"},
    {"id": "opt5", "text": "Go"}
  ],
  "creator": {
    "id": "clx1234567890",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Get All Published Polls
```bash
curl http://localhost:3001/api/polls
```

**Expected Response:**
```json
[
  {
    "id": "clx9876543210",
    "question": "What is your favorite programming language?",
    "isPublished": true,
    "createdAt": "2024-01-15T10:35:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z",
    "creator": {
      "id": "clx1234567890",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "options": [
      {
        "id": "opt1",
        "text": "JavaScript",
        "_count": {"votes": 0}
      },
      {
        "id": "opt2",
        "text": "Python",
        "_count": {"votes": 0}
      }
    ]
  }
]
```

### Get Poll by ID
```bash
curl http://localhost:3001/api/polls/clx9876543210
```

**Expected Response:** Same as above but for a single poll

---

## 4. Voting APIs

### Submit Vote
```bash
curl -X POST http://localhost:3001/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "clx1234567890",
    "pollOptionId": "opt1"
  }'
```

**Expected Response:**
```json
{
  "id": "vote123",
  "createdAt": "2024-01-15T10:40:00.000Z",
  "userId": "clx1234567890",
  "pollOptionId": "opt1",
  "user": {
    "id": "clx1234567890",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "pollOption": {
    "id": "opt1",
    "text": "JavaScript",
    "poll": {
      "id": "clx9876543210",
      "question": "What is your favorite programming language?"
    }
  }
}
```

### Get Votes for a Poll
```bash
curl http://localhost:3001/api/votes/poll/clx9876543210
```

**Expected Response:**
```json
[
  {
    "id": "vote123",
    "user": {
      "id": "clx1234567890",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "pollOption": {
      "id": "opt1",
      "text": "JavaScript"
    }
  }
]
```

---

## 5. WebSocket Testing

### Connect to WebSocket
```javascript
// In browser console or WebSocket client
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected to WebSocket');
  
  // Join a poll to receive real-time updates
  ws.send(JSON.stringify({
    type: 'join-poll',
    pollId: 'clx9876543210'  // Replace with actual poll ID
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received update:', data);
  
  // Expected format:
  // {
  //   "type": "poll-update",
  //   "pollId": "clx9876543210",
  //   "results": [
  //     {"id": "opt1", "text": "JavaScript", "voteCount": 1},
  //     {"id": "opt2", "text": "Python", "voteCount": 0}
  //   ]
  // }
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

---

## 6. Complete Testing Workflow

### Step 1: Create Users
```bash
# Create first user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com", "password": "password123"}'

# Create second user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob", "email": "bob@example.com", "password": "password123"}'
```

### Step 2: Create Poll
```bash
curl -X POST http://localhost:3001/api/polls \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Which framework do you prefer?",
    "options": ["React", "Vue", "Angular", "Svelte"],
    "creatorId": "USER_ID_FROM_STEP_1",
    "isPublished": true
  }'
```

### Step 3: Connect WebSocket
```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'join-poll',
    pollId: 'POLL_ID_FROM_STEP_2'
  }));
};
```

### Step 4: Submit Votes
```bash
# Vote from first user
curl -X POST http://localhost:3001/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "ALICE_USER_ID",
    "pollOptionId": "REACT_OPTION_ID"
  }'

# Vote from second user
curl -X POST http://localhost:3001/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "BOB_USER_ID",
    "pollOptionId": "VUE_OPTION_ID"
  }'
```

### Step 5: Check Results
```bash
# Get updated poll with vote counts
curl http://localhost:3001/api/polls/POLL_ID_FROM_STEP_2
```

---

## 7. Error Testing

### Test Duplicate Email
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com", "password": "password123"}'
```

### Test Duplicate Vote
```bash
curl -X POST http://localhost:3001/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "SAME_USER_ID",
    "pollOptionId": "SAME_OPTION_ID"
  }'
```

### Test Invalid Poll ID
```bash
curl http://localhost:3001/api/polls/invalid-id
```

---

## 8. Using Postman Collection

You can also import these requests into Postman:

1. Create a new collection called "Polling App API"
2. Set base URL variable: `{{baseUrl}}` = `http://localhost:3001`
3. Add all the above requests with proper headers and body

---

## 9. Testing Tools

### Browser Testing
- Open browser developer tools
- Use the Console tab for WebSocket testing
- Use the Network tab to monitor API calls

### Command Line Tools
- **curl** (shown above)
- **httpie**: `pip install httpie` then `http POST localhost:3001/api/users name=John email=john@example.com password=password123`

### GUI Tools
- **Postman**
- **Insomnia**
- **Thunder Client** (VS Code extension)

---

## Notes

- Replace placeholder IDs with actual IDs returned from the API
- The server must be running on port 3001
- WebSocket updates are sent automatically when votes are submitted
- All timestamps are in ISO format
- Passwords are automatically hashed using bcrypt
