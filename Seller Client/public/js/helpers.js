
let elProductContainer = $('.product-container')
let elCart = $('.cart')
let elCartContainer = $('.cart-container')
let elCartItemsNum = $('.cart-open-btn span')
let elSellerAuthForm = $('.seller-auth-form')

let productData = []
let mainProductData = []
let updatedProductData = []
let cartProducts = []
let waitingTrades = []
let lastCustomer = ''
let homePageUrl = location.origin
let isSearchingForWorkers = false
let seller = JSON.parse( localStorage.getItem('seller') )

if (localStorage.getItem('cart')) {
	cartProducts = JSON.parse(localStorage.getItem('cart'))
}

let ENTER_KEYCODE = 13

const createProducts = data => {
	elProductContainer.html('')

	data.forEach(product => {
		let prodHtml = $(`
		    <div class="card mb-5 shadow product" data-product-id="${product._id}">
		      <div class="card-header p-0 text-center"><img class="card-img-top" src="${product.image_url}" alt="product-image"></div>
		      <div class="card-body">
		        <h5 class="card-title mb-4 text-center">${product.productID}. ${product.name}</h5>
		        <p class="card-text mb-1">Narxi: <span>${product.price}$</span></p>
		        <p class="card-text">Omborda: <span>${product.storage}</span> ta</p>
		        <div class="d-flex align-items-center">
		          <div class="form-group col-md-8 px-0 mb-0 mr-2">
		            <input type="number" class="form-control px-1 product-num" min="1" onkeyup="changeProductPrice($(this))" max="${product.storage}" value="1">
		          </div>
		          <button class="btn btn-primary col-md-4 border-0 buy-product-btn" onclick="buyProduct($(this))">Buy</button>
		        </div>
		        <p class="card-text text-center pt-3 total-price">Jami: <span>${product.price}$</span></p>
		      </div>
		    </div>
		`)

		if (product.storage <= product.black_norm) prodHtml.addClass('product-dark')
		if (product.storage <= product.red_norm) prodHtml.addClass('product-danger')
		if (product.storage >= product.red_norm) prodHtml.addClass('product-success')

		elProductContainer.append(prodHtml)
	})
}

