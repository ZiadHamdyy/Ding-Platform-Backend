# Sprint 2 – Post Management & Interactions Implementation Summary

## Overview
Sprint 2 focused on implementing a comprehensive post management system with media uploads, privacy controls, and social interactions (likes and comments) for the Ding Platform.

---

## Post Management System

### Post Creation
- **Rich Content**: Text-based posts with optional media attachments
- **Media Support**: Images and videos via Cloudinary integration
- **Multiple Media**: Support for multiple media files per post
- **Privacy Controls**: Five privacy levels (PUBLIC, FRIENDS, FRIENDS_OF_FRIENDS, ONLY_ME, CUSTOM)
- **Custom Audiences**: Specify individual users for CUSTOM privacy posts
- **Validation**: Content length limits and media type validation

### Post CRUD Operations
- **Create**: Authenticated users can create posts with media
- **Read**: Retrieve all posts or single post by ID
- **Update**: Edit post content and privacy settings
- **Delete**: Soft delete with `isDeleted` flag and `deletedAt` timestamp
- **Authorization**: Only post authors can update/delete their posts

### Post History Tracking
- **Audit Trail**: All post changes tracked in `PostHistory` table
- **Change Types**: CREATED, UPDATED, DELETED, RESTORED
- **Version Control**: Stores previous content, media, and privacy settings
- **Timestamps**: Records when each change occurred

---

## Media Management

### Cloudinary Integration
- **Image Upload**: Supports JPEG, PNG, GIF, WebP formats
- **Video Upload**: Supports MP4, WebM, MOV formats
- **Batch Upload**: Multiple files uploaded in parallel
- **Metadata Storage**: URL, public ID, size, dimensions stored in database
- **Validation**: File type and size validation before upload
- **Error Handling**: Graceful failure with detailed error messages

### Media Storage Schema
```prisma
model PostMedia {
  id        String    @id @default(uuid())
  postId    String
  post      Post      @relation(fields: [postId], references: [id])
  url       String
  type      MediaType
  publicId  String    // Cloudinary public ID for deletion
  size      Int       // File size in bytes
  width     Int?
  height    Int?
  createdAt DateTime  @default(now())
}

enum MediaType {
  IMAGE
  VIDEO
}
```

---

## Privacy System

### Privacy Levels
1. **PUBLIC**: Visible to everyone
2. **FRIENDS**: Visible to friends only
3. **FRIENDS_OF_FRIENDS**: Visible to friends and their friends
4. **ONLY_ME**: Visible only to the author
5. **CUSTOM**: Visible to specific users only

### Custom Audience
- **User Selection**: Specify individual users who can see the post
- **Database Storage**: `PostAudience` table links posts to allowed users
- **Flexible Control**: Granular privacy beyond predefined levels

### Privacy Schema
```prisma
model PostAudience {
  id        String   @id @default(uuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  userId    String
  createdAt DateTime @default(now())
  
  @@unique([postId, userId])
}
```

---

## Post Interactions

### Like System
- **Toggle Functionality**: Like/unlike with single endpoint
- **Unique Constraint**: One like per user per post
- **Like Count**: Aggregated count included in post responses
- **Notifications**: Post author notified when someone likes their post
- **Paginated List**: Retrieve all users who liked a post

### Like Schema
```prisma
model Like {
  id        String   @id @default(uuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  
  @@unique([postId, userId])
}
```

### Comment System
- **Nested Comments**: Support for threaded replies
- **Parent-Child Relationship**: Self-referencing relation for comment threads
- **Reply Preview**: Top-level comments show preview of replies
- **Reply Count**: Number of replies included in response
- **CRUD Operations**: Create, read, delete comments
- **Notifications**: Post author notified of new comments
- **Authorization**: Only comment authors can delete their comments

