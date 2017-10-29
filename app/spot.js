require('dotenv').config()
var request = require('request-promise');
var mysql = require('promise-mysql');
var headers;

(async function() {
	try {
		var con = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			port: process.env.DB_ROOT,
			database: 'spotifyTokens'
		});

		let results = await con.query("SELECT * FROM tokens");
		let refresh_token = results[0].refresh_token;

		let options = {
			url: 'https://accounts.spotify.com/api/token',
			method: 'POST',
			form: { 
				'client_id': process.env.SPOTIFY_CLIENT_ID,
				'client_secret': process.env.SPOTIFY_CLIENT_SECRET,
				'grant_type': 'refresh_token',
				'refresh_token': refresh_token
			}
		}

		let res = await request(options);
		let access_token = JSON.parse(res)['access_token'];
		refresh_token = JSON.parse(res)['refresh_token'];
		if (refresh_token) {
			await con.query("UDPATE tokens SET date = NOW(), refresh_token = " + refresh_token);
		}

		con.end();

		headers = {
			'Accept': 'application/json',
			'Authorization': 'Bearer ' + access_token
		}
	} catch(error) {
		console.log(error);
	}
}());

async function getCategories() {
	try {
		let res = await request.get({ 
			url: 'https://api.spotify.com/v1/browse/categories',
			headers: headers
		});
		let categories = JSON.parse(res)['categories'].items;
		return 'Here is a list of categories: ' + categories.map((obj) => obj.name)

	} catch(error) {
		return 'Unexpected error. Please try again at another time.';
	}
}

async function getPlaylistRecommendations(category) {
	try {
		let res = await request.get({ 
			url:`https://api.spotify.com/v1/browse/categories/${category}/playlists?country=US&limit=10`,
			headers: headers
		});

		let song = JSON.parse(res)['playlists'].items;
		return 'Here is a list of Spotify\'s recommended playlists: ' + song.map((obj) => obj.name);

	} catch(error) {
		return 'Hmm... try being more specific. Example of genres are: top lists, pop, hip-hop, rock, etc';
	}
}

async function getSongRecommendations(keyword, type) {
	try {
		let get_id = await request.get({ 
			url:`https://api.spotify.com/v1/search`,
			qs: {
				q: keyword + '*', // wildcard search
				type: type,
				country: 'US'
			},
			headers: headers
		});

		// choose most popular item
		let item_id = JSON.parse(get_id)[type+'s'].items[0].id

		if (type === 'artist') {
			var qs = { seed_artists: item_id, market: 'US'};
		} else if (type === 'track') {
			var qs = { seed_tracks: item_id, market: 'US' }
		} else {
			return 'Please choose a valid search type (i.e. artist or track)';
		}
		let get_rec = await request.get({ 
			url:`https://api.spotify.com/v1/recommendations`,
			qs: qs,
			headers: headers
		});

		let item = JSON.parse(get_rec)['tracks'];
		let map = item.map((obj) =>  [obj.artists[0].name, obj.name]);
		
		let map_string = '';
		map.forEach(function(e) {
			map_string += `\n${e[1]} by *${e[0]}*, `
		});

		return 'Here is a list of song recommendations: ' + map_string.slice(0, -2);

	} catch(error) {
		console.log(error)
		return 'Oops. Something went wrong.';
	}
}
module.exports = { getCategories, getPlaylistRecommendations, getSongRecommendations }
