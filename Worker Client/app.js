
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

// Run server
	const port = process.env.PORT || 4004
    app.listen(port, () => console.info(`\n${port} port running...`))