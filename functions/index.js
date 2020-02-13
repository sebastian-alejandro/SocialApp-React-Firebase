const functions = require('firebase-functions');
const express = require('express');
const app = express();

const { admin, db } = require('./database/admin')

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
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
} = require('./repos/users');

//User routes
app.post('/signup', signup);
app.post('/login', login);

app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:name', getUserDetails);
app.post('/user/uploadImage', FBAuth, uploadImage);
app.post('/notifications', FBAuth, markNotificationsRead)

//Posts route
app.get('/posts', getAllPosts);
app.post('/post', FBAuth, writeOnePost);
app.get('/post/:postId', getPost);
app.post('/post/:postId/comment', FBAuth, commentOnPost);
app.get('/post/:postId/like', FBAuth, likePost);
app.get('/post/:postId/unlike', FBAuth, unlikePost);
app.delete('/post/:postId', FBAuth, deletePost);



exports.api = functions.https.onRequest(app);
exports.createNotificationOnLike = functions.firestore
    .document('likes/{id}')
    .onCreate((snapshot) => {
        db.doc(`/posts/${snapshot.data().postId}`)
            .get()
            .then((doc) => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        receiver: doc.data().userName,
                        sender: snapshot.data().userName,
                        postId: doc.id,
                        type: 'like',
                        read: false,
                        createdAt: admin.firestore.Timestamp.fromDate(new Date())
                    })
                }
            })
            .then(() => {
                return
            })
            .catch((err) => {
                console.error(err);
                return;
            })
    })

exports.deleteNotificationOnUnlike = functions.firestore
    .document('likes/{id}')
    .onDelete((snapshot) => {
        db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
                return;
            })
    })

exports.createNotificationOnComment = functions.firestore
    .document('comments/{id}')
    .onCreate((snapshot) => {
        db.doc(`/posts/${snapshot.data().postId}`)
            .get()
            .then((doc) => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        receiver: doc.data().userName,
                        sender: snapshot.data().userName,
                        postId: doc.id,
                        type: 'comment',
                        read: false,
                        createdAt: admin.firestore.Timestamp.fromDate(new Date())
                    })
                }
            })
            .then(() => {
                return
            })
            .catch((err) => {
                console.error(err);
                return;
            })
    })