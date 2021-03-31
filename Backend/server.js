
//                                                M-A-R-K-E-T

// Requiring node modules
	const mongoose = require('mongoose')
	const helmet = require('helmet')
	const compression = require('compression')    
	const bodyParser = require('body-parser')
	const cors = require('cors')

    const express = require('express')
    const app = express()
    const http = require('http')
    const socketio = require('socket.io')

// Midlleware
    app.use( helmet() )
    app.use( compression() )
    app.use( cors() )

// Variables    
    const server = http.createServer(app)
    const io = socketio.listen(server, {log:false, origins:'*:*'})
	const port = process.env.PORT || 1001
    const directorUsername = 'Men'
    const directorPassword1 = 'osonParol'
    const directorPassword2 = 'cH-$f(5/fe#H%C Q@QC~!KqfHnnw^'
    const db = `mongodb+srv://demoOnlineMarketAdmin:javohir3003@database.tvsm2.mongodb.net/Online-Market?retryWrites=true&w=majority`

    const Product = require('./models/product_model')
    const Seller = require('./models/seller_model')
    const Trade = require('./models/trade_model')
    const Worker = require('./models/worker_model')

    let connections = []
    let workerFindingData = null

// Connecting to MongoDB
	mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => { console.log('MongoDBga ulanish hosil qilindi...\n') })
        .catch((err) => { console.error(`\nMongoDBga ulanish vaqtida xatolik ro'y berdi,`, err)	})

    mongoose.set('useFindAndModify', false)

