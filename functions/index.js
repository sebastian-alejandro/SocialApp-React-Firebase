const functions = require('firebase-functions');
const express = require('express');
const app = express();

const FBAuth = require('./util/firebaseAuth');
const { getAllPosts, getPost, writeOnePost, commentOnPost } = require('./repos/posts');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./repos/users');

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


exports.api = functions.https.onRequest(app);