const argon2d = require('argon2');
const Account = require('../Model/Account');
const User = require('../Model/User')
const Post = require('../Model/Post')
const jwt = require('jsonwebtoken');
require("dotenv").config();
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const verifyToken = require('../middleware/auth')
const Product = require('../Model/Product')
const cloudinary_detele = require('../configs/cloudinary.delete')
const multer = require('multer');
const { json } = require('express');
var ObjectID = require('mongodb').ObjectID;
const { findOne } = require('../Model/User');
module.exports = {
    //get information all account
    //client must contain token in the request
    loginGet: (req, res, next) => {
        res.render('admin/login/index', { status: "" })
    },
    logoutGet: (req, res, next) => {
        res.cookie('token', '', { maxAge: 1 })
        res.cookie('avatar', '', { maxAge: 1 })
        res.redirect('/admin/login')
    },
    loginPost: async (req, res, next) => {
        let { PhoneNumber, Password } = req.body;
        let temp = '0123456789';
        let check = true;
        for (let i = 0; i < Password.length; i++) {
            if (temp.indexOf(PhoneNumber[i]) == -1) {
                check = false;
                break;
            }
        }
        let account = [];
        if (check == true)//neu phone nhap vao toan la so thi moi tim kiem
        {
            account = await Account.find({ PhoneNumber: PhoneNumber });
        }
        if (account.length != 0 && check == true) {
            const passwordValid = await argon2d.verify(account[0].Password, Password)
            if (passwordValid)//kiem tra mk
            {
                const accessToken = jwt.sign(
                    { accountID: account[0]._id },
                    process.env.ACCESS_TOKEN_SECRET
                );
                res.cookie('token', accessToken, { httpOnly: true });
                let id = account[0]._id
                if (account[0]._id) {
                    res.cookie('accountID', account[0]._id, { httpOnly: false });
                }
                console.log('cookie created successfully');
                return res.redirect("/admin/home");
            } else {
                res.render('admin/login', { status: "wrong password !" })
            }
        }
        else {
            res.render('admin/login', { status: "Account does not exist." })
        }
    },
    home: async (req, res, next) => {
        let countAccount = await Account.count();
        let countUser = await User.count();
        let countPost = await Post.count();
        let numberOfPostWaiting = 0;
        await Post.find({ confirm: false }).then((data) => {
            numberOfPostWaiting = data.length;
        })
        console.log(numberOfPostWaiting)
        res.render('admin/main/index', { account: countAccount, user: countUser, post: countPost, postWaiting: numberOfPostWaiting, isOpen: ["open", "", "", ""] })
    }
    ,
    getAllAccount: async (req, res, next) => {
        Account.find().then(data => {
            if (!data) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message: "Accout requesting does not exist"
                    })
            }
            res.render('admin/account/danhsach', { account: data, url: process.env.URL, isOpen: ["", "open", "", ""] })
        });
    },
    editAccount: async (req, res, next) => {
        try {
            //id of the account being edited in request
            var editedAccount = await Account.findOne({
                _id: req.body._id
            })
            //confirm that the account edited is existing
            if (!editedAccount) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message: "Account you have chosed to edit does not exist"
                    })
            }
            //make sure that there are no account have the same UserName with the data edit

            var checkAccount = await Account.findOne({ PhoneNumber: req.body.PhoneNumber });
            if (checkAccount) {
                if (checkAccount.PhoneNumber != editedAccount.PhoneNumber) {
                    return res
                        .status(501)
                        .json({
                            success: false,
                            message: "the new PhoneNumber already exist"
                        });
                }
            }
            //edit account
            // must contain PhoneNumber, Password, Rule into the reques.body
            let hashedPassword;
            if (req.body.Password)
                hashedPassword = await argon2d.hash(req.body.Password);//if req contain new password, hash it
            Account.updateOne(
                { _id: req.query._id },
                {
                    $set: {
                        PhoneNumber: req.body.PhoneNumber || editedAccount.PhoneNumber,
                        Password: hashedPassword || editedAccount.Password,
                        Rule: req.Rule || 1
                    }
                }, function (err, data) {
                    if (err)
                        res.send("error")
                    else
                        res.send("oke")
                });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    removeAccount: async (req, res, next) => {
        let deletedAccount = await Account.findOne({ _id: req.query._id });
        if (!deletedAccount) {
            return res
                .status(500)
                .json({
                    success: false,
                    message: "the account you chosen does not exists."
                })
        }
        try {
            let temp;
            //xoa tai khoan
            Account.remove({ _id: req.query._id }, function (error, object) {
                if (error) throw error;
                temp = object.deletedCount;
            });
            //xoa user
            User.remove(
                { PhoneNumber: deletedAccount.PhoneNumber },
                function (err, object) {
                    if (err) throw err;
                }
            )
            //xoa post
            let post = await Post.findOne({ AuthorID: req.query._id });
            if (post) {
                post.urlImage.map(function (url) {
                    //delete image
                    //Tách chuỗi lấy id
                    const image_type = url.split(/[/,.]/)
                    //lấy tách ID
                    const imageId = image_type[image_type.length - 2]
                    //xóa ảnh
                    cloudinary_detele.uploader.destroy(imageId);
                })
            }

            Post.remove(
                { AuthorID: req.query._id }, function (err, object) {
                    if (err)
                        throw err;
                    return res
                        .status(200)
                        .json({
                            success: true,
                            message: `update success: ${temp} account and ${object.deletedCount} user`
                        })
                }
            );

        } catch (err) {
            return res
                .status(500)
                .json({
                    success: false,
                    message: err.message
                })
        }
    },
    viewAccount: async (req, res, next) => {
        await Account.findOne({ _id: req.query._id }).then((data) => {
            res.render("admin/account/view", { account: data, isOpen: ["", "open", "", ""] })
        })
    },
    //get all user with none data in req.body
    getAllUser: async (req, res, next) => {
        const UserInfo = await User.find()
        if (!UserInfo) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Accout requesting does not exist"
                })
        }
        res.render('admin/user/danhsach', { users: UserInfo, url: process.env.URL, isOpen: ["", "", "open", ""] })
    },
    //edit information of user
    //in this method, user must contain id of the user which being edited and all new information
    //the id of the user being edited must contain in the url
    editUserGet: async (req, res, next) => {
        try {
            var editedUser = await User.findOne({
                _id: req.query._id
            })
            res.render("admin/user/edit", { user: editedUser, isOpen: ["", "", "open", ""] });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    editUserPost: async (req, res, next) => {
        try {
            //id of the user being edited in request
            //get _id of the user by query data from url
            var editedUser = await User.findOne({
                _id: req.query._id
            })
            //confirm that the user edited is existing
            if (!editedUser) {
                // return res
                //     .status(404)
                //     .json({
                //         success: false,
                //         message: "The User you have chosen to edit does not exist"
                //     })
                res.render("admin/user/error")
            }
            //edit user
            // must contain PhoneNumber, Password, Rule into the req.body
            //in this method, admin can not change property AccountId and userName
            //if any field is null, it will be remain the previous value
            User.updateOne(
                { _id: req.query._id },
                {
                    $set: {
                        FullName: req.body.FullName || editedUser.FullName,
                        BirthDay: req.body.BirthDay || editedUser.BirthDay,
                        Address: req.body.Address || editedUser.Address,
                        Gender: req.body.Gender || editedUser.Gender,
                        PhoneNumber: editedUser.PhoneNumber,
                        urlImage: req.files[0].path
                    }
                }, function (err, data) {
                    if (err) {
                        console.log("__________________________________")
                        res.render("admin/user/error", { isOpen: ["", "", "open", ""] })
                    }
                    else {
                        res.render("admin/user/success", { isOpen: ["", "", "open", ""] })
                    }
                });
        } catch (error) {
            res.render("admin/user/error", { isOpen: ["", "", "open", ""] })
        }
    },
    removeUser: async (req, res, next) => {
        let deletedUser = await User.findOne({ _id: req.query._id });
        if (!deletedUser) {
            return res
                .status(500)
                .json({
                    success: false,
                    message: "the user you chosen does not exists."
                })
        }
        try {
            let temp;
            //xoa tai khoan
            User.remove({ _id: req.query._id }, function (error, object) {
                if (error) throw error;
                temp = object.deletedCount;
            });
            //xoa user
            let id;
            await Account.findOne({ PhoneNumber: deletedUser.PhoneNumber }).then(data => {
                id = data._id;
            })
            Account.remove(
                { PhoneNumber: deletedUser.PhoneNumber },
                function (err, object) {
                    if (err) throw err;
                }
            )
            //xoa post
            let post = await Post.findOne({ AuthorID: id });
            if (post) {
                post.urlImage.map(function (url) {
                    //delete image
                    //Tách chuỗi lấy id
                    const image_type = url.split(/[/,.]/)
                    //lấy tách ID
                    const imageId = image_type[image_type.length - 2]
                    //xóa ảnh
                    cloudinary_detele.uploader.destroy(imageId);
                })
            }

            Post.remove(
                { AuthorID: id }, function (err, object) {
                    if (err)
                        throw err;
                    return res
                        .status(200)
                        .json({
                            success: true,
                            message: `update success: ${temp} user and ${object.deletedCount} account`
                        })
                }
            );

        } catch (err) {
            return res
                .status(500)
                .json({
                    success: false,
                    message: err.message
                })
        }
    },
    viewUser: async (req, res, next) => {
        await User.findOne({ _id: req.query._id }).then((data) => {
            console.log(data)
            res.render("admin/user/view", { user: data, isOpen: ["", "", "open", ""] })
        })
    },
    //view all post
    getAllPost: async (req, res, next) => {
        try {
            Post.find().then((data) => {
                let data_ = [];
                for (let i = 0; i < data.length; i++) {
                    if (data[i].confirm == true) {
                        data_.push(data[i]);
                    }
                }
                res.render('admin/post/allPost', { post: data_, url: process.env.URL, isOpen: ["", "", "", "open"] })
            })
        } catch (error) {
            return res
                .status(500)
                .json({
                    success: false,
                    message: error.message
                })
        }
    },
    viewPost: async (req, res, next) => {
        await Post.findOne({ _id: req.query._id }).then((data) => {
            res.render("admin/post/view", { post: data, isOpen: ["", "", "", "open"] })
        })
    },
    removePost: async (req, res, next) => {
        let deletedPost = await Post.findOne({ _id: req.query._id });
        if (!deletedPost)
            return res
                .status(500)
                .json({
                    success: false,
                    message: "post you want to remove does not exist."
                })

        deletedPost.urlImage.map(function (url) {
            //delete image
            //Tách chuỗi lấy id
            const image_type = url.split(/[/,.]/)
            //lấy tách ID
            const imageId = image_type[image_type.length - 2]
            //xóa ảnh
            cloudinary_detele.uploader.destroy(imageId);
        })

        //remove Post in History
        const UserHistory = await User.find({})
        for (let i in UserHistory) {
            const UserInfor = await User.findOneAndUpdate(
                { _id: UserHistory[i]._id },
                {
                    $pull: {
                        History: req.query._id
                    }
                },
                {
                    new: true
                }
            )
        }
        Post.remove({ _id: req.query._id }, function (error, object) {
            if (error) throw error;
            return res.status(200)
                .json({
                    success: true,
                    message: `updated success: ${object.deletedCount} record`
                })
        })
    },
    createPost: (req, res, next) => {
        res.render('admin/post/createPost', { isOpen: ["", "", "", "open"] })
    },
    confirmPost: async (req, res, next) => {
        await Post.find({ confirm: false }).then((data) => {
            res.render('admin/post/confirmPost', { post: data, url: process.env.URL, isOpen: ["", "", "", "open"] })
        })
    },
    confirmPostPost: async (req, res, next) => {
        Post.updateOne(
            { _id: req.query._id },
            {
                $set: {
                    confirm: true
                }
            }, function (err, data) {
                if (err)
                    res.send("error")
                else
                    res.send("oke")
            });
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
            }
        } catch (error) {
            res.render('admin/post/error', { isOpen: ["", "", "", "open"] })
        }
    },
    findAccount: async (req, res, next) => {
        await Account.findOne({ _id: req.accountID }).then((data) => {
            console.log()
            User.findOne({ AccountID: req.accountID }).then((data_) => {

                return res.status(200).json({
                    success: true,
                    data: data_
                })
            })

        })
    },
    profile: async (req, res, next) => {
        await User.findOne({ AccountID: req.accountID }).then(async (data) => {
            await Account.findOne({ _id: req.AccountID }).then(data_ => {
                console.log("____")
                console.log(data)
                res.render('admin/profile/profile', { isOpen: ["", "", "", ""], account: data_, user: data })
            })
        })
    },
    editProfilerPost: async (req, res, next) => {
        try {
            //id of the user being edited in request
            //get _id of the user by query data from url
            var editedUser = await User.findOne({
                _id: req.query._id
            })
            //confirm that the user edited is existing
            if (!editedUser) {
                // return res
                //     .status(404)
                //     .json({
                //         success: false,
                //         message: "The User you have chosen to edit does not exist"
                //     })
                res.render("admin/user/error")
            }
            //edit user
            // must contain PhoneNumber, Password, Rule into the req.body
            //in this method, admin can not change property AccountId and userName
            //if any field is null, it will be remain the previous value
            User.updateOne(
                { _id: req.query._id },
                {
                    $set: {
                        FullName: req.body.FullName || editedUser.FullName,
                        BirthDay: req.body.BirthDay || editedUser.BirthDay,
                        Address: req.body.Address || editedUser.Address,
                        Gender: req.body.Gender || editedUser.Gender,
                        PhoneNumber: editedUser.PhoneNumber,
                        urlImage: req.files[0].path
                    }
                }, function (err, data) {
                    if (err) {
                        res.redirect("/profile")
                    }
                    else {
                        res.redirect("/profile")
                    }
                });
        } catch (error) {
            res.redirect("/profile")
        }
    }
}