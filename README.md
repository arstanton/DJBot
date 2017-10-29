# songRecommendationSlackBot
Get song recommendations using the slack and spotify apis
## Build Setup

##### #install dependencies
npm install

##### #register slackbot in slack api
just need to enable it

##### #input spotify clientID and clientSecret, slack bot access token (optionally to add db auth to save spotify refresh token)
recommended to use .env

##### #slack bot keywords
1. Using 'category' will query for all categories

2. Using 'playlist' will query for playlists within a defined category. A category must be provided with the keyword and must be within single quotes. 
Example: playlists 'pop' 

3. Using recommend will query for song recommendations. A search type ('artist' or 'track') and keyword (in single quotes) must be provided.
Example: recommend artist 'wutang' or recommend track 'protect ya neck'
