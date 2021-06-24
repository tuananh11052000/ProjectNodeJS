const express = require('express');
const client = express.Router();
const controller = require('../controllers/home');
const CORS = require('../middleware/CORS')
const verifyToken = require('../middleware/auth_web')

client.get('/', CORS, controller.getProduct);

client.get('/view-post', CORS, controller.getDetail)

client.get('/search', CORS, controller.search)

client.get('/profile', CORS, controller.ProfileUser)

module.exports = client;