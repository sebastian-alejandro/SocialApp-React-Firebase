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
        return db.doc(`/posts/${snapshot.data().postId}`)
            .get()
            .then((doc) => {
                if (doc.exists && doc.data().userName !== snapshot.data().userName) {
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
            .catch((err) => {
                console.error(err);
            })
    })

exports.deleteNotificationOnUnlike = functions.firestore
    .document('likes/{id}')
    .onDelete((snapshot) => {
        return db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch((err) => {
                console.error(err);
            })
    })

exports.createNotificationOnComment = functions.firestore
    .document('comments/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/posts/${snapshot.data().postId}`)
            .get()
            .then((doc) => {
                if (doc.exists && doc.data().userName !== snapshot.data().userName) {
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
            .catch((err) => {
                console.error(err);
            })
    })
//ToDo: change image user in '/comments/' collection
exports.onUserImageChange = functions.firestore
    .document('/users/{userId}')
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());

        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            console.log('image has changed');
            let batch = db.batch();
            return db.collection('posts')
                .where('userName', '==', change.before.data().name)
                .get()
                .then((data) => {
                    data.forEach((doc) => {
                        const post = db.doc(`/posts/${doc.id}`);
                        batch.update(post, { userImage: change.after.data().imageUrl });
                    })
                    return batch.commit();
                })
        } else return true;

    })

exports.onPostDeleted = functions.firestore
    .document('/posts/{postId}')
    .onDelete((snapshot, context) => {
        const postId = context.params.postId;
        const batch = db.batch();
        return db.collection('comments').where('postId', '==', postId)
            .get()
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                })
                return db.collection('likes')
                    .where('postId', '==', postId)
                    .get();
            })
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                })
                return db.collection('notifications')
                    .where('postId', '==', postId)
                    .get();
            })
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                })
                return batch.commit();
            })
            .catch((err) => {
                console.error(err);
            })
    })