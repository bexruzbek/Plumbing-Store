
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

if (!page && is_authorized) goToPage(pageMainMenu)
if (!page && !is_authorized) goToPage(pageDirectorAuth)

socket.emit('new_connection', { role: 'director', room: 'director' })
socket.on('connection_error', () => $('body').html(`2 ta admin bir vaqtda qoshila olmaydi!`))

if (page == strPageDirectorAuth) {
	if (is_authorized) goToPage(pageMainMenu)

	closeAllPages()
	$('title').text(`${siteTitleStr} | Kirish`)
	$('.director-auth-container').removeClass('d-none')
	$('.director-auth-form').removeClass('d-none')

	elDirectorAuthForm.on('submit', evt => {
		evt.preventDefault()

		let director = {
			username: $('#username').val().trim(),
			password1: $('#password1').val().trim(),
			password2: $('#password2').val().trim(),
		}
		socket.emit('check_director', director)
	})

	socket.on('director_checked', data => {
		if (data.error == true) return elDirectorAuthForm.find('p').text(`Username yoki parollardan bir noto'g'ri!`)
		localStorage.setItem(authStr, true)
		goToPage(pageMainMenu)
	})
}

else if (page == strPageMainMenu) {
	if (!is_authorized) goToPage(pageDirectorAuth)

	closeAllPages()

	$('title').text(`${siteTitleStr} | Menu`)
	$('.director-auth-container').removeClass('d-none')
	$('.director-action-btns').removeClass('d-none')
}

else if (page == strPageEditProducts) {
	if (!is_authorized) goToPage(pageDirectorAuth)

	closeAllPages()

	$('title').text(`${siteTitleStr} | Tovarlar`)
	$('.director-action-container').removeClass('d-none')
	$('.edit-products-container').removeClass('d-none')

	socket.emit('get_all_products:not-sorted')

	socket.on('all_products:ready', products => {
		productData = products
		createProducts(products)
	})

	socket.on('products_updated', products => {
		productData = products
		createProducts(products)
	})

	socket.on('edit_product:done', data => {
		if (data.error == true) return elEditProductModal.find('.form-validation').text(data.message)

		productData = data.products
		createProducts(data.products)
		elEditProductModal.modal('hide')
	})

	socket.on('is_cart_empty', data => {
		socket.emit('is_cart_empty:res', { data: data, bool: true })
	})

	elEditProductForm.on('submit', evt => {
		evt.preventDefault()

		let storageAction = elEditProductForm.find('#edit-storage-action').val().trim()
		let storageNum = parseInt(elEditProductForm.find('#edit-storage').val().trim())
		let product = productData.filter(product => product._id === elEditProductModal.data('productId'))[0]

		if (storageAction == '-' && storageNum > product.storage) return elEditProductModal.find('.form-validation').text(`Obmordan buncha mahsulotni olib tashlab bo'lmaydi!`)

		let newProduct = {
			_id: elEditProductModal.attr('data-product-id'),
			name: elEditProductForm.find('#edit-name').val().trim(),
			price: parseInt(elEditProductForm.find('#edit-price').val().trim()),
			storage: [ storageAction, storageNum ],
			red_norm: parseInt(elEditProductForm.find('#edit-red-norm').val().trim()),
			black_norm: parseInt(elEditProductForm.find('#edit-black-norm').val().trim()),
			image_url: elEditProductForm.find('#edit-product-img-link').attr('href').trim(),
			password: elEditProductForm.find('#edit-password').val().trim(),
		}

		socket.emit('edit_product', newProduct)
	})
}

else if (page == strPageCreateProduct) {
	if (!is_authorized) goToPage(pageDirectorAuth)
	closeAllPages()

	$('title').text(`${siteTitleStr} | Yangi Tovar`)
	$('.director-action-container').removeClass('d-none')
	$('.create-product-container').removeClass('d-none')

	elCreateProductForm.on('submit', evt => {
		evt.preventDefault()

		let product = {
			name: elCreateProductForm.find('input#name').val().trim(),
			price: elCreateProductForm.find('input#price').val().trim(),
			storage: elCreateProductForm.find('input#storage').val().trim(),
			red_norm: elCreateProductForm.find('input#red-norm').val().trim(),
			black_norm: elCreateProductForm.find('input#black-norm').val().trim(),
			image_url: elCreateProductForm.find('#product-img-link').attr('href').trim(),
			password: elCreateProductForm.find('input#password').val().trim(),
		}

		socket.emit('create_product', product)
	})

	socket.on('product_created', data => {
		if (data.error == true) return elCreateProductForm.find('p.form-validation').text(data.message)

		elCreateProductForm.find('p.form-validation-success').text(`Yangi mahsulot yaratildi!`)
		elCreateProductForm.find('input#name').val('')
		elCreateProductForm.find('input#price').val('')
		elCreateProductForm.find('input#storage').val('')
		elCreateProductForm.find('input#red-norm').val('')
		elCreateProductForm.find('input#black-norm').val('')
		elCreateProductForm.find('#product-img-link').attr('href', `https://i.ibb.co/Kx9Y0ht/700x400.png`)
	})
}

