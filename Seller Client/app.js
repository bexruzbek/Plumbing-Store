
// Requiring node modules
	const helmet = require('helmet')
	const compression = require('compression')
	const bodyParser = require('body-parser')
	const cors = require('cors')
    const express = require('express')
    const app = express()

// Midlleware
    app.use( express.static('public') )
    app.use( helmet() )
    app.use( compression() )
    app.use( cors() )

// Routes
    // const products_route = require('./routes/products/create-product')
    // app.use('/create-product', products_route)

// Run server
	const port = process.env.PORT || 2002
    app.listen(port, () => console.info(`\n${port} port running...`))