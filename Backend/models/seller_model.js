
const mongoose = require('mongoose')
const Joi = require('joi')

const seller_schema = new mongoose.Schema({
    username: {
        type: String,
        minlength: 3,
        required: true,
    },
    password: {
        type: String,
        minlength: 6,
        required: true,
    },
    image_url: {
        type: String,
        default: `https://i.ibb.co/Kx9Y0ht/700x400.png`
    },
    trades: {
        type: [String],
        default: [],
    },
    date: {
        type: Date,
        default: Date.now(),
    }

}, { collection: 'sellers' })

const Seller = mongoose.model('Seller', seller_schema)

module.exports = Seller