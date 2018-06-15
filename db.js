const mongoose = require('mongoose');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || 'localhost';

mongoose.connect('mongodb://'+dbUrl+'/mascotapp');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error'));
db.once('open', () => console.log('DB connected'));
