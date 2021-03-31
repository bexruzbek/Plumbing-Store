
const mongoose = require('mongoose')
const Joi = require('joi')

const product_schema = new mongoose.Schema({
    productID: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        min: 0,
        required: true
    },
    sold: {
        type: Number,
        default: 0,
    },
    storage: {
        type: Number,
        default: 0,
    },
    red_norm: {
        type: Number,
        required: true,
    },
    black_norm: {
        type: Number,
        required: true,
    },
    image_url: {
        type: String,
        default: `https://i.ibb.co/Kx9Y0ht/700x400.png`
    },

}, { collection: 'products' })

const Product = mongoose.model('Product', product_schema)

module.exports = Product