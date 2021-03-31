
let elDirectorAuthForm = $('.director-auth-form')
let elMainContainer	= $('.director-auth-container')
let elActionContainer = $('.director-action-container')
let elEditProductModal = $('#edit-product-modal')
let elCreateProductForm = $('.create-product-form')
let elEditProductForm = $('.edit-product-form')
let elCreateSellerForm = $('.create-seller-form')
let elRemoveSellerModal = $('#remove-seller-modal')
let elTradesFilterForm = $('.trade-filter-form')
let elAddWorkerForm = $('.create-worker-form')
let elRemoveWorkerModal = $('#remove-worker-modal')

let productData = []

const siteTitleStr = `Market - Direktor`
const authStr = `is_authorized`
const strPageDirectorAuth = `director-auth`
const strPageMainMenu = `main-menu`
const strPageEditProducts = `edit-products`
const strPageCreateProduct = `create-product`
const strPageSellers = `sellers`
const strPageCreateSeller = `add-seller`
const strPageTrades = `trades`
const strPageWorkers = `workers`
const strPageAddWorker = `add-worker`

const pageHome = location.origin
const createUrl = routePath => `${pageHome}/?page=${routePath}`
const pageDirectorAuth = createUrl(strPageDirectorAuth)
const pageMainMenu = createUrl(strPageMainMenu)
const pageEditProducts = createUrl(strPageEditProducts)
const pageCreateProduct = createUrl(strPageCreateProduct)
const pageSellers = createUrl(strPageSellers)
const pageCreateSeller = createUrl(strPageCreateSeller)
const pageTrades = createUrl(strPageTrades)
const pageWorkers = createUrl(strPageWorkers)
const pageAddWorker = createUrl(strPageAddWorker)

const is_authorized_storage = localStorage.getItem(authStr)

if (is_authorized_storage) {
	is_authorized = JSON.parse(is_authorized_storage)
} else {
	is_authorized = false
	localStorage.setItem(authStr, false)
}

const goToPage = pageUrl => window.location.href = pageUrl

const closeAllPages = () => {
	elActionContainer.addClass('d-none')
	$('.edit-products-container').addClass('d-none')
	$('.create-product-container').addClass('d-none')
	$('.director-action-btns').addClass('d-none')
	$('.director-auth-container').addClass('d-none')
	$('.director-auth-form').addClass('d-none')
	$('.sellers-container').addClass('d-none')
	$('.trades-container').addClass('d-none')
}

const openModal = self => {
	let productID = self.parent().parent().data('productId')
	let product = productData.filter(product => product._id === productID)[0]

	elEditProductModal.find('#edit-product-modal-label').text(`Mahsulot ${product.name}`)
	elEditProductModal.attr('data-product-id', productID)
	elEditProductForm.find('#edit-name').val(product.name)
	elEditProductForm.find('#edit-price').val(product.price)
	elEditProductForm.find('#edit-red-norm').val(product.red_norm)
	elEditProductForm.find('#edit-black-norm').val(product.black_norm)
	elEditProductForm.find('#edit-product-img-link').attr('href', product.image_url)

	elEditProductForm.find('#edit-storage').val('0')
	elEditProductForm.find('.form-validation').text('')
}

const filterTradesByDate = (filterParams, data) => {
	if (filterParams.year) {
		data = data.filter(day => filterParams.year === day.date.split('.')[2])
	}
	if (filterParams.month) {
		data = data.filter(day => filterParams.month === day.date.split('.')[1])
	}
	if (filterParams.day) {
		data = data.filter(day => filterParams.day === day.date.split('.')[0])
	}
	return data
}

const fileChange = self => {
	let file = document.getElementById(self.attr('id'))
	let form = new FormData()
	form.append("image", file.files[0])

	let settings = {
	  "url": "https://api.imgbb.com/1/upload?key=a2bd17fcdc0d49be220966602a794fa2",
	  "method": "POST",
	  "timeout": 0,
	  "processData": false,
	  "mimeType": "multipart/form-data",
	  "contentType": false,
	  "data": form
	}

	$.ajax(settings).done(res => {
	 	let response = JSON.parse(res)
	 	self.parent().parent().find('a').attr('href', response.data.display_url)
	})
}

