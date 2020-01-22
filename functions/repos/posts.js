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