const argon2d = require('argon2');
const Account = require('../Model/Account');
const User = require('../Model/User')
const jwt = require('jsonwebtoken');
const { json } = require('express');
const { findOne } = require('../Model/Account');
require("dotenv").config();
module.exports = {
    //Login
    loginGet: (req, res, next) => {
        res.render('client/login', { status: "" })
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
                res.cookie('token', accessToken, {httpOnly: true });
                
                return res.redirect("/");
            } else {
                res.render('client/login', { status: "Sai mật khẩu !" })
            }
        }
        else {
            res.render('client/login', { status: "Tài khoản này không tồn tại." })
        }
    },
    registerGet: (req, res, next) => {
        res.render('client/register', { status: ["", "", ""] })
        //status cuoi cung la hien thi truong hop dien thieu thong tin
    },
    registerPost: async (req, res) => {
        const { Password, PhoneNumber, FullName } = req.body
        if (!PhoneNumber || !Password) {
            res.render('client/register', { status: ["", "", "Vui lòng điền đầy đủ thông tin"] })
        }
        try {
            const user = await Account.findOne({ 'PhoneNumber': PhoneNumber })
            if (user) {
                res.render('client/register', { status: ["SDT này đã được sử dụng.", "", ""] })
            }
            else {
                const hashedPassword = await argon2d.hash(Password)//hasd pass word by argon 
                const data = new Account({
                    'Password': hashedPassword,
                    'PhoneNumber': PhoneNumber,
                    'Rule': 2
                })
                const UserDetail = new User({
                    'PhoneNumber': PhoneNumber,
                    'AccountID': data._id,
                    'FullName': FullName,

                })
                const accessToken = jwt.sign(
                    { accountID: data._id },
                    process.env.ACCESS_TOKEN_SECRET)
                data.save(function (err) {
                    UserDetail.save(),
                        res.cookie('token', accessToken, {httpOnly: true });
                    return res.redirect("/");
                });
            }
        } catch (err) {
            res.status(500).json({
                success: false,
                "message": err.message
            });
        }
    },
    logout: (req, res, next) => {
        res.cookie('token', '', { maxAge: 1 })
        res.cookie('accountID', '', { maxAge: 1 })
        res.redirect('/')
    }

}