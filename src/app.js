const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 3000;



const authRouter = require('./router/auth');






app.use('/', authRouter);


app.use((err, req, res, next) => {
    res.status(err.statusCode || 400).json({
        error: err.message || 'Something went wrong'
    });
});





connectDB().then(()=>{
    console.log('Database connected successfully');
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}).catch((err)=>{
    console.error('Database connection failed', err);
});


