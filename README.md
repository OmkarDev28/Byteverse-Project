https://byteverse-project-1.onrender.com

Endpoint: POST /api/register
{
  "username": "omkar",
  "password": "xyz"
}

Response (201 - Created):
{
  "message": "User registered",
  "user": {
    "id": 1,
    "username": "john_doe"
  }
}

Endpoint:
POST /api/login

Request Body (JSON):

{
  "username": "omkar",
  "password": "xyz"
}


Response (200 - OK):

{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "omkar"
  },
  "token": "<JWT_ACCESS_TOKEN>",
  "refreshToken": "<JWT_REFRESH_TOKEN>"
}

POST /api/token

Request Body (JSON):

{
  "refreshToken": "<JWT_REFRESH_TOKEN>"
}


Response (200 - OK):

{
  "token": "<NEW_JWT_ACCESS_TOKEN>"
}

POST /api/upload-post

🧾 Content Type

multipart/form-data

🧩 Request Fields
Field	Type	Required	Description
file	File	✅	The image or media file to upload
id	String	✅	User ID of the uploader
caption	String	❌	Optional caption for the post

Response — 200 OK
{
  "message": "File uploaded successfully.",
  "path": "user_posts/12345/ae94b8c9ef6d2a0d.jpg",
  "publicUrl": "https://your-supabase-url/storage/v1/object/public/photo_app/user_posts/12345/ae94b8c9ef6d2a0d.jpg"
}

PUT /api/edit-post/:postID

Param	Type	Required	Description
postID	String	✅	The unique ID of the post to edit

Field	Type	Required	Description
id	String	✅	User ID of the editor (must match post owner)
updatedPostCaption	String	✅	New caption for the post

Response — 200 OK
{
  "message": "Post updated successfully",
  "updatedPost": [
    {
      "post_id": "abcd123",
      "user_id": "12345",
      "caption": "New updated caption",
      "post_path": "user_posts/12345/ae94b8c9ef6d2a0d.jpg",
      "created_at": "2025-11-01T10:20:00Z"
    }
  ]
}
}

POST /api/add-comment/:postId
Param	Type	Required	Description
postId	String	✅	ID of the post to comment on

Field	Type	Required	Description
id	String	✅	ID of the user posting the comment
commentText	String	✅	The content of the comment

Response — 200 OK
{
  "message": "Comment added"
}

/api/delete-comment/:commentID
Param	Type	Required	Description
commentID	String	✅	ID of the comment to delete

Response — 200 OK
{
  "message": "Comment deleted successfully."
}

PUT /api/edit-comment/:commentID

Param	Type	Required	Description
commentID	String	✅	ID of the comment to edit

Field	Type	Required	Description
id	String	✅	ID of the user editing the comment
updatedCommentText	String	✅	New text for the comment

Response — 200 OK
{
  "message": "Comment updated successfully.",
  "updated": {
    "comment_id": "cmt123",
    "post_id": "post567",
    "user_id": "usr789",
    "comment_text": "New updated comment text",
    "created_at": "2025-11-01T12:40:00Z"
  }
}
