const mongoose = require('mongoose');
const verifyToken = require('../middleware/auth')
const Post = require('../Model/Post');
const Schema = mongoose.Schema;
const Product = require('../Model/Product')
const User = require('../Model/User')
const cloudinary_detele = require('../configs/cloudinary.delete')
const multer = require('multer');
const { json } = require('express');
var ObjectID = require('mongodb').ObjectID;
const { findOne } = require('../Model/User');
const Account = require('../Model/Account');

let data_product

module.exports = {
    getProduct: async (req, res) => {

        try {
            const SortTime = { createdAt: -1 };
            await Post.find({}).sort(SortTime).limit(12).exec(function (err, docs) {
                if (err) {

                    res.render('client/home', { status: ["", "", "Lỗi server"] });
                }
                else {
                    data_product = docs;
                    res.render('client/home', { title: 'Express', data: docs });
                }
            })

        } catch (error) {
            res.status(500).json({
                success: false,
                'message': error.message
            });
        }
    },
    getDetail: async (req, res) => {
        const idpost = req.query._id;

        try {
            if (!idpost) {
                throw new Error("No have Post in data")
            }
            else {
                var phoneNumber;
                const data_post = await Post.findOne({ '_id': idpost })
                const authorID = data_post.AuthorID;
                const account = await User.findOne({ 'AccountID': authorID })
                if (account.PhoneNumber == null) {
                    phoneNumber = "null"
                }
                phoneNumber = "+84" + account.PhoneNumber;
                if (!data_post) {
                    throw new Error("No have Post in data")
                }
                else {
                    res.render('client/product_details', { data: data_post, phone: phoneNumber });
                }
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                'message': error.message
            });
        }


    },
    //get page search
    search: async (req, res) => {
        try {
            const key = `"${req.query.searchterm}"`;
            const post = await Post.find({ $text: { $search: key } })

            res.render('client/search', { data: post });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    ProfileUser: async (req, res) => {
        try {
            res.render('client/profile');
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    postCreatePost: async (req, res) => {
        const {
            title,
            note,
            NameProduct,
            TypeAuthor,
            NameAuthor,
            address,
        } = req.body;
        console.log(req.body)
        try {
            if (!title) {
                res.render('admin/post/error', { isOpen: ["", "", "", "open"] })
            }
            const findInfoAuthor = await User.findOne(
                { 'AccountID': req.accountID }
            )
            if (!findInfoAuthor) {
                res.render('admin/post/error', { isOpen: ["", "", "", "open"] })
            }
            else {
                let productPost = []
                for (let i = 0; i < NameProduct.length; i++) {
                    let temp = await Product.findOne({ "NameProduct": NameProduct[i] })
                    if (temp != null)
                        productPost.push(temp)
                }
                if (TypeAuthor) {
                    const dataPost = await new Post({
                        'AuthorID': req.accountID,
                        'TypeAuthor': TypeAuthor || 'Cá nhân',
                        'NameAuthor': NameAuthor || findInfoAuthor.FullName,
                        'address': address,
                        'NameProduct': productPost,
                        'title': title,
                        'note': note,
                        'confirm': false,
                        'urlImage': req.files.map(function (files) {
                            return files.path
                        })
                    })
                    dataPost.save(function (err, data) {
                        if (err) {
                            res.json(err)
                        }
                        else {
                            res.render('admin/post/success', { isOpen: ["", "", "", "open"] })
                        }
                    })
                } else {
                    const dataPost = await new Post({
                        'AuthorID': req.accountID,
                        'TypeAuthor': TypeAuthor || 'tangcongdong',
                        'NameAuthor': NameAuthor || findInfoAuthor.FullName,
                        'address': address,
                        'NameProduct': productPost,
                        'title': title,
                        'note': note,
                        'confirm': true,
                        'urlImage': req.files.map(function (files) {
                            return files.path
                        })
                    })
                    dataPost.save(function (err, data) {
                        if (err) {
                            res.json(err)
                        }
                        else {
                            res.render('admin/post/success', { isOpen: ["", "", "", "open"] })
                        }
                    })
                }
            }
        } catch (error) {
            res.render('admin/post/error', { isOpen: ["", "", "", "open"] })
        }
        console.log(req.body)
    }
}

