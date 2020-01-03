const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from my SocialApp in Firebase!");
});

exports.getPosts = functions.https.onRequest((request, response) => {
    admin.firestore().collection('posts').get()
        .then(data => {
            let posts = [];
            data.forEach(doc => {
                posts.push(doc.data());
            });
            return response.json(posts);
        })
        .catch((err) => console.error(err));
})

exports.createPost = functions.https.onRequest((request, response) => {
    const newPost = {
        body: request.body.body,
        userHandle: request.body.userHandle,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
    };

    admin.firestore()
        .collection('posts')
        .add(newPost)
        .then(doc => {
            response.json({ message: `document`})
        })
})