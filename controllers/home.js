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
const jwt = require('jsonwebtoken')
const PostCare = require('../Model/PostCare')
var moment = require('moment');

let data_product

module.exports = {
    getProduct: async (req, res) => {
        //variable for Infomation User
        let InfoUser;
        //Sort by time
        let SortTime = { createdAt: -1 };
        try {
            const token = req.cookies['token']
            if (!token) {
                await Post.find({confirm:true}).sort(SortTime).limit(12).exec(function (err, docs) {
                    if (err) {

                        res.render('client/home', { status: ["", "", "Lỗi server"] });
                    }
                    else {
                        InfoUser = null;
                        data_product = docs;
                        res.render('client/home', { title: 'Express', data: docs, profileUser: InfoUser });

                    }
                })
            }
            else {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                req.accountID = decoded.accountID
                InfoUser = await User.findOne({ 'AccountID': req.accountID })
                await Post.find({confirm:true}).sort(SortTime).limit(12).exec(function (err, docs) {
                    if (err) {


                        res.render('client/home', { status: ["", "", "Lỗi server"] });
                    }
                    else {

                        data_product = docs;
                        res.render('client/home', { data: docs, profileUser: InfoUser });


                    }
                })
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                'message': error.message
            });
        }
    },

    //xem thông tin chi tiết
    getDetail: async (req, res) => {
        //get id of post
        const idpost = req.query._id;
        let InfoUser;
        try {
            if (!idpost) {
                throw new Error("No have Post in data")
            }
            else {
                // get token from cookies
                const token = req.cookies['token']
                if (!token) {
                    //Don't have token server return null 
                    InfoUser = null
                }
                else {

                    let id_temp = idpost;

                    //Verify token change to account id if have token
                    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                    req.accountID = decoded.accountID
                    //InforUser' User login 
                    InfoUser = await User.findOne({ 'AccountID': req.accountID })
                    //Post'User Login
                    const PostUser = await Post.find({ 'AuthorID': req.accountID })
                    //for loop
                    for (let i in PostUser) {

                        if (PostUser[i]._id == idpost) {
                            //null
                            id_temp = null;
                            break;//Out 
                        }
                    }
                    for (let j in InfoUser.History) {
                        if (InfoUser.History[j] == idpost) {
                            id_temp = null;
                            break;
                        }

                    }
                    if (id_temp) {
                        User.updateOne({ _id: InfoUser._id },
                            {
                                $push: {
                                    'History': id_temp
                                }
                            },
                            {
                                new: true, // trả về mới
                            }, function (error, data) {
                                if (error) {

                                    throw new Error(error)
                                }
                                else {
                                    console.log("Oke")
                                }
                            }
                        )
                    }


                }
                //Declare variable phonenumber
                var phoneNumber;
                //Find data Post by idpost 
                const data_post = await Post.findOne({ '_id': idpost })
                // assign variable authorID with data_post.AuthorID
                const authorID = data_post.AuthorID;
                //find authorID of Post
                const account = await User.findOne({ 'AccountID': authorID })



                //if PhoneNumber null assign variable
                if (account.PhoneNumber == null) {
                    phoneNumber = "null"
                }
                //Add +84 to string Phonenumber
                phoneNumber = "+84" + account.PhoneNumber;
                if (!data_post) {
                    //error
                    throw new Error("No have Post in data")
                }
                else {
                    //render
                    res.render('client/product_details', { data: data_post, phone: phoneNumber, profileUser: InfoUser, moment: moment });
                }
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                'message': error.message
            });
        }


    },

    // get page search
    search: async (req, res) => {
        let InfoUser;
        try {
            const token = req.cookies['token']
            if (!token) {
                InfoUser = null
            }
            else {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                req.accountID = decoded.accountID
                InfoUser = await User.findOne({ 'AccountID': req.accountID })
            }
            const key = `"${req.query.searchterm}"`; //search key
            const post = await Post.find({ $text: { $search: key } })

            res.render('client/search', { data: post, profileUser: InfoUser });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    //get page category
    category: async (req, res) => {
        if (req.query.TypeAuthor == 'tangcongdong') {
            typeauthor = 'tangcongdong'
        }
        if (req.query.TypeAuthor == 'canhan') {
            typeauthor = 'Cá nhân'
        }
        if (req.query.TypeAuthor == 'quy') {
            typeauthor = 'Quỹ/Nhóm từ thiện'
        }
        if (req.query.TypeAuthor == 'tochuc') {
            typeauthor = 'Tổ chức công ích'
        }
        let InfoUser;
        try {
            const token = req.cookies['token']
            if (!token) {
                InfoUser = null
            }
            else {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                req.accountID = decoded.accountID
                InfoUser = await User.findOne({ 'AccountID': req.accountID })
            }

            const post = await Post.find({ 'TypeAuthor': typeauthor,confirm:true })
            res.render('client/category', { title: 'Express', data: post, profileUser: InfoUser });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    ProfileUser: async (req, res) => {

        try {
            const token = req.cookies['token']
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            req.accountID = decoded.accountID
            const data = await User.findOne({ 'AccountID': req.accountID })
            if (!data) {
                throw new Error("serveral errors")
            }
            else {

                //Lich su xem cua nguoi dung
                post = [];
                for (let i in data.History) {
                    history = await Post.findOne({ '_id': data.History[i], confirm: true })
                    if (history) {
                        post.push(history)
                    }

                }

                res.render('client/profile',
                    {
                        //data_Profile: data,
                        data_History: post,
                        profileUser: data

                    });
            }


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
                            res.redirect('/')
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
                            res.redirect('/')
                        }
                    })
                }
            }
        } catch (error) {
            res.render('admin/post/error', { isOpen: ["", "", "", "open"] })
        }

    },
    //my post
    mypost: async (req, res) => {
        try {
            const post = await Post.find({ 'AuthorID': req.accountID })
            const InfoUser = await User.findOne({ 'AccountID': req.accountID })
            res.render('client/mypost', { data: post, profileUser: InfoUser });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    ///chat
    chatClient: async (req, res) => {
        try {

            let SortTime = { date: 1 };
            const id = req.query.ID; //id's post
            //tìm thông tin người dùng
            const InfoUser = await User.findOne({ 'AccountID': req.accountID })
            if (id) {
                let authorPost
                //Lấy id bài đăng
                const post = await Post.findOne({ _id: id })
                // tìm tác giả bài đăng
                authorPost = await User.findOne({ AccountID: post.AuthorID })

                //lấy ra những bài đăng mà 2 người nhắn với nhau
                const postCare = await PostCare.findOne({
                    'UserCareID': req.accountID,
                    'UserPostID': post.AuthorID
                })
                if (!postCare) {
                    //if dont'have in database so save new
                    const CarePost = ({
                        PostID: id,
                        UserCareID: req.accountID,
                        UserPostID: post.AuthorID
                    })
                    await PostCare.insertMany(CarePost)

                }
                else {
                    //check exists
                    UserMessage = await PostCare.findOneAndUpdate(
                        {
                            'UserCareID': req.accountID,
                            'UserPostID': post.AuthorID
                        },
                        {
                            $addToSet: { PostID: id }//checkexists and add
                        },
                        {
                            new: true
                        }
                    )
                }

                //tìm những người từng nhắn với user
                let temp = [];
                const UserMess = await PostCare.find(
                    { 'UserCareID': req.accountID }
                ).sort(SortTime)
                for (let i in UserMess) {
                    for (let j in UserMess[i].PostID) {
                        temp.push(await Post.findOne({ _id: UserMess[i].PostID[j] }))
                    }
                }

                res.render('client/chatlayout', { title: "chatSender", profileUser: InfoUser, AuthorPost: authorPost, CarePost: temp.slice().reverse(), CheckID: id });
            }
            else {
                //tìm người nhắn với user gần nhất
                const UserMess = await PostCare.find(
                    { 'UserCareID': req.accountID }
                )
                //tìm những người từng nhắn với user
                let temp = [];
                for (let i in UserMess) {
                    for (let j in UserMess[i].PostID) {
                        temp.push(await Post.findOne({ _id: UserMess[i].PostID[j] }))
                    }
                }
                authorPost = await User.findOne({ AccountID: UserMess[UserMess.length - 1].UserPostID })
                res.render('client/chatlayout', { title: "chatSender", profileUser: InfoUser, AuthorPost: authorPost, CarePost: temp.slice().reverse(), CheckID: "yes" });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    ///received chet
    receivedChat: async (req, res) => {
        try {
            const IdUser = req.accountID; //id's user send message
            const InfoUser = await User.findOne({ 'AccountID': IdUser })
            const postCare = await PostCare.find({
                'UserPostID': IdUser
            })
            //check exists
            let temp = [];
            let careUser;
            //lấy thông tin những người quan tâm đến bài đăng của mình 
            for (let i in postCare) {
                temp.push(await User.findOne({ AccountID: postCare[i].UserCareID }))

            }
            let id = req.query.ID; //id'người nhắn cho user

            if (!id) {
                //thông tin người gửi
                careUser = await User.findOne({ 'AccountID': postCare[0].UserCareID })
                id = "yes"
            }
            else {
                careUser = await User.findOne({ 'AccountID': id })
            }
            res.render('client/chatlayout', { title: "chatReceiver", profileUser: InfoUser, AuthorPost: careUser, CarePost: temp.slice().reverse(), CheckID: id });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    //deletePost
    //delete Posst 

    DeletePost: async (req, res) => {
        try {



            InfoUser = await User.findOne({ 'AccountID': req.accountID })
            //ID from client
            const id = req.query._id;
            //find News by ID 
            const post = await Post.findOne({ '_id': id })
            if (!post) {
                res.status(400).json({
                    success: false,
                    message: "do not have Post in data",
                });
            }
            else {

                const UserHistory = await User.find({})
                for (let i in UserHistory) {
                    const UserInfor = await User.findOneAndUpdate(
                        { _id: UserHistory[i]._id },
                        {
                            $pull: {
                                History: id
                            }
                        },
                        {
                            new: true
                        }
                    )
                }

                await post.urlImage.map(function (url) {
                    //delete image
                    //Tách chuỗi lấy id
                    const image_type = url.split(/[/,.]/)
                    //lấy tách ID
                    const imageId = image_type[image_type.length - 2]
                    //xóa ảnh
                    cloudinary_detele.uploader.destroy(imageId);
                })
                //xóa tin đăng 
                await post.remove()
                const mypost = await Post.find({ 'AuthorID': req.accountID })
                res.render('client/mypost', { data: mypost, profileUser: InfoUser });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                'message': error.message
            });
        }
    },
    editProfile: async (req, res) => {
        try {
            const token = req.cookies['token']
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            req.accountID = decoded.accountID
            const data = await User.findOne({ 'AccountID': req.accountID })
            if (!data) {
                throw new Error("serveral errors")
            }
            else {

                //Lich su xem cua nguoi dung
                post = [];
                for (let i in data.History) {
                    history = await Post.findOne({ '_id': data.History[i], confirm: true })
                    if (history) {
                        post.push(history)
                    }

                }

                res.render('client/editProfile',
                    {
                        //data_Profile: data,
                        data_History: post,
                        profileUser: data,
                        user: data

                    });
            }


        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    editProfilePost: async (req, res, next) => {
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
                res.redirect("/profile")
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
                        console.log("oke")
                        res.redirect("/profile")
                    }
                });
        } catch (error) {
            res.redirect("/profile")
        }
    },

    //filter 
    Filterlist: async (req, res, next) =>{
     
        let InfoUser;
        try {
            const token = req.cookies['token']
            if (!token) {
                InfoUser = null
            }
            else {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                req.accountID = decoded.accountID
                InfoUser = await User.findOne({ 'AccountID': req.accountID })
            }

            const post = await Post.find({ confirm: true, NameProduct: {$elemMatch:{ Category: req.query.category} } })
            res.render('client/category', { title: 'Express', data: post, profileUser: InfoUser });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


}