const logoutDirector = () => {
	localStorage.removeItem(authStr)
	goToPage(pageDirectorAuth)
}

const removeSeller = self => {
	let sellerID = self.parent().parent().parent().data('sellerId')
	elRemoveSellerModal.attr('data-seller-id', sellerID)
	$('#remove-seller-modal #remove-seller-modal-label span').text( self.parent().parent().find('h5.card-title').text().trim() )
	elRemoveSellerModal.modal('show')
}

const removeWorker = self => {
	let workerID = self.parent().parent().parent().data('workerId')
	elRemoveWorkerModal.attr('data-worker-id', workerID)
	elRemoveWorkerModal.find('#remove-worker-modal-label span').text( self.parent().parent().find('h5.card-title').text().trim() )
	elRemoveWorkerModal.modal('show')
}

const toggleTradeProductsContainer = self => self.parent().parent().find('.trade-products-wrapper').toggleClass('d-none')

const createDayTrades = (data, sellers, workers) => {
	$('.trade-days-wrappper').html('')

	data.forEach(day => {
		let dayHtml = $(`			
	      <div class="day-trades" data-trade-day-date="${day.date}">
	        <div class="text-center mt-3 mb-4 trades-date">
	          <p class="m-0 bg-light font-italic">${day.date}</p>
	        </div>
	        <div class="trades"></div>
	      </div>
		`)
		let tradesContainer = dayHtml.find('.trades')
		createTrades(day.trades, sellers, workers, tradesContainer)

		$('.trade-days-wrappper').append(dayHtml)
	})
}

