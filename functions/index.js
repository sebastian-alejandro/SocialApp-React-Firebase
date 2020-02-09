const functions = require('firebase-functions');
const express = require('express');
const app = express();

const FBAuth = require('./util/firebaseAuth');
const {
    getAllPosts,
    getPost,
    writeOnePost,
    commentOnPost,
    likePost,
    unlikePost,
    deletePost
} = require('./repos/posts');

const {
    signup,
    login,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser
} = require('./repos/users');

//User routes
app.post('/signup', signup);
app.post('/login', login);

app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.post('/user/uploadImage', FBAuth, uploadImage);

//Posts route
app.get('/posts', getAllPosts);
app.post('/post', FBAuth, writeOnePost);
app.get('/post/:postId', getPost);
app.post('/post/:postId/comment', FBAuth, commentOnPost);
app.get('/post/:postId/like', FBAuth, likePost);
app.get('/post/:postId/unlike', FBAuth, unlikePost);
app.delete('/post/:postId', FBAuth, deletePost);



exports.api = functions.https.onRequest(app);