const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

admin.initializeApp();

const firebaseConfig = {
    apiKey: "AIzaSyC9Nm1M9NrVZxjfXabhcAdu2-6_6w0IpQM",
    authDomain: "socialapp-263614.firebaseapp.com",
    databaseURL: "https://socialapp-263614.firebaseio.com",
    projectId: "socialapp-263614",
    storageBucket: "socialapp-263614.appspot.com",
    messagingSenderId: "950398256620",
    appId: "1:950398256620:web:ddd69752394d8ff0e06cc9"
};

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

app.post('/signup', (request, response) => {

    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    }

    // TODO: validate data

    firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        .then(data => {
            return response
                .status(201)
                .json({
                    message: `user ${data.user.uid} signed up successfully`
                })
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        })
});

app.get('/posts', (request, response) => {
    admin
        .firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {

            let posts = [];

            data.forEach(document => {
                posts.push({
                    postId: document.id,
                    body: document.data().body,
                    userHandle: document.data().userHandle,
                    createdAt: document.data().createdAt
                });
            });

            return response.json(posts);
        })
        .catch((err) => console.error(err));
});

app.post('/post', (request, response) => {

    const newPost = {
        body: request.body.body,
        userHandle: request.body.userHandle,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
    };

    admin.firestore()
        .collection('posts')
        .add(newPost)
        .then(doc => {
            response.json({ message: `document ${doc.id} created successfully` });
        })
        .catch(err => {
            response.status(500).json({ error: 'Something went wrong!!' });
            console.error(err);
        })
})

exports.api = functions.https.onRequest(app);