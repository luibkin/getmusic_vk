const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const MPC = require('mpc-js').MPC;


let XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
let reqMsg = new XMLHttpRequest();
let reqConversation = new XMLHttpRequest();
let markMsgAsRead = new XMLHttpRequest();
let songUrl;
let msgUnreadCount;
let lastMsgId;
let songArtist;
let songTitle;
let songsNumber;
const mpc = new MPC();
// connect via TCP (when running in node.js)
mpc.connectTCP('localhost', 6600);


function saveSong(fileName, fileUrl) {
	const file = fs.createWriteStream(fileName); //flename - String
	const request = https.get(fileUrl, function(response) { //fileUrl - String
		response.pipe(file);

		// after download completed close filestream
		file.on("finish", () => {
			file.close();
			//console.log("Download Completed");
		});
	});
};

function getMusic () {
	reqConversation.open("GET", "https://api.vk.com/method/messages.getConversationsById?v=5.131&peer_ids=2000000001&access_token=*******token*******", false);
	reqConversation.send(null);

	msgUnreadCount = JSON.parse(reqConversation.responseText).response.items[0].unread_count;
	lastMsgId = JSON.parse(reqConversation.responseText).response.items[0].last_conversation_message_id;

	console.log(lastMsgId);
	console.log(msgUnreadCount);

	let i = lastMsgId - msgUnreadCount + 1;

	markMsgAsRead.open("GET", `https://api.vk.com/method/messages.markAsRead?v=5.131&peer_id=2000000001&conversation_message_ids=${lastMsgId}&access_token=*******token*******`, false);
	markMsgAsRead.send(null);

	while (i <= lastMsgId) {
		reqMsg.open("GET", `https://api.vk.com/method/messages.getByConversationMessageId?v=5.131&peer_id=2000000001&conversation_message_ids=${i}&access_token=*******token*******`, false);
		reqMsg.send(null);
		songsNumber = JSON.parse(reqMsg.responseText).response.items[0].attachments.length;
		console.log(songsNumber);
		let k = 0;
		while (k < songsNumber){
			try {
				songUrl = JSON.parse(reqMsg.responseText).response.items[0].attachments[k].audio.url
				songArtist = JSON.parse(reqMsg.responseText).response.items[0].attachments[k].audio.artist
				songTitle = JSON.parse(reqMsg.responseText).response.items[0].attachments[k].audio.title
				console.log(songUrl);
            const saveSongPromise = new Promise(
                function(resolve, reject){
                    let title = songTitle;
                    let artist = songArtist;
                    saveSong(`/mnt/sdb1/Music/${title} - ${artist}.mp3`, songUrl);
                    resolve([title, artist]);
                }
            )
                .then((arrSong) => {
                    console.log(arrSong);
                    mpc.database.update()
                        .then(
                            res => {
                                console.log(res);
                                console.log(arrSong);
                                return `Database updated, result number - ${res}`;
                            }
                       //mpc.currentPlaylist.add(`${songTitle} - ${songArtist}.mp3`);
                        )
                        .then(
                            db_updated => {
                                  console.log(db_updated);
                                  console.log(arrSong);
                                  setTimeout(() => {mpc.currentPlaylist.add(`${arrSong[0]} - ${arrSong[1]}.mp3`).then(() => console.log("add in db")).catch(function(err) {console.log(err)})}, 2000);
                                  //return "1";
                                  //mpc.currentPlaylist.add(`The Hudson - Amy Macdonald.mp3`);
                            }
                        )
                        .catch(function(err) {console.error(err.message)});
                    }
                 )
                 .catch(function(err) {console.error(err.message)})

            //setTimeout(() => {console.log(mpc.database.update())}, 10000);
            //setTimeout(() => {console.log(mpc.database.update().then(function(result) {console.log(result)}))}, 1500);

            //mpc.currentPlaylist.add(`${songTitle} - ${songArtist}.mp3`);
            //setTimeout(() => {mpc.currentPlaylist.add(`${songTitle} - ${songArtist}.mp3`)}, 2000);
            //mpc.currentPlaylist.add(`Паулина Андреева_-_Оттепель.mp3`);
            
			} catch (err) {
				console.log("Нет песен");
			};
			k = k + 1;
		};
		i = i + 1;
	};




//	setTimeout(showMessage, 3000);
// example1.js


/*function sleep(millis) {
    var t = (new Date()).getTime();
    var i = 0;
    while (((new Date()).getTime() - t) < millis) {
        i++;
    }*/
};

setInterval(getMusic, 3000);