// Main socket requests
    io.on('connection', socket => {
        socket.on('new_connection', async data => {
            let role = data.role
            let room = data.room
            let obj = { socketID: socket.id, role: role, room: room }
            let index = connections.findIndex(conn => conn.role === 'director')

            if (role == 'director' && index > -1) return socket.emit('connection_error')
            if (role == 'seller') {
                obj.seller = data.seller
                let allSeller = connections.filter(conn => conn.role === 'seller')
                let sellerIndex = allSeller.length ? allSeller.findIndex(conn => conn.seller._id === data.seller._id) : -5
                if (sellerIndex > -1) return socket.emit('new_connection:error')

                let isSellerRemoved = await Seller.findById(data.seller._id)    
                if (!isSellerRemoved) return socket.emit('seller_removed', { _id: data.seller._id })

                if (index > -1) socket.to(connections[index].socketID).emit('seller_updated')
            }
            if (role == 'worker') {
                obj.worker = data.worker
                let allWorker = connections.filter(conn => conn.role === 'worker')
                let workerIndex = allWorker.findIndex(conn => conn.worker._id === data.worker._id)
                if (workerIndex > -1) return socket.emit('new_connection:error')
                if (workerFindingData) socket.emit('new_trade', workerFindingData)
            }
            connections.push(obj)
            socket.join(room)
        })

        socket.on('get_all_products', async () => {
            let products = await Product.find().sort({ sold: -1 })
            socket.emit('all_products:ready', products)    
        })

        socket.on('get_all_products:not-sorted', async () => {
            let products = await Product.find()
            socket.emit('all_products:ready', products)    
        })

        socket.on('items_purchased', async data => {
            let products = data.products
            let seller = data.seller
            let total_price = 0
            let date = new Date()
            let month = (date.getMonth() + 1) < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
            let full_date = [date.getDate(), month, date.getFullYear()]

            for (let i = 0; i < products.length; i++) {
                let product = products[i]
                let num = product.num

                let updatedProduct = await Product.findOneAndUpdate(
                    { _id: product.id }, 
                    { $inc: { sold: num, storage: -num } },
                    { new: true }
                )
                total_price += product.totalPrice
            }

            let new_trade = new Trade({
                seller: seller._id,
                customer: data.customer,
                worker: data.worker,
                total_price: total_price,
                status: false,
                products: products,
                full_date: full_date,
            })
            
            try {
                let saved = await new_trade.save()
                const updatedSeller = await Seller.findOneAndUpdate(
                    { _id: seller._id }, 
                    { $push: { trades: saved._id } },
                    { new: true }
                )
                let sellerTrades = await Trade.find({ seller: updatedSeller._id })
                let seller_json = { username: updatedSeller.username, image_url: updatedSeller.image_url, _id: updatedSeller._id, date: updatedSeller.date, trades: sellerTrades }     
                socket.emit('seller_updated', seller_json)
                io.to('sellers').emit('trade_updated')

                let director = connections.find(conn => conn.role === 'director')
                if (!director) return
                let directorProducts = await Product.find()
                socket.to(director.socketID).emit('products_updated', directorProducts)
                socket.to(director.socketID).emit('seller_updated')
                socket.to(director.socketID).emit('trades_updated')
            } 
            catch (err) {
                console.log(err)
            }
        })

        socket.on('create_product', async data => {
            if (data.password !== directorPassword2) return socket.emit('product_created', { error: true, message: `Parol noto'g'ri!` })

            let allProducts = await Product.find()

            let new_prod = new Product({
                name: data.name,
                productID: allProducts.length + 1,
                price: data.price,
                storage: data.storage,
                red_norm: data.red_norm,
                black_norm: data.black_norm,
                image_url: data.image_url,
            })
            
            try {
                let saved = await new_prod.save()
                socket.emit('product_created', { error: false, product: saved })

                let products = await Product.find().sort({ sold: -1 })
                io.to('sellers').emit('new_product', products)
            } 
            catch (err) {
                socket.emit('product_created', { error: true, message: err.message })
            }
        })

        socket.on('edit_product', async data => {
            if (data.password !== directorPassword2) return socket.emit('edit_product:done', { error: true, message: `Parol noto'g'ri!` })
            let product = await Product.findById(data._id)
            if (data.storage[0] == '-' && product.storage <= data.storage[1]) return socket.emit('edit_product:done', { error: true, message: `Obmordan buncha mahsulotni olib tashlab bo'lmaydi!` })

            let connSellers = connections.filter(conn => conn.role === 'seller')
            if (connSellers.length) io.to('sellers').emit('is_cart_empty', data)
            else socket.emit('is_cart_empty', data)
        })

        socket.on('is_cart_empty:res', async res => {
            let data = res.data
            let bool = res.bool
            let num = data.storage[0] == '+' ? data.storage[1] : -data.storage[1]
            if (data.storage[0] == '-' && !bool) return io.to('director').emit('edit_product:done', { error: true, message: `Sotuvchi savdo qilyapti! Bu vaqtda obmobordan mahsulot olib tashlab bo'lmaydi!` })

            const updatedProduct = await Product.findOneAndUpdate(
                { _id: data._id },
                {
                    name: data.name,
                    price: data.price,
                    red_norm: data.red_norm,
                    black_norm: data.black_norm,
                    image_url: data.image_url,
                    $inc: { storage: num },
                },
                { new: true },
            )
        
            let products = await Product.find()
            io.to('director').emit('edit_product:done', { error: false, products: products })

            let sellerProducts = await Product.find().sort({ sold: -1 })
            io.to('sellers').emit('product_updated', sellerProducts)
        })

        socket.on('get_all_sellers', async () => {
            let sellers = await Seller.find().sort('-date')
            let connSellers = connections.filter(conn => conn.role === 'seller')
            let sellers_json = []

            for (let i = 0; i < sellers.length; i++) {
                let seller = sellers[i]
                let sellerTrades = await Trade.find({ seller: seller._id })
                let isConnected = connSellers.find(conn => {
                    if (conn.seller._id == seller._id) return conn
                })
                let seller_json = { username: seller.username, image_url: seller.image_url, _id: seller._id, date: seller.date, trades: sellerTrades, is_working: isConnected ? true : false }
                sellers_json.push(seller_json)
            }
            socket.emit('get_all_sellers:ready', sellers_json)
        })

        socket.on('create_seller', async data => {
            if (data.director_password !== directorPassword2) return socket.emit('seller_created', { error: true, message: `Parol noto'g'ri!` })

            let new_seller = new Seller({
                username: data.username,
                password: data.password,
                image_url: data.image_url,
            })
            
            try {
                let saved = await new_seller.save()
                socket.emit('seller_created', { error: false, product: saved })
            } 
            catch (err) {
                socket.emit('seller_created', { error: true, message: err.message })
            }
        })

        socket.on('update_seller', async sellerID => {
            let seller = await Seller.findById(sellerID)
            if (!seller) return
            let sellerTrades = await Trade.find({ seller: sellerID })
            let seller_json = { username: seller.username, image_url: seller.image_url, _id: sellerID, date: seller.date, trades: sellerTrades }     

            socket.emit('seller_updated', seller_json)
        })

        socket.on('check_seller', async data => {
            let seller = await Seller.findOne({ username: data.username, password: data.password }).select('-password')
            if (!seller) return socket.emit('seller_checked', { error: true, message: `Username yoki parol noto'g'ri!` })

            let sellerTrades = await Trade.find({ seller: seller._id })

            socket.emit('seller_checked', { error: false, seller: {
                username: seller.username,
                image_url: seller.image_url,
                _id: seller._id,
                date: seller.date,
                trades: sellerTrades,
            }})
        })

        socket.on('remove_seller', async data => {
            if (data.password !== directorPassword2) return socket.emit('seller_removed', { error: true, message: `Parol noto'g'ri!` })

            let seller = await Seller.findById(data.sellerID)
            await Seller.deleteOne({ _id: data.sellerID })
            socket.emit('seller_removed', { error: false })
            let sellers = connections.filter(conn => conn.role == 'seller')

            if (sellers.length) io.to('sellers').emit('seller_removed', seller)
        })

        socket.on('get_all_trades', async data => {
            let trades = []
            if (data.trades == 'all') trades = await Trade.find().sort({ date: -1 })
                else trades = await Trade.find({ seller: data.id }).sort({ date: -1 })

            let obj = { trades: trades }
            if (data.update) obj.update = true

            socket.emit('get_all_trades:ready', obj)
        })

        socket.on('create_worker', async data => {
            if (data.director_password !== directorPassword2) return socket.emit('worker_created', { error: true, message: `Parol noto'g'ri!` })

            let new_model = new Worker({
                username: data.username,
                password: data.password,
                image_url: data.image_url,
            })
            
            try {
                let saved = await new_model.save()
                socket.emit('worker_created', { error: false, worker: saved })
            } 
            catch (err) {
                socket.emit('worker_created', { error: true, message: err.message })
            }
        })

        socket.on('trade_delivered', async tradeID => {
            let updatedTrade = await Trade.findOneAndUpdate(
                { _id: tradeID }, 
                { status: true },
                { new: true }
            )
            let worker = await Worker.findOneAndUpdate(
                { _id: updatedTrade.worker },
                { status: false },
                { new: true }
            )

            let director = connections.find(conn => conn.role === 'director')
            if (director) socket.to(director.socketID).emit('trades_updated')
            if (director) socket.to(director.socketID).emit('workers_updated')
            socket.emit('trade_updated')

            let connWorker = connections.find(conn => {
                if (conn.worker) {
                    if (conn.worker._id == worker._id) return conn
                }
            })
            if (connWorker) socket.to(connWorker.socketID).emit('worker_updated', worker)
        })

        socket.on('search_trades_by_customer', async val => {
            let allTrades = await Trade.find().sort({ date: -1 })
            if (!val) return socket.emit('get_all_trades:ready', { trades: allTrades, isSearching: false })
                
            let keyword = new RegExp(val, 'gi')
            let searchedTrades = allTrades.filter(trade => trade.customer.match(keyword))
            socket.emit('get_all_trades:ready', { trades: searchedTrades, isSearching: true })
        })

        socket.on('get_all_workers', async () => {
            let workers = await Worker.find()
            socket.emit('get_all_workers:ready', workers)
        })

        socket.on('find_workers', async data => {
            let connWorkers = connections.filter(conn => conn.role == 'worker')
            socket.emit('workers_found', connWorkers)
            workerFindingData = data
            io.to('workers').emit('new_trade', data)
        })

        socket.on('trade_accepted', async data => {
            let allSellers = connections.filter(conn => conn.role == 'seller')
            let seller = allSellers.filter(seller => seller.seller._id === data.trade.seller._id)[0]
            let worker = await Worker.findOneAndUpdate(
                { _id: data.worker }, 
                { status: true },
                { new: true }
            )
            data.worker = worker
            workerFindingData = null
            io.to('workers').emit('trade_accepted', data)
            socket.to(seller.socketID).emit('trade_accepted', data)
        })

        socket.on('check_worker', async data => {
            let worker = await Worker.findOne({ username: data.username, password: data.password }).select('-password')
            if (!worker) return socket.emit('worker_checked', { error: true, message: `Username yoki parol noto'g'ri!` })

            socket.emit('worker_checked', { error: false, worker: worker })
        })

        socket.on('remove_worker', async data => {
            if (data.password !== directorPassword2) return socket.emit('worker_removed', { error: true, message: `Parol noto'g'ri!` })

            let worker = await Worker.findById(data.workerID)
            if (worker.status == true) return socket.emit('worker_removed', { error: true, message: `Bu ishchi hozirda ishlayapti! Ishlayotgan paytda ishdan bo'shatib bo'lmaydi!` })

            await Worker.deleteOne({ _id: data.workerID })
            socket.emit('worker_removed', { error: false })

            let workers = connections.filter(conn => conn.role == 'worker')
            if (workers.length) io.to('workers').emit('worker_removed', worker)            
        })

        socket.on('check_director', data => {
            if ((data.username == directorUsername) && (data.password1 == directorPassword1) && (data.password2 == directorPassword2)) return socket.emit('director_checked', { error: false })

            socket.emit('director_checked', { error: true })
        })

        socket.on('disconnect', () => {
            let index = connections.findIndex(conn => conn.socketID === socket.id)
            if (index > -1) {
                if (connections[index].role == 'seller') {
                    let directorIndex = connections.findIndex(conn => conn.role == 'director')
                    if (directorIndex > -1) socket.to(connections[directorIndex].socketID).emit('seller_updated')
                }
                if (connections[index].role == 'worker') {                    
                    let connWorkers = connections.filter(conn => conn.role === 'worker')
                    let leavingWorkerIndex = connWorkers.findIndex(conn => conn.socketID === connections[index].socketID)
                    connWorkers.splice(leavingWorkerIndex, 1)
                    io.to('sellers').emit('workers_found', connWorkers)
                }
                connections.splice(index, 1)
            }
        })
    })
    
// Running server
    server.listen(port, () => console.info(`\n${port} port running...`))