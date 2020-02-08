const { admin, db } = require('../database/admin');

exports.getAllPosts = (request, response) => {
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
};

exports.writeOnePost = (request, response) => {

    if (request.body.body.trim() === '') {
        return response.status(400).json({
            body: 'Body must not be empty'
        })
    }
    const newPost = {
        body: request.body.body,
        userName: request.user.name,
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
};

exports.getPost = (request, response) => {

    let postData = {};

    db.doc(`/posts/${request.params.postId}`)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({
                    error: 'Post not found',
                })
            }
            postData = doc.data();
            postData.postId = doc.id;
            return db
                .collection('comments')
                .orderBy('createdAt', 'asc')
                .where('postId', '==', request.params.postId)
                .get();
        })
        .then((data) => {
            postData.comments = [];
            data.forEach((doc) => {
                postData.comments.push(doc.data());
            });
            return response.json(postData);
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        })
};

exports.commentOnPost = (request, response) => {

    if(request.body.body.trim() === '')
        return response.status(400),json({
            error: 'Must not be empty'
        });
    const newComment = {
        body: request.body.body,
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        postId: request.params.postId,
        userName: request.user.name,
        userImage: request.user.imageUrl
    };

    db.doc(`/posts/${request.params.postId}`)
        .get()
        .then((doc) => {
            if(!doc.exists){
                return response.status(404).json({
                    error: 'Post not found'
                });
            }
            return db.collection('comments').add(newComment);
        })
        .then(() => {
            response.json(newComment);
        })
        .catch(err => {
            console.log(err);
            response.status(500).json({
                error: 'Something went wrong'
            });
        })
};