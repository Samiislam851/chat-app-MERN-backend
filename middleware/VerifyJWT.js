
const jwt = require('jsonwebtoken')

const verifyJWT = (req, res, next) => {
    const { inputValue, user } = req.body;
    const token = req.headers.authorization?.split(' ')[1]
    // console.log(token, inputValue, user);
    if (!token) {

        res.status(400).json({ success: false, message: 'token was not given' })

    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error('Token verification failed');

            res.status(401).json({ success: false, message: 'Unauthorized' })

        } else if (!decoded) {
            console.error('Decoded payload is undefined');


            res.status(500).json({ success: false, message: 'Server Error Payload undefined' })
        }

        else {
            console.log('token verified');
            req.decoded = decoded
            next()
        }
    })
}
module.exports = verifyJWT