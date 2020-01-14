const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();
const firebase = require('firebase');

admin.initializeApp();
const db = admin.firestore();

const firebaseConfig = {
    apiKey: "AIzaSyC9Nm1M9NrVZxjfXabhcAdu2-6_6w0IpQM",
    authDomain: "socialapp-263614.firebaseapp.com",
    databaseURL: "https://socialapp-263614.firebaseio.com",
    projectId: "socialapp-263614",
    storageBucket: "socialapp-263614.appspot.com",
    messagingSenderId: "950398256620",
    appId: "1:950398256620:web:ddd69752394d8ff0e06cc9"
};
firebase.initializeApp(firebaseConfig);

const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
}

const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(emailRegEx)) return true;
    else return false;
}

app.post('/signup', (request, response) => {

    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        name: request.body.name,
    }

    let errors = {};

    if (isEmpty(newUser.email)) {
        errors.email = 'Email must not be empty';
    } else if (!isEmail(newUser.email)) {
        errors.email = 'Must be a valid email address';
    }

    if (isEmpty(newUser.password)) errors.password = 'Must not be empty';
    if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match';
    if (isEmpty(newUser.name)) errors.name = 'Must not be empty';

    if (Object.keys(errors).length > 0) return response.status(400).json(errors);
    // TODO: validate data

    let token, userId;
    db.doc(`/users/${newUser.name}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return response.status(400).json({ name: 'this username is already taken'});
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idToken) => {
            token = idToken;
            const userCredentials = {
                name: newUser.name,
                email: newUser.email,
                createdAt: admin.firestore.Timestamp.fromDate(new Date()),
                userId
            };
            return db.collection('users').doc(`${newUser.name}`).set(userCredentials);
        })
        .then(() => {
            return response.status(201).json({ token });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        })

});

app.get('/posts', (request, response) => {
    db.collection('posts')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {

            let posts = [];

            data.forEach(document => {
                posts.push({
                    postId: document.id,
                    body: document.data().body,
                    userName: document.data().userName,
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
        userName: request.body.userHandle,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
    };

    db.collection('posts')
        .add(newPost)
        .then(doc => {
            response.json({ message: `document ${doc.id} created successfully` });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: 'Something went wrong!!' });
        })
})

exports.api = functions.https.onRequest(app);