### Comment Schema
```prisma
model Comment {
  id        String    @id @default(uuid())
  content   String    @db.Text
  postId    String
  post      Post      @relation(fields: [postId], references: [id])
  authorId  String
  author    User      @relation(fields: [authorId], references: [id])
  parentId  String?
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

---

## Notification Integration

### Notification Types
- **POST_LIKE**: Sent when someone likes a post
- **POST_COMMENT**: Sent when someone comments on a post

### Notification Service Methods
- `notifyPostLike(likerId, postAuthorId, postId)`: Sends like notification
- `notifyPostComment(commenterId, postAuthorId, postId, commentContent)`: Sends comment notification

### Features
- **Self-exclusion**: Users don't receive notifications for their own actions
- **Content Preview**: Comment notifications include truncated content
- **Actor Information**: Includes name and profile of user who performed action
- **Metadata**: Stores post ID and action details in notification data

---

## API Endpoints

### Post Management
- `POST /api/posts` – Create new post with media
- `GET /api/posts` – Get all posts (paginated)
- `GET /api/posts/:id` – Get single post by ID
- `PUT /api/posts/:id` – Update post (author only)
- `DELETE /api/posts/:id` – Soft delete post (author only)

### Post Interactions
- `POST /api/posts/:id/like` – Toggle like on post
- `GET /api/posts/:id/likes` – Get users who liked post (paginated)
- `POST /api/posts/:id/comments` – Create comment on post
- `GET /api/posts/:id/comments` – Get comments on post (paginated)
- `DELETE /api/comments/:id` – Delete comment (author only)

---

## DTOs (Data Transfer Objects)

### Request DTOs
```typescript
// CreatePostDto
{
  content: string;        // Required, max 5000 chars
  privacy: PostPrivacy;   // Required
  customAudience?: string[]; // Optional, for CUSTOM privacy
}

// UpdatePostDto
{
  content?: string;
  privacy?: PostPrivacy;
  customAudience?: string[];
}

// CreateCommentDto
{
  content: string;        // Required
  parentId?: string;      // Optional, for replies
}
```

### Response DTOs
```typescript
// PostResponseDto
{
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  privacy: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// CommentResponseDto
{
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string;
  replyCount: number;
  replies: CommentResponseDto[]; // Preview of replies
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Database Schema

### Post Model
```prisma
model Post {
  id        String      @id @default(uuid())
  content   String      @db.Text
  authorId  String
  author    User        @relation(fields: [authorId], references: [id])
  mediaUrls String[]    @default([])
  privacy   PostPrivacy @default(PUBLIC)
  isDeleted Boolean     @default(false)
  deletedAt DateTime?
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  
  PostHistory  PostHistory[]
  PostMedia    PostMedia[]
  PostAudience PostAudience[]
  Likes        Like[]
  Comments     Comment[]
}

enum PostPrivacy {
  PUBLIC
  FRIENDS
  FRIENDS_OF_FRIENDS
  ONLY_ME
  CUSTOM
}
```

---

## Validation & Error Handling

### Content Validation
- **Length Limits**: Post content max 5000 characters
- **Required Fields**: Content and privacy are required
- **Media Validation**: File type and size checks
- **Custom Audience**: Validated when privacy is CUSTOM

### Error Messages
- `POST_NOT_FOUND`: Post does not exist
- `POST_UNAUTHORIZED`: User not authorized to modify post
- `COMMENT_NOT_FOUND`: Comment does not exist
- `COMMENT_UNAUTHORIZED`: User not authorized to delete comment
- `MEDIA_UPLOAD_FAILED`: Failed to upload media to Cloudinary
- `INVALID_FILE_TYPE`: Unsupported file type
- `FILE_TOO_LARGE`: File exceeds size limit

---

## Testing Scenarios

### Post Creation Flow
1. User creates post with text content
2. User uploads images/videos
3. Media uploaded to Cloudinary
4. Post saved with media URLs
5. Post appears in feed

### Like Interaction Flow
1. User A creates a post
2. User B likes the post
3. Like count increments
4. User A receives notification
5. User B unlikes the post
6. Like count decrements

### Comment Thread Flow
1. User A creates a post
2. User B comments on the post
3. User A receives notification
4. User C replies to User B's comment
5. Comment shows nested reply
6. Reply count updates

---

## Performance Optimizations

### Database Queries
- **Pagination**: All list endpoints support page and limit
- **Eager Loading**: Author information included in queries
- **Count Aggregation**: Like and comment counts computed efficiently
- **Indexes**: Added on frequently queried fields (postId, authorId, createdAt)

### Media Handling
- **Parallel Uploads**: Multiple media files uploaded concurrently
- **CDN Delivery**: Cloudinary serves media via global CDN
- **Lazy Loading**: Media URLs stored, actual files loaded on demand

---

## Security Features

### Authorization
- **JWT Guards**: All endpoints protected by authentication
- **Ownership Checks**: Users can only modify their own posts/comments
- **Privacy Enforcement**: Posts filtered based on privacy settings
- **Input Sanitization**: All user input validated and sanitized

### Data Protection
- **Soft Delete**: Posts marked as deleted, not permanently removed
- **Audit Trail**: Post history tracks all modifications
- **Media Cleanup**: Cloudinary public IDs stored for deletion

---

## Next Steps

### Completed ✅
- Post CRUD with media uploads
- Like and comment system
- Privacy controls
- Notification integration
- Post history tracking

### Future Enhancements
- Post sharing/reposting
- Post bookmarking
- Comment editing
- Reaction types (beyond like)
- Media galleries
- Post analytics
