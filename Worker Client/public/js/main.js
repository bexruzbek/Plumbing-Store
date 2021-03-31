
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

if (!page && !worker) goToAuth()
if (!page && worker) goToMain()

if (page == 'main') {
	if (!worker) goToAuth()
	$('.main').removeClass('d-none')
	
	socket.emit('get_all_workers')
	socket.on('get_all_workers:ready', data => {
		let index = data.findIndex(item => item._id === worker._id)
		if (index < 0) return $('body').html(`Siz ishdan bo'shatilgansiz!`)

		worker = data[index]
		localStorage.setItem('worker', JSON.stringify(worker))
		updateSiteLead()
	})

	socket.emit('new_connection', { role: 'worker', room: 'workers', worker: worker })
	socket.on('new_connection:error', () => $('body').html('Bu ishchi hozirda ishlayapti!'))

	socket.on('new_trade', data => {
		if (worker.status) return $(`.main-container`).html(``)
		lastTrade = data
		createTrades(lastTrade)
		localStorage.setItem('trade', JSON.stringify(lastTrade))
	})

	socket.on('trade_accepted', data => {
		if (data.worker._id !== worker._id) return $(`.main-container`).html(``)
		$('.trade .accept-trade-btn').text('Qabul qilindi').removeClass('btn-primary').addClass('btn-success')
		worker.status = true
		updateSiteLead()
		localStorage.setItem('worker', JSON.stringify(worker))
	})

	socket.on('worker_updated', data => {
		worker = data
		localStorage.setItem('worker', JSON.stringify(worker))
		updateSiteLead()
		if (!worker.status) {
			$(`.main-container`).html(``)
			localStorage.removeItem('trade')
		}
	})

	socket.on('worker_removed', data => {
		if (worker._id == data._id) {
			alert(`Siz ishdan bo'shatildingiz!`)
			localStorage.removeItem('trade')
			goToAuth()
		}
	})

	if (lastTrade) createTrades(lastTrade, true)
}

else if (page == 'auth') {
	if (worker) goToMain()	
	$('.worker-auth-container').removeClass('d-none')

	$('.worker-auth-form').on('submit', evt => {
		evt.preventDefault()
		let worker = {
			username: $('form #username').val().trim(),
			password: $('form #password').val().trim(),
		}
		socket.emit('check_worker', worker)
	})

	socket.on('worker_checked', data => {
		if (data.error) return $('.worker-auth-form p.text-danger').text(data.message)
		localStorage.setItem('worker', JSON.stringify(data.worker))
		goToMain()
	})
}

const acceptTrade = self => {
	socket.emit('trade_accepted', { trade: lastTrade, worker: worker._id })
	self.attr('disabled', true)
}