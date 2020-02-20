const { admin, db } = require('../database/admin');
const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators');
const config = require('../util/config');
const firebase = require('firebase');
firebase.initializeApp(config);
//const storage = firebase.storage();
//const storageRef = storage.ref();

exports.signup = (request, response) => {

    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        name: request.body.name,
    }

    const { valid, errors } = validateSignupData(newUser);

    if (!valid) return response.status(400).json(errors);

    const noImg = 'no-user-picture.png';

    let token, userId;
    db.doc(`/users/${newUser.name}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return response.status(400).json({ name: 'this username is already taken' });
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
                createdAt: new Date().toISOString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
                userId
            };
            return db.collection('users').doc(`${newUser.name}`).set(userCredentials);
        })
        .then(() => {
            return response.status(201).json({ token });
        })
        .catch((err) => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return response.status(400).json({ email: 'Email is already in use' });
            } else {
                return response.status(500).json({ general: 'Something went wrong, please try again' });
            }
        })

}

exports.login = (request, response) => {

    const user = {
        email: request.body.email,
        password: request.body.password
    };

    const { valid, errors } = validateLoginData(user);

    if (!valid) return response.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return response.json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/wrong-password') {
                return response.status(403).json({ general: 'Wrong credentials, please try again' });
            } else return response.status(500).json({ error: err.code })
        })

}

exports.addUserDetails = (request, response) => {

    let userDetails = reduceUserDetails(request.body);

    db.doc(`/users/${request.user.name}`)
        .update(userDetails)
        .then(() => {
            return response.json({ message: 'Details added successfully' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
}

exports.getAuthenticatedUser = (request, response) => {

    let userData = {};

    db.doc(`/users/${request.user.name}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                userData.credentials = doc.data();
                return db.collection('likes').where('userName', '==', request.user.name).get()
            }
        })
        .then((data) => {
            userData.likes = [];
            data.forEach((doc) => {
                userData.likes.push(doc.data());
            });
            return db.collection('notifications').where('receiver', "==", request.user.name)
                .orderBy('createdAt', 'desc').limit(10).get();
        })
        .then((data) => {
            userData.notifications = [];
            data.forEach((doc) => {
                userData.notifications.push({
                    receiver: doc.data().receiver,
                    sender: doc.data().sender,
                    postId: doc.data().postId,
                    type: doc.data().type,
                    read: doc.data().read,
                    createdAt: doc.data().createdAt,
                    notificationId: doc.id
                })
            })
            return response.json(userData);
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        })
}

exports.getUserDetails = (request, response) => {
    
    let userData = {};

    db.doc(`/users/${request.params.name}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                userData.user = doc.data();
                return db.collection('posts')
                    .where('userName', '==', request.params.name)
                    .orderBy('createdAt', 'desc')
                    .get();
            } else {
                return response.status(400).json({ error: 'User not found' });
            }
        })
        .then((data) => {
            userData.posts = [];
            data.forEach((doc) => {
                userData.posts.push({
                    body: doc.data().body,
                    createdAt: doc.data().createdAt,
                    userName: doc.data().userName,
                    userImage: doc.data().userImage,
                    likeCount: doc.data().likeCount,
                    commentCount: doc.data().commentCount,
                    postId: doc.id,
                })
            });
            return response.json(userData);
        })
        .catch((err) => {
            console.log(err);
            return response.status(500).json({ error : err.code });
        })
}

exports.uploadImage = (request, response) => {

    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({
        headers: request.headers,
    });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return response.status(400).json({
                error: 'Wrong file type submitted'
            });
        }

        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random() * 100000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };
        file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype,
                }
            }
        })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${request.user.name}`).update({ imageUrl });
            })
            .then(() => {
                return response.json({ message: 'Image uploaded successfully' });
            })
            .catch(err => {
                console.error(err);
                return response.status(500).json({ error: err.code });
            })
    });
    busboy.end(request.rawBody);
}

exports.markNotificationsRead = (request, response) => {

    let batch = db.batch();
    request.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`);
        batch.update(notification, { read: true });
    });
    batch.commit()
        .then(() => {
            return response.json({ message: 'Notifications marked read' });
        })
        .catch(err => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        })
}