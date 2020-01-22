const functions = require('firebase-functions');
const express = require('express');
const app = express();

const FBAuth = require('./util/firebaseAuth');
const { getAllPosts, writeOnePost } = require('./repos/posts');
const { signup, login } = require('./repos/users');

//Signup-Signin routes
app.post('/signup', signup);
app.post('/login', login);

//Posts route
app.get('/posts', getAllPosts);
app.post('/post', FBAuth, writeOnePost);


exports.api = functions.https.onRequest(app);