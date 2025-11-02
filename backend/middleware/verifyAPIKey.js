import dotenv from "dotenv";
dotenv.config();


function verifyAPIKey (req, res, next) {
    const clientKey = req.headers['our-api-key']
    const serverKey = process.env.OUR_API_KEY;

    if (!clientKey || clientKey != serverKey ){
        return res.status(403).json({ message: 'Invalid API Key'});
    }

    next();
}

export default verifyAPIKey;