const createWaitingTrades = (data, sellers) => {
	$('.trades-container').html('')

	data.forEach(trade => {
		let seller = sellers.find(seller => seller._id === trade.seller)

		let tradeHtml = $(`
	        <div class="py-2 px-3 shadow rounded border trade" data-trade-id="${trade._id}">
	          <div class="card-text trade-seller">Sotuvchi: <span>${seller ? seller.username : `Bo'shatilgan`}</span></div>
	          <div class="card-text">Xaridor: <span>${trade.customer}</span></div>
	          <div class="card-text">Jami foyda: <span>${trade.total_price}$</span></div>
	          <div class="card-text">Sana: <span>${trade.full_date[0]}.${trade.full_date[1]}.${trade.full_date[2]}</span></div>
	          <span class="mt-2 text-center trade-open-products-wrap"><p class="m-0 font-italic trade-open-products" onclick="toggleTradeProductsContainer($(this))">Tovarlar</p></span>
	          <div class="py-3 d-none trade-products-wrapper"></div>
	          <div class="text-center py-3"><button class="btn btn-success" onclick="tradeDelivered($(this))">Tovarlar yetkazildi</button></div>
	        </div>
		`)

		if (!seller) tradeHtml.find('.trade-seller span').addClass('font-italic font-weight-normal')

		let tradeProducts = tradeHtml.find('.trade-products-wrapper')
		trade.products.forEach(product => {
			let productHtml = $(`
				<div class="trade-product">
	              <p class="m-0">${product.name}</p>
	              <p class="m-0">${product.price}$ * ${product.num} = ${product.totalPrice}$</p>
	            </div>
			`)
			tradeProducts.append(productHtml)
		})

		$('.trades-container').append(tradeHtml)
	})
}

const createOnlineWorkersToDeliver = data => {
	if (!data.length) return $('.online-workers-container').html(``)
	$('.online-workers-container').html(`<h5 class="font-italic font-weight-normal">Online ishchilar</h5>`)
	data.forEach(worker => {
		let workerHtml = $(`			
            <div class="px-3 worker">
              <img src="${worker.worker.image_url}" class="rounded-circle worker-avatar" alt="worker-avatar">
              <h5 class="worker-username">${worker.worker.username}</h5>
            </div>
		`)
		$('.online-workers-container').append(workerHtml)
	})
}

const toggleTradeProductsContainer = self => {	
	self.parent().parent().find('.trade-products-wrapper').toggleClass('d-none')
}

const changeProductPrice = (self) => {
	let val = parseInt(self.val().trim())
	let productID = self.parent().parent().parent().parent().data('productId')
	let parent = $(`.product[data-product-id="${productID}"]`)
	let product = productData.filter(prod => prod._id === productID)[0]
	let totalPrice = product.price * val

	parent.find('.total-price span').text(`${totalPrice}$`)
	parent.find('.buy-product-btn').removeClass('btn-secondary').attr('disabled', false)

	if (val > product.storage) {
		parent.find('.buy-product-btn').addClass('btn-secondary').attr('disabled', true)
	}
	if (!val) parent.find('.total-price span').text(`0$`)
}

const createCartItems = data => {
	elCart.html(``)

	data.forEach(product => {
		let itemHtml = $(`
			<div class="cart-item" data-item-id="${product.id}">
		      <p class="m-0">${product.name}</p>
		      <p class="m-0">${product.price}$ * ${product.num} = ${product.totalPrice}$</p>
		      <button class="btn btn-danger remove-from-cart"><i class="fas fa-times"></i></button>
		    </div>
		`)
		elCart.append(itemHtml)
	})
	calculateCartItemsTotalPrice(cartProducts)
}

const buyProduct = (self) => {
	let parent = self.parent().parent().parent()
	let productID = parent.data('productId')
	let productNum = parseInt( parent.find('input.product-num').val().trim() )
	let product = productData.filter(prod => prod._id === productID)[0]
	let productIndex = productData.findIndex(prod => prod._id === productID)
	let totalPrice = product.price * productNum

	if (productNum > product.storage) return;
	if (productNum < 1) return;

	cartProducts.push({ 
		id: productID, 
		name: product.name, 
		price: product.price,
		num: productNum,
		totalPrice: totalPrice, 
	})
	productData[productIndex].storage -= productNum
	productData[productIndex].sold += productNum
	mainProductData = productData
	elCartItemsNum.text(cartProducts.length)
	
	createProducts(productData)
	createCartItems(cartProducts)
	calculateCartItemsTotalPrice(cartProducts)
}

const buyProductManual = cartData => {
	let removingItemsIndex = []
	cartData.forEach(item => {
		let index = productData.findIndex(product => product._id === item.id)

		if (productData[index].storage < item.num) return removingItemsIndex.push(cartData.findIndex(obj => obj === item))

		productData[index].storage -= item.num
		productData[index].sold += item.num
	})

	for (let i = 0; i < removingItemsIndex.length; i++) {
		cartData.splice(removingItemsIndex[i])
	}

	mainProductData = productData
	elCartItemsNum.text(cartProducts.length)
	createProducts(productData)
	createCartItems(cartProducts)
	calculateCartItemsTotalPrice(cartProducts)
}

const calculateCartItemsTotalPrice = data => {
	let total = 0
	for (let i = 0; i < data.length; i++) {
		total += data[i].totalPrice
	}
	$('.cart-items-total-price').text(`${total}$`)
}

const clearCart = () => {
	for (let i = 0; i < cartProducts.length; i++) {
		let index = productData.findIndex(product => product._id === cartProducts[i].id)
		productData[index].storage += cartProducts[i].num
		productData[index].sold -= cartProducts[i].num
	}

	cartProducts = []
	mainProductData = productData
	createProducts(productData)
	createCartItems(cartProducts)
	calculateCartItemsTotalPrice(cartProducts)
	elCartItemsNum.text(cartProducts.length)
}

const searchProducts = self => {
	let val = self.val().trim()
	if (!val) return createProducts(mainProductData), productData = mainProductData

	let keyword = new RegExp(val, 'gi')
	let products = productData.filter(product => {
		let productTitle = `${product.productID}. ${product.name}`
		return productTitle.match(keyword)
	})

	if (!products.length) return createProducts(mainProductData)

	productData = products
	createProducts(products)
}

const sortProducts = data => {
	data.sort((a, b) => {
		return b.sold - a.sold
	})
}

const updateProducts = self => {
	if (!updatedProductData.length) return
	if (cartProducts.length) return alert('Iltimos avval savdoni tugating yoki Отмена qiling! Savdo paytida yangilab bo\'lmaydi!') 

	productData = updatedProductData
	mainProductData = updatedProductData
	createProducts(updatedProductData)
	updatedProductData = []
	self.addClass('d-none')
}

const showNotification = (products, text) => {
	if (!cartProducts.length) {
		productData = products
		mainProductData = products
		createProducts(products)

		return
	}
	$('#notification-modal .notification-text').text(`${text} Agar savdo qilayotgan bo'lsangiz savdo tugagandan keyin 'Yangilash' tugmasini bosing!`)
	$('.update-products-btn').removeClass('d-none')
	updatedProductData = products
	$('#notification-modal').modal('show')
}

const updateSellerInfo = seller => {
	let totalPrice = 0
	let lastCustomer = seller.trades.length ? seller.trades[seller.trades.length - 1].customer : `Yo'q`

	for (let i = 0; i < seller.trades.length; i++) { totalPrice += seller.trades[i].total_price }

	$('.seller-info-container #seller-avatar').attr('src', seller.image_url)
	$('.seller-info-container #seller-name span.value').text(seller.username)
	$('.seller-info-container #seller-trades-num span.value').text(seller.trades.length + 'ta')
	$('.seller-info-container #seller-trades-price span.value').text(totalPrice + '$')
	$('.seller-info-container #seller-last-customer span.value').text(lastCustomer)
}

const mobileDesign = () => {
	if ($(window).width() < 500) {
		$('.action-btns a.btn-info').text('. . .')
		$('.action-btns .update-products-btn').html(`<i class="fas fa-redo"></i>`)
		$('#seller-trades-num > span').text('Savdolar')
		$('#seller-trades-price > span').text('Narxi')
		$('#seller-last-customer > span').text(`Xaridor`)
		$('.seller-info').removeClass('d-flex')
		$('#seller-avatar').on('click', () => $('.seller-info').toggleClass('d-flex'))
		$('.cart-action button').addClass('btn-sm')
		updateSellerInfo(seller)
	}
	else {
		$('.action-btns a.btn-info').text('Kutilayotgan...')
		$('.action-btns .update-products-btn').html(`Yangilash`)
		$('#seller-trades-num > span').text('Qilgan savdolar')
		$('#seller-trades-price > span').text('Umumiy savdo narxi')
		$('#seller-last-customer > span').text(`So'nggi xaridor`)
		$('.seller-info').addClass('d-flex')
		$('.cart-action button').removeClass('btn-sm')
		updateSellerInfo(seller)
	}
}

const logoutSeller = () => {
	clearCart()
	localStorage.removeItem('seller')
	goToAuth()
}

const goToMain = () => window.location.href = `${homePageUrl}/?page=main`

const goToWaitingTrades = () => window.location.href = `${homePageUrl}/?page=waiting-trades`

const goToAuth = () => window.location.href = `${homePageUrl}/?page=auth`