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

/////////////////////////////////////////// login give token to user
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

//////////////////////////////////////////////// Search user ///////////////////////////////////////////////////////

app.post('/search-user', verifyJWT, async (req, res) => {

    const decoded = req.decoded

    const requester = req.body.user.email


    console.log(requester);

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



        const filteredUsers = users.filter(user => user.email !== requester)
        res.status(200).json({ users: filteredUsers, success: true })

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'server error' })
    }
})


//////////////////////////////////////////// Send Request ////////////////////////////////////////////////

app.post('/send-request', verifyJWT, async (req, res) => {
    const email1 = req.query.user1email
    const email2 = req.query.user2email
    console.log('verified', email1, email2, req.query);


    /////////////// sending request from id1 to id2 


    try {
        const user1 = await User.findOneAndUpdate({ email: email1 }, { $addToSet: { pendingRequests: email2 } }, { new: true })
        const user2 = await User.findOneAndUpdate({ email: email2 }, { $addToSet: { incomingRequests: email1 } }, { new: true })
        console.log('user2 ::::::::::', user2);
        console.log('user1 ::::::::::', user1);




        if (user1 && user2) {
            res.status(200).json({ message: 'Request Sent', user: user1 })
        }


    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
})



////////// Cancel Request



app.post('/cancel-request', verifyJWT, async (req, res) => {
    const email1 = req.query.user1email;
    const email2 = req.query.user2email;
    console.log('verified', email1, email2, req.query);

    try {
        const user1 = await User.findOneAndUpdate(
            { email: email1 },
            { $pull: { incomingRequests: email2 } }, // Remove email2 from incomingRequests
            { new: true }
        );

        const user2 = await User.findOneAndUpdate(
            { email: email2 },
            { $pull: { pendingRequests: email1 } }, // Remove email1 from pendingRequests
            { new: true }
        );

        console.log('user2 ::::::::::', user2);
        console.log('user1 ::::::::::', user1);

        if (user1 && user2) {
            res.status(200).json({ message: 'Request canceled successfully.', user: user1 });
        } else {
            res.status(404).json({ message: 'Users not found or request already canceled.' });
        }

    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("internal server error")
    }
})










///////// Canceling request from requester


app.post('/cancel-request-from-requester', verifyJWT, async (req, res) => {
    const email1 = req.query.user1email;
    const email2 = req.query.user2email;
    console.log('verified', email1, email2, req.query);

    try {
        const user1 = await User.findOneAndUpdate(
            { email: email1 },
            { $pull: { pendingRequests: email2 } }, // Remove email2 from pendingRequests
            { new: true }
        );

        const user2 = await User.findOneAndUpdate(
            { email: email2 },
            { $pull: { incomingRequests: email1 } }, // Remove email1 from incomingRequests
            { new: true }
        );

        console.log('user2 ::::::::::', user2);
        console.log('user1 ::::::::::', user1);

        if (user1 && user2) {
            res.status(200).json({ message: 'Request canceled successfully.', user: user1 });
        } else {
            res.status(404).json({ message: 'Users not found or request already canceled.' });
        }

    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("internal server error")
    }
})






//////////////////////// get an User ////////////////

app.get('/get-single-user', verifyJWT, async (req, res) => {

    const decoded = req.decoded

    const requester = req.query.email



    console.log(requester);

    const { inputValue } = req.body;

    try {
        const user = await User.findOne({
            email: requester
        })



        res.status(200).json({ user, success: true })

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'server error' })
    }
})


///////////// get friend request list

app.get('/get-friend-requests', verifyJWT, async (req, res) => {

    const decoded = req.decoded

    const requester = req.query.email


    try {
        const user = await User.findOne({
            email: requester
        })


        const incomingEmails = user.incomingRequests;

        // Find users whose email addresses are in the incomingEmails array
        const users = await User.find({ email: { $in: incomingEmails } });

        res.status(200).json({ users, success: true })

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'server error' })
    }
})


//////// get friends



app.get('/get-friends', verifyJWT, async (req, res) => {

    const decoded = req.decoded

    const requester = req.query.email


    try {
        const user = await User.findOne({
            email: requester
        })

        const friends = user.friends;

        // Find users whose email addresses are in the friends array
        const users = await User.find({ email: { $in: friends } })

        res.status(200).json({ users, success: true })

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'server error' })
    }
})




///// accept request



app.post('/accept-request', verifyJWT, async (req, res) => {
    const email1 = req.query.user1email
    const email2 = req.query.user2email
    console.log('verified', email1, email2);


    try {
        const user1 = await User.findOneAndUpdate({ email: email1 },
            {
                $addToSet: { friends: email2 },
                $pull: { incomingRequests: email2 }

            },
            { new: true })




        const user2 = await User.findOneAndUpdate({ email: email2 },
            {
                $addToSet: { friends: email1 },
                $pull: { pendingRequests: email1 }
            },
            { new: true })





        console.log('user2 ::::::::::', user2);
        console.log('user1 ::::::::::', user1);




        if (user1 && user2) {
            res.status(200).json({ message: `Added ${user2.name} as a friend`, user: user1 })
        }


    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
})


app.listen(3000, () => {
    console.log('example listening to port', 3000);
})