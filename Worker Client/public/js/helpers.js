
let worker = JSON.parse( localStorage.getItem('worker') )
let lastTrade = JSON.parse( localStorage.getItem('trade') )
let homePageUrl = location.origin
const toggleTradeProductsContainer = self => {
	self.parent().parent().find('.trade-products-wrapper').toggleClass('d-none')
}

const updateSiteLead = () => $('.worker-name').text(`${worker.username} : ${worker.status ? 'Ishlayapti' : 'Tayyor'}`)

const logoutWorker = () => {
	localStorage.removeItem('worker')
	goToAuth()
}

const goToMain = () => window.location.href = `${homePageUrl}/?page=main`

const goToAuth = () => window.location.href = `${homePageUrl}/?page=auth`

const createTrades = (trade, local=false) => {
	$(`.main-container`).html(``)

	let tradeHtml = $(`
	  <div class="py-2 px-3 shadow rounded border trade">
        <div class="card-text trade-seller">Sotuvchi: <span>${trade.seller.username}</span></div>
        <div class="card-text">Xaridor: <span>${trade.customer}</span></div>
        <span class="mt-2 text-center trade-open-products-wrap">
        	<p class="m-0 font-italic trade-open-products" onclick="toggleTradeProductsContainer($(this))">Tovarlar</p>
        </span>
        <div class="py-3 text-white d-none trade-products-wrapper"></div>
        <div class="py-3 text-center">
        	<button class="btn btn-primary accept-trade-btn" onclick="acceptTrade($(this))">Qabul qilaman</button>
        </div>
      </div>
	`)

	if (local) {
		tradeHtml.find('.accept-trade-btn').attr('disabled', true).text('Qabul qilindi').removeClass('btn-primary').addClass('btn-success')
	}

	let tradeProducts = tradeHtml.find('.trade-products-wrapper')
	trade.products.forEach(product => {
		let productHtml = $(`				
          <div class="cart-item px-3" style="font-weight: 500;">
            <p class="m-0">${product.name}</p>
            <p class="m-0">x${product.num}</p>
          </div>
		`)
		tradeProducts.append(productHtml)
	})

	$(`.main-container`).append(tradeHtml)
}