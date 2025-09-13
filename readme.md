# Real-Time Polling Application API

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Update `.env` with your database URL
5. Run database migration: `npm run db:migrate`
6. Start the server: `npm run dev`

## API Endpoints

### Users
- POST /api/users - Create user
- GET /api/users/:id - Get user by ID

### Polls
- POST /api/polls - Create poll
- GET /api/polls - Get all published polls
- GET /api/polls/:id - Get poll by ID

### Votes
- POST /api/votes - Submit vote
- GET /api/votes/poll/:pollId - Get votes for a poll

## WebSocket Usage

Connect to WebSocket and send:
```json
{
  "type": "join-poll",
  "pollId": "poll-id-here"
}