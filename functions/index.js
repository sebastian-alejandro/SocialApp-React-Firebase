const functions = require('firebase-functions');
const express = require('express');
const app = express();

const FBAuth = require('./util/firebaseAuth');
const { getAllPosts, writeOnePost } = require('./repos/posts');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./repos/users');

//User routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user', FBAuth, addUserDetails);
app.post('/user/uploadImage', FBAuth, uploadImage);

app.get('/user', FBAuth, getAuthenticatedUser);

//Posts route
app.get('/posts', getAllPosts);
app.post('/post', FBAuth, writeOnePost);


exports.api = functions.https.onRequest(app);