else if (page == strPageSellers) {
	if (!is_authorized) goToPage(pageDirectorAuth)
	closeAllPages()

	$('title').text(`${siteTitleStr} | Sotuvchilar`)
	$('.director-action-container').removeClass('d-none')
	$('.sellers-container').removeClass('d-none')
	
	socket.emit('get_all_sellers')
	socket.on('get_all_sellers:ready', sellers => {
		createSellers(sellers)
	})

	$('.remove-seller-form').on('submit', evt => {
		evt.preventDefault()

		socket.emit('remove_seller', { 
			sellerID: elRemoveSellerModal.data('sellerId'), 
			password: elRemoveSellerModal.find('#remove-seller-director-password').val().trim(),
		})
	})

	socket.on('seller_updated', () => {
		socket.emit('get_all_sellers')
	})

	socket.on('seller_removed', data => {
		if (data.error == true) return elRemoveSellerModal.find('.form-validation').text(data.message)
		location.reload()
	})
}

else if (page == strPageCreateSeller) {
	if (!is_authorized) goToPage(pageDirectorAuth)
	closeAllPages()

	$('title').text(`${siteTitleStr} | Yangi sotuvchi`)
	$('.director-action-container').removeClass('d-none')
	$('.create-seller-container').removeClass('d-none')

	elCreateSellerForm.on('submit', evt => {
		evt.preventDefault()

		let seller = {
			username: elCreateSellerForm.find('input#seller-name').val().trim(),
			password: elCreateSellerForm.find('input#seller-password').val().trim(),
			image_url: elCreateSellerForm.find('#seller-avatar-link').attr('href').trim(),
			director_password: elCreateSellerForm.find('input#director-password').val().trim(),
		}

		socket.emit('create_seller', seller)
	})

	socket.on('seller_created', data => {
		if (data.error == true) return elCreateSellerForm.find('p.form-validation').text(data.message)

		elCreateSellerForm.find('p.form-validation-success').text(`Yangi sotuvchi qo'shildi!`)
		elCreateSellerForm.find('input#seller-name').val('')
		elCreateSellerForm.find('input#seller-password').val('')
		elCreateSellerForm.find('#seller-avatar-link').attr('href', `https://i.ibb.co/Kx9Y0ht/700x400.png`)
	})
}

