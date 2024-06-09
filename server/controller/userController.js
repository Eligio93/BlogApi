const User = require('../models/user')
const asyncHandler = require('express-async-handler')
const passport = require('../passport-config')
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')



/*GET USER*/
exports.user_get = (req, res) => {
    res.json({ user: req.user })
}


/*LOGIN POST*/
exports.login_post = [
    body('email','Please enter a valid email')
        .trim()
        .isEmail()
        .escape(),
    body('password','Password must be at least 6 characters')
        .trim()
        .isLength({ min: 6 })
        .escape(),
    asyncHandler(async (req, res, next) => {
        const validationErrors = validationResult(req)
        if (validationErrors.isEmpty()) {
            passport.authenticate('local', { session: false }, (err, user, info) => {
                if (err) {
                    return res.status(500).json({ message: 'Internal server Error' })
                }
                if (!user) {
                    return res.status(400).json({ message: info.message })
                }
                if (user) {
                    jwt.sign({ id: user._id }, 'secret', (err, token) => {
                        if (err) {
                            next(err)
                        }
                        res.json({ token, user })
                    })
                }
            })(req, res, next)
        }else {
            //set response to 400 in case datas are not valid
            res.status(400).json({ message:validationErrors.errors[0].msg })
        }
        })
    
]


/*SIGNUP POST*/
exports.signup_post = [
    //validate and sanitize data
    body('name', 'Name must be at least 3 characters')
        .trim()
        .isLength({ min: 3 })
        .notEmpty()
        .escape(),
    body('lastName', 'Last Name must be at least 3 characters')
        .trim()
        .isLength({ min: 3 })
        .notEmpty()
        .escape(),
    body('email', 'Insert a valid email with the following format info@info.com')
        .trim()
        .isEmail()
        .custom(async value => {
            const user = await User.findOne({ email: value })
            if (user) {
                throw new Error('Email already in use')
            }
        })
        .escape(),
    body('password', 'Password must be at least 4 characters')
        .trim()
        .isLength({ min: 6 })
        .escape(),
    asyncHandler(async (req, res, next) => {
        const validationErrors = validationResult(req);
        if (validationErrors.isEmpty()) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            try {
                const user = new User({
                    name: req.body.name,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: hashedPassword,
                    admin: req.body.admin
                })
                await user.save()
                res.json({ message: 'User Created' })
            } catch (err) {
                return next(err)
            }
        } else {
            //set response to 400 in case datas are not valid
            res.status(400).json({ message:validationErrors.errors[0].msg })
        }
    })
]