const createTrades = (data, sellers, workers, container) => {
	container.html('')

	data.forEach(trade => {
		let seller = sellers.find(seller => seller._id === trade.seller)
		let worker = workers.find(worker => worker._id === trade.worker)

		let tradeHtml = $(`
	        <div class="py-2 px-3 shadow rounded border trade" data-trade-id="${trade._id}">
	          <div class="card-text trade-seller">Sotuvchi: <span>${seller ? `<a href="${pageTrades}&trades=${seller._id}">${seller.username}</a>` : `Bo'shatilgan`}</span></div>
	          <div class="card-text">Xaridor: <span>${trade.customer}</span></div>
	          <div class="card-text">Ishchi: <span>${worker.username}</span></div>
	          <div class="card-text">Status: <span>${trade.status ? 'Yetkazib berilgan &#10003;' : 'Kutmoqda...'}</span></div>
	          <div class="card-text">Jami foyda: <span>${trade.total_price}$</span></div>
	          <div class="card-text">Sana: <span>${trade.full_date[0]}.${trade.full_date[1]}.${trade.full_date[2]}</span></div>
	          <span class="mt-2 text-center trade-open-products-wrap"><p class="m-0 font-italic trade-open-products" onclick="toggleTradeProductsContainer($(this))">Tovarlar</p></span>
	          <div class="py-3 d-none trade-products-wrapper"></div>
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

		container.append(tradeHtml)
	})
}

const createSellers = data => {
	$('.sellers').html('')

	data.forEach(seller => {
		let totalPrice = 0
		let lastCustomer = seller.trades.length ? seller.trades[seller.trades.length - 1].customer : `Yo'q`

		for (let i = 0; i < seller.trades.length; i++) { totalPrice += seller.trades[i].total_price }

		let sellerHtml = $(`
		    <div class="card mb-5 shadow seller" data-seller-id="${seller._id}">
		      <div class="card-header p-0 text-center"><img class="card-img-top" src="${seller.image_url}" alt="seller-image"></div>
		      <div class="card-body">
		        <h5 class="card-title mb-4 text-center">${seller.username}</h5>
		        <p class="card-text mb-1">Qilgan savdolar soni: <span>${seller.trades.length}ta</span></p>
		        <p class="card-text mb-1">Umumiy savdo narxi: <span>${totalPrice}$</span></p>
		        <p class="card-text mb-1">Oxirgi xaridor: <span>${lastCustomer}</span></p>
		        <p class="card-text mb-1">Xozirda ishlayapti: <span>${seller.is_working ? 'Ha' : 'Yo\'q'}</span></p>
		        <div class="pt-3 text-center">
		      	  <a href="${pageTrades}&trades=${seller._id}" class="btn btn-primary">Savdolar</a>
		        </div>
		        <div class="pt-3 text-center">
		      	  <button type="button" class="btn btn-danger" onclick="removeSeller( $(this) )">Ishdan bo'shatish</button>
		        </div>
		      </div>
		    </div>
		`)
		let sellerName = sellerHtml.find('.card-title.text-center')
		seller.is_working ? sellerName.addClass('text-success') : sellerName.addClass('text-dark')
		$('.sellers').append(sellerHtml)
	})
}

const createProducts = data => {
	$('.products-list').html('')

	data.forEach(product => {
		let prodHtml = $(`
		    <div class="card mb-5 shadow product" data-product-id="${product._id}">
		      <div class="card-header p-0 text-center"><img class="card-img-top" src="${product.image_url}" alt="product-image"></div>
		      <div class="card-body">
		        <h5 class="card-title mb-4 text-center">${product.name}</h5>
		        <p class="card-text mb-1">Narxi: <span>${product.price}$</span></p>
		        <p class="card-text">Omborda: <span>${product.storage}</span> ta</p>
		        <p class="card-text">Sotilgan: <span>${product.sold}</span> marta</p>
		        <p class="card-text">Qizil normasi: <span>${product.red_norm}</span></p>
		        <p class="card-text">Qora normasi: <span>${product.black_norm}</span></p>
		      </div>
		      <div class="pb-3 text-center">
		      	<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#edit-product-modal" onclick="openModal($(this))">O'zgartirish</button>
		      </div>
		    </div>
		`)

		if (product.storage <= product.black_norm) prodHtml.addClass('product-dark')
		if (product.storage <= product.red_norm) prodHtml.addClass('product-danger')
		if (product.storage >= product.red_norm) prodHtml.addClass('product-success')

		$('.products-list').append(prodHtml)
	})
}

const createWorkers = (data, trades) => {
	$('.workers').html('')

	data.forEach(worker => {
		let workerTrades = trades.filter(trade => trade.worker == worker._id)
		let workerHtml = $(`
		    <div class="card mb-5 shadow worker" data-worker-id="${worker._id}">
		      <div class="card-header p-0 text-center"><img class="card-img-top" src="${worker.image_url}" alt="worker-image"></div>
		      <div class="card-body">
		        <h5 class="card-title mb-4 text-center">${worker.username}</h5>
		        <p class="card-text mb-1">Qilgan savdolar soni: <span>${workerTrades.length}ta</span></p>
		        <p class="card-text mb-1">Oxirgi xaridor: <span>${workerTrades.length ? workerTrades[workerTrades.length - 1].customer : `Yo'q`}</span></p>
		        <p class="card-text mb-1">Xozirda ishlayapti: <span>${worker.status ? 'Ha' : 'Yo\'q'}</span></p>
		        <div class="pt-3 text-center">
		      	  <button type="button" class="btn btn-danger" onclick="removeWorker($(this))">Ishdan bo'shatish</button>
		        </div>
		      </div>
		    </div>
		`)
		let workerName = workerHtml.find('.card-title.text-center')
		worker.status ? workerName.addClass('text-success') : workerName.addClass('text-dark')
		$('.workers').append(workerHtml)
	})
}

const mobileDesign = () => {
	if ($(window).width() < 500) {
		$('.trades-container').removeClass('px-4')
		$('.trade-filter-form button[type="submit"]').removeClass('col-md-2')
	}
	else {
		$('.trades-container').addClass('px-4')
		$('.trade-filter-form button[type="submit"]').addClass('col-md-2')
	}
}