require('dotenv').config()
var request = require('request-promise');
var WebSocket = require('ws');
var spot = require('./spot');

function rtmStart() {
	try {
		let options = {
			url: 'https://slack.com/api/rtm.start',
			method: 'POST',
			form: {
				token: process.env.SLACK_BOT_ACCESS_TOKEN,
			},
			json: true
		}

		return request(options)
			.then(body => body.url)
			.catch(function(err) {
				console.log('Request error: ' + err);
			}); 

	} catch(error) {
		console.log('Error: ' + error)
	}
}

(async function() {
	let slackWsUrl = await rtmStart();
	let ws = new WebSocket(slackWsUrl);

	ws.on('open', data => {
		console.log('Socket open')
	});

	ws.on('message', async data => {
		response = JSON.parse(data);
		if (response.type === 'message') {

			let message = response.text;
			let user = response.user;
			let channel = response.channel;

			if (message.includes('categories')) {
				try {
					var text = await spot.getCategories();
				} catch(err) {
					var text = 'Something went wrong. Please contact your admin.';
				}
			} else if (message.includes('playlist')) {
				try {
					let genre = ((message.split(/'/)[1]).replace(' ', '_')).replace('-','');
					var text = await spot.getPlaylistRecommendations(genre);
				} catch(err) {
					var text = 'Be sure to wrap your desired playlist in single quotes or ask for a list of cateogries if you need more help! (Ex: \'hip-hop\' or \'top lists\').';
				}
			} else if (message.includes('recommend')) {
				try {
					let keyword = message.split(/'/)[1];
					if (message.includes('artist')) {
						var type = 'artist';
					} else if (message.includes('track')) {
						var type = 'track';
					} else {
						var type = false;
					}
					var text = await spot.getSongRecommendations(keyword, type);
				} catch(err) {
					var text = 'Be sure to wrap your keyword in single quotes and include a search type (Ex: track \'protect ya neck\' or artist \'wutang\').';
				}
			}

			ws.send(JSON.stringify({
				type: 'message',
				text: text,
				channel,
				user
			}));
		}
	});
}());
