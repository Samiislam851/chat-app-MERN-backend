const express = require('express')

const cors = require('cors')
require('dotenv').config();
const app = express()
const db = require('./db');
const User = require('./models/userModel');



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


app.post('/saveUser', async (req, res) => {
    // console.log(req.body)

    const user = new User(req.body)


    try {

        const userEmail = user.email

        const response = await User.findOne({ email: userEmail })
    
        if (!response) {

            try {
                const response = await user.save()

                /// return a token from here also
                res.status(200).json({ success: true, message: 'saved', response })
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error', error })
            }
        }else{
            res.status(400).json({ success: false, message: 'Bad request | User Already Exists', response })
        }
 

    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error', error })
    }






})

app.listen(3000, () => {
    console.log('example listening to port', 3000);
})