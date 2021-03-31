
const mongoose = require('mongoose')
const Joi = require('joi')

const worker_schema = new mongoose.Schema({
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
    status: {
        type: Boolean,
        default: false,
    },
    date: {
        type: Date,
        default: Date.now(),
    },

}, { collection: 'workers' })

const Worker = mongoose.model('Worker', worker_schema)

module.exports = Worker