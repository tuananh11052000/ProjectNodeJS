const express = require('express');
const client = express.Router();
const controller = require('../controllers/home');

const CORS = require('../middleware/CORS')
const verifyToken = require('../middleware/auth_web')
const fileUploader = require('../configs/cloudinary.config');

client.get('/', CORS, controller.getProduct);

client.get('/view-post', CORS, controller.getDetail)

client.get('/search', CORS, controller.search)

client.get('/profile', CORS, controller.ProfileUser)


client.post('/create-post', verifyToken, fileUploader.array('productImage', 12), CORS, controller.postCreatePost)


client.get('/chat', function(req, res, next) {
    res.render('client/chat')
   });
module.exports = client;