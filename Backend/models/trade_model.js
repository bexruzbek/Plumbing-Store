
const mongoose = require('mongoose')
const Joi = require('joi')

const trade_schema = new mongoose.Schema({
    seller: {
        type: String,
        required: true,        
    },
    worker: {
        type: String,
        required: true,
    },
    customer: {
        type: String,
        required: true,
    },
    total_price: {
        type: Number,
        required: true,
    },
    products: {
        type: Array,
        required: true,
    },
    full_date: {
        type: Array,
        required: true,
    },
    status: {
        type: Boolean,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now(),
    }

}, { collection: 'trades' })

const Trade = mongoose.model('Trade', trade_schema)

module.exports = Trade