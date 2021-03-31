
// Init websocket
const connectionOptions =  {
    "force new connection" : true,
    "reconnectionAttempts": "Infinity",
    "timeout" : 10000,                  
    "transports" : ["websocket"]
}

const socket = io('https://yciw3632t466ep6ekd2dxb8vxdd55k.herokuapp.com', connectionOptions)

const { page } = Qs.parse(location.search, {
	ignoreQueryPrefix: true
})

if (!page && !seller) goToAuth()
if (!page && seller) goToMain()

if (page == 'main') {
	if (!seller) goToAuth()
	updateSellerInfo(seller)
	socket.emit('new_connection', { role: 'seller', room: 'sellers', seller: seller })
	socket.on('new_connection:error', () => $('body').html('Bu sotuvchi hozirda ishlayapti!'))

	$('.main').removeClass('d-none')
	$('.seller-auth-container').addClass('d-none')

	socket.emit('get_all_products')
	socket.emit('update_seller', seller._id)

	socket.on('all_products:ready', products => {
		productData = products
		mainProductData = products
		createProducts(products)
		if (cartProducts.length) buyProductManual(cartProducts)
	})

	socket.on('new_product', data => {
		showNotification(data, 'Hozir direktor yangi tovar yaratdi!')
	})

	socket.on('product_updated', data => {
		showNotification(data, `Hozir direktor tovarlarni o'zgartirdi!`)
	})

	socket.on('seller_updated', data => {
		seller = data
		updateSellerInfo(seller)
		localStorage.setItem('seller', JSON.stringify(seller))
	})

	socket.on('seller_removed', data => {
		if (seller._id == data._id) {
			alert(`Siz ishdan bo'shatildingiz!`)
			clearCart()
			logoutSeller()
		}
	})

	socket.on('is_cart_empty', data => {
		socket.emit('is_cart_empty:res', { data: data, bool: cartProducts.length ? false : true })
	})

	elProductContainer.on('keyup', evt => {
		if (evt.target.matches('input.product-num')) {
			if (evt.keyCode == ENTER_KEYCODE) $(evt.target).parent().parent().find('button.buy-product-btn').click()
		}
	})

	elCart.on('click', evt => {
		if (!evt.target.matches('button.remove-from-cart')) return

		let self = $(evt.target)
		let productID = self.parent().data('itemId')
		let itemIndex = cartProducts.findIndex(item => item.id === productID)
		let productIndex = productData.findIndex(product => product._id === productID)

		productData[productIndex].storage += cartProducts[itemIndex].num
		productData[productIndex].sold -= cartProducts[itemIndex].num
		cartProducts.splice(itemIndex, 1)
		mainProductData = productData
		elCartItemsNum.text(cartProducts.length)

		createCartItems(cartProducts)
		createProducts(productData)
	})

	socket.on('trade_accepted', data => {
		$('#ending-trade-modal p.text-center').text(`${data.worker.username} qabul qildi!`)
		$('.end-trade-btn').attr('data-trade-worker', data.worker._id)
		$('.end-trade-btn').attr('data-trade-customer', data.trade.customer)
		$('.end-trade-btn').removeClass('d-none')
	})

	socket.on('workers_found', data => {
		let txt = $('#ending-trade-modal p.text-center')
		txt.removeClass('text-danger').text('Ishchilar qabul qilishi kutilmoqda...')
		if (!data.length) txt.addClass('text-danger').text('Bironta ham ishchi yo\'q!')

		createOnlineWorkersToDeliver(data)
	})

	$(window).on("beforeunload", () => {
		if (cartProducts.length > 0) localStorage.setItem('cart', JSON.stringify(cartProducts))
			else localStorage.removeItem('cart')
	})
}

else if (page == 'waiting-trades') {
	if (!seller) goToAuth()

	$('.waiting-trades-container').removeClass('d-none')
	socket.emit('get_all_trades', { trades: 'all' })
	socket.on('get_all_trades:ready', data => {
		socket.emit('get_all_sellers')
		socket.on('get_all_sellers:ready', sellersData => {
			waitingTrades = data.trades.filter(trade => trade.status === false)
			createWaitingTrades(waitingTrades, sellersData)
		})
	})

	socket.on('trade_updated', () => {
		socket.emit('get_all_trades', { trades: 'all' })
	})
}

else if (page == 'auth') {
	if (seller) goToMain()

	$('.main').addClass('d-none')
	$('.seller-auth-container').removeClass('d-none')

	elSellerAuthForm.on('submit', evt => {
		evt.preventDefault()

		let seller = {
			username: $('#username').val().trim(),
			password: $('#password').val().trim(),
		}
		socket.emit('check_seller', seller)
	})

	socket.on('seller_checked', data => {
		if (data.error == true) $('.seller-auth-form p').text(data.message)
		else {
			seller = data.seller
			localStorage.setItem('seller', JSON.stringify(seller))
			goToMain()
		}
	})
}

const buyAllInCart = () => {
	if (!cartProducts.length) return
	if (!lastCustomer || !lastCustomer.length) lastCustomer = prompt('Xaridorning ismi:')
	if (!lastCustomer) return

	socket.emit('find_workers', { customer: lastCustomer.trim(), seller: seller, products: cartProducts })
	isSearchingForWorkers = true

	$('.end-trade-btn').addClass('d-none')
	$('#ending-trade-modal').modal('show')
}

const endTrade = self => {
	let workerID = self.data('tradeWorker')
	socket.emit('items_purchased', { products: cartProducts, seller: seller, customer: lastCustomer, worker: workerID })

	cartProducts = []
	lastCustomer = ''
	elCartItemsNum.text(cartProducts.length)

	sortProducts(productData)
	sortProducts(mainProductData)
	createProducts(productData)
	createCartItems(cartProducts)
	calculateCartItemsTotalPrice(cartProducts)	
}

const tradeDelivered = self => {
	let tradeID = self.parent().parent().data('tradeId')
	socket.emit('trade_delivered', tradeID)
}

mobileDesign()
$( window ).resize(() => {
	mobileDesign()
})
