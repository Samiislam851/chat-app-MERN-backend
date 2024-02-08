const express = require('express')

const cors = require('cors')
require('dotenv').config();
const app = express()
const db = require('./config/db');
const User = require('./models/userModel');

const generateToken = require('./config/generateToken');
const verifyJWT = require('./middleware/VerifyJWT')

/// Basic middlewares

app.use(cors())
app.use(express.json())





//// checking db connection
db.on('connected', () => {
    console.log('connected msg from index');
})

db.on('disconnect', () => {
    console.log('disconnected');
})


app.get('/', async (req, res) => {

    res.status(200).json({ message: 'hello world' })

})

/// register user///
app.post('/saveUser', async (req, res) => {
    // console.log(req.body)

    const user = new User(req.body)


    try {

        const userEmail = user.email

        const response = await User.findOne({ email: userEmail })

        if (!response) {

            try {
                const response = await user.save()
                const token = generateToken(response);

                console.log(token);

                /// return a token from here also
                res.status(200).json({ success: true, message: 'saved', user: response, token })
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error', error })
            }
        } else {
            res.status(400).json({ success: false, message: 'Bad request | User Already Exists', response })
        }


    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error', error })
    }
})

// give token to user
app.post('/login', async (req, res) => {

    const user = new User(req.body)
    console.log('the user ', user);

    try {

        const userEmail = user.email

        const response = await User.findOne({ email: userEmail })
        const token = generateToken(response)
        console.log('token', token);
        if (!response) {

            res.status(400).json({ success: false, message: 'Not Found', response })

        } else {
            res.status(200).json({ success: true, message: 'user Found', user: response, token })
        }


    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error', error })
    }

})

/////// Search user ////

app.post('/search-user', verifyJWT, async (req, res) => {

    const decoded = req.decoded


    const { inputValue } = req.body;

    try {

        const regexPattern = new RegExp("\\b" + inputValue + "\\w{0,}\\b", "i");
        const users = await User.find({
            $or: [
                { name: regexPattern }
                ,
                { email: regexPattern }
            ]
        })

        res.status(200).json({ users, success: true })

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'server error' })
    }
})


////// Send Request

app.put('/send-request/', verifyJWT, async (req, res) => {
    const id1 = req.params.id1
    const id2 = req.params.id2
    console.log('verified');


    // sending request from id1 to id2 


    try {
        const user1 = await User.findByIdAndUpdate(id1, { $push: { pendingRequests: id2 } }, { new: true })

        const user2 = await User.findByIdAndUpdate(id2, { $push: { incomingRequests: id1 } }, { new: true })

        console.log('user1 ::::::::::', user1);
        console.log('user2 ::::::::::', user2);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }

})

app.listen(3000, () => {
    console.log('example listening to port', 3000);
})