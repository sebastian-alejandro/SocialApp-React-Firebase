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
                    createdAt: document.data().createdAt,
                    commentCount: doc.data().commentCount,
                    likeCount: doc.data().likeCount,
                    userImage: doc.data().userImage,
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
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        userImage: request.user.imageUrl,
        likeCount: 0,
        commentCount: 0,
    };

    db.collection('posts')
        .add(newPost)
        .then(doc => {
            const responsePost = newPost;
            responsePost.postId = doc.id;
            response.json(responsePost);
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

    if (request.body.body.trim() === '')
        return response.status(400), json({
            comment: 'Must not be empty'
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
            if (!doc.exists) {
                return response.status(404).json({
                    error: 'Post not found'
                });
            }
            return doc.ref.update({ commentCount: doc.data().commentCount +1 });
        })
        .then(() => {
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

exports.likePost = (request, response) => {

    const likeDocument = db.collection('likes').where('userName', '==', request.user.name)
        .where('postId', '==', request.params.postId).limit(1);

    const postDocument = db.doc(`/posts/${request.params.postId}`);

    let postData;

    postDocument.get()
        .then((doc) => {
            if (doc.exists) {
                postData = doc.data();
                postData.postId = doc.id;
                return likeDocument.get();
            } else {
                return response.status(404).json({
                    error: 'Post not found'
                })
            }
        })
        .then((data) => {
            if (data.empty) {
                return db.collection('likes').add({
                    postId: request.params.postId,
                    userName: request.user.name,
                })
                    .then(() => {
                        postData.likeCount++;
                        return postDocument.update({
                            likeCount: postData.likeCount,
                        })
                    })
                    .then(() => {
                        return response.json(postData);
                    })
            } else {
                return response.status(400).json({
                    error: 'Post already liked'
                });
            }
        })
        .catch((err) => {
            console.error(err);
            response.status(500).json({ error: err.code });
        })

};

exports.unlikePost = (request, response) => {

    const likeDocument = db.collection('likes').where('userName', '==', request.user.name)
        .where('postId', '==', request.params.postId).limit(1);

    const postDocument = db.doc(`/posts/${request.params.postId}`);

    let postData;

    postDocument.get()
        .then((doc) => {
            if (doc.exists) {
                postData = doc.data();
                postData.postId = doc.id;
                return likeDocument.get();
            } else {
                return response.status(404).json({
                    error: 'Post not found'
                })
            }
        })
        .then((data) => {
            if (data.empty) {
                return response.status(400).json({
                    error: 'Post not liked'
                });
            } else {
                return db.doc(`/likes/${data.docs[0].id}`)
                    .delete()
                    .then(() => {
                        postData.likeCount--;
                        return postDocument.update({ likeCount: postData.likeCount });
                    })
                    .then(() => {
                        response.json(postData);
                    })
            }
        })
        .catch((err) => {
            console.error(err);
            response.status(500).json({ error: err.code });
        })
};

exports.deletePost = (request, response) => {

    const document = db.doc(`/posts/${request.params.postId}`);
    document.get()
        .then((doc) => {
            if(!doc.exists){
                return response.status(404).json({ error: 'Post not found'});
            }
            if(doc.data().userName !== request.user.name){
                return response.status(403).json({ error: 'Unauthorized'});
            } else {
                return document.delete();
            }
        })
        .then(() => {
            response.json({ message: 'Post deleted successfully'});
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        })
};