else if (page == strPageTrades) {
	if (!is_authorized) goToPage(pageDirectorAuth)
	closeAllPages()

	$('title').text(`${siteTitleStr} | Savdolar`)
	$('.director-action-container').removeClass('d-none')
	$('.trades-container').removeClass('d-none')

	const urlParams = Qs.parse(location.search, {
		ignoreQueryPrefix: true
	})
	const urlTradesPath = urlParams.trades ? urlParams.trades : 'all'
	let sellers = []
	let trades = []
	let workers = []
	let isFiltering = false
	let isSearching = false

	if (urlTradesPath == 'all') socket.emit('get_all_trades', { trades: 'all' })
		else socket.emit('get_all_trades', { trades: 'user', id: urlTradesPath })

	socket.on('get_all_trades:ready', res => {
		let allTradesList = res.trades
		socket.emit('get_all_sellers')
		socket.on('get_all_sellers:ready', sellersData => {
			socket.emit('get_all_workers')
			socket.on('get_all_workers:ready', workersData => {
				sellers = sellersData
				workers = workersData
				let tradesSortedByDate = []

				for (let i = 0; i < allTradesList.length; i++) {
					let trade = allTradesList[i]
					let tradeDate = `${trade.full_date[0]}.${trade.full_date[1]}.${trade.full_date[2]}`
					let isExist = tradesSortedByDate.filter(obj => obj.date === tradeDate)

					if (isExist.length < 1)	{
						tradesSortedByDate.push({
							date: tradeDate,
							trades: allTradesList.filter(obj => {
								let str = `${obj.full_date[0]}.${obj.full_date[1]}.${obj.full_date[2]}`
								return str === tradeDate
							})
						})
					}
				}
				trades = tradesSortedByDate
				if (res.update) {
					if (!isFiltering && !isSearching) createDayTrades(tradesSortedByDate, sellers, workers)
				} else {
					createDayTrades(tradesSortedByDate, sellers, workers)
					if (res.isSearching) isSearching = res.isSearching
				}
			})
		})
	})

	socket.on('trades_updated', () => {
		if (urlTradesPath == 'all') socket.emit('get_all_trades', { trades: 'all', update: true })
			else socket.emit('get_all_trades', { trades: 'user', id: urlTradesPath, update: true })
	})

	$('.search-trades-by-customer-input').on('keyup', evt => {
		let val = $('.search-trades-by-customer-input').val().trim()

		socket.emit('search_trades_by_customer', val)
	})
	
	let elDayFilterInput = elTradesFilterForm.find('#trade-filter-day')
	let elMonthFilterInput = elTradesFilterForm.find('#trade-filter-month')
	let elYearFilterInput = elTradesFilterForm.find('#trade-filter-year')

	elTradesFilterForm.on('submit', evt => {
		evt.preventDefault()
		if (!trades.length) return

		$('.trade-filter-validation').text('')

		let filterParams = {
			day: elDayFilterInput.val() ? elDayFilterInput.val().trim() : null,
			month: elMonthFilterInput.val().trim() == 'all' ? null : elMonthFilterInput.val().trim(),
			year: elYearFilterInput.val() ? elYearFilterInput.val().trim() : null,
		}
		
		if (!filterParams.day && !filterParams.month && !filterParams.year) {
			createDayTrades(trades, sellers, workers)
			isFiltering = false
			return
		}

		let filteredTrades = filterTradesByDate(filterParams, trades)
		if (!filteredTrades.length) return $('.trade-filter-validation').text(`Bunday sana mavjud emas!`)

		createDayTrades(filteredTrades, sellers, workers)
		isFiltering = true
	})

	let today = new Date()
    let month = today.getMonth() + 1 < 10 ? `0${today.getMonth() + 1}` : today.getMonth() + 1

	elDayFilterInput.val(today.getDate())
	elMonthFilterInput.val(month)
	elYearFilterInput.val(today.getFullYear())
}

else if (page == strPageWorkers) {
	if (!is_authorized) goToPage(pageDirectorAuth)
	closeAllPages()

	$('title').text(`${siteTitleStr} | Ishchilar`)
	$('.director-action-container').removeClass('d-none')
	$('.workers-container').removeClass('d-none')

	socket.emit('get_all_workers')
	socket.on('get_all_workers:ready', data => {
		socket.emit('get_all_trades', { trades: 'all' })
		socket.on('get_all_trades:ready', ({ trades }) => {
			createWorkers(data, trades)
		})
	})

	$('.remove-worker-form').on('submit', evt => {
		evt.preventDefault()

		socket.emit('remove_worker', { 
			workerID: elRemoveWorkerModal.data('workerId'),
			password: elRemoveWorkerModal.find('#remove-worker-director-password').val().trim(),
		})
	})

	socket.on('worker_removed', data => {
		if (data.error == true) return elRemoveWorkerModal.find('.form-validation').text(data.message)
		location.reload()
	})

	socket.on('workers_updated', () => socket.emit('get_all_workers'))
}

else if (page == strPageAddWorker) {
	if (!is_authorized) goToPage(pageDirectorAuth)
	closeAllPages()

	$('title').text(`${siteTitleStr} | Yangi ishchi`)
	$('.director-action-container').removeClass('d-none')
	$('.create-worker-container').removeClass('d-none')

	elAddWorkerForm.on('submit', evt => {
		evt.preventDefault()

		let worker = {
			username: elAddWorkerForm.find('input#worker-name').val().trim(),
			password: elAddWorkerForm.find('input#worker-password').val().trim(),
			image_url: elAddWorkerForm.find('#worker-avatar-link').attr('href').trim(),
			director_password: elAddWorkerForm.find('input#director-password-for-worker').val().trim(),
		}

		socket.emit('create_worker', worker)
	})

	socket.on('worker_created', data => {
		if (data.error == true) return elAddWorkerForm.find('p.form-validation').text(data.message)

		elAddWorkerForm.find('p.form-validation-success').text(`Yangi ishchi qo'shildi!`)
		elAddWorkerForm.find('input#worker-name').val('')
		elAddWorkerForm.find('input#worker-password').val('')
		elAddWorkerForm.find('#worker-avatar-link').attr('href', `https://i.ibb.co/Kx9Y0ht/700x400.png`)
	})
}

else {
	goToPage(pageMainMenu)
}

mobileDesign()
$( window ).resize(() => {
	mobileDesign()
})
