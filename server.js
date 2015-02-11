var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static (__dirname + '/public'))

app.get('/', function (req, res) {
	res.sendfile('public/index.html'); //our link to the index.html aka our views
});

/*
This means that the server can push messages to clients. Whenever you write a chat message, 
the idea is that the server will get it and push it to all other connected clients.
*/


/*
1.Express initializes app to be a function handler that you can supply to an HTTP server (as seen in line 2). 
2.We define a route handler / that gets called when we hit our website home.
3.We make the http server listen on port 3000.

*/

var packets_stored = []; // packets are stored
var clients_stored = []; //a dictionary, where the key is the clients ID. the value is the person's obj.
var messages_stored = []; //stored messages

var room = 'room'; // default room (multiple rooms later)
var global_id_counter = 0; //this counter is used to index incomming chat mesages

var availableTags = ["\\help", "\\poll", "\\question"]; // available Tags used by the client
var askMessage = "What's your name?"; //inital emission

var msgTypeOps = {
};
msgTypeOps['Opinion Question'] = (new msgTypeOp("?", true, ""));
msgTypeOps['Trivia Question'] = (new msgTypeOp("?!", true, ""));
msgTypeOps['Normal'] = (new msgTypeOp("", false), "");

function msgTypeOp(v, r, a) {
	this.visual = v;
	this.reply = r;
	this.answerType =a;
}

//for (var i in msgTypeOps){
//console.log(msgTypeOps);
//}

io.on('connection', function (socket) {
	socket.join(room);

	console.log("a user connected");
	io.to(room).emit('userC', "New user connected");
	packets_stored.push(socket);
	socket.emit('ServerMsg', askMessage);	// sends askMessage to client on 'ServerMsg'


	io.emit('msgTypeOps', msgTypeOps); 	// sends the types of operations available.

	socket.on('initUser', function (person) {
		initUser(person, socket.id);
	}); // listens for clients personal stuff - see function section 

	socket.on('chat message', chatMessage); // listens for incoming chat message - see function section

	socket.on('disconnect', function () {
		console.log('User %s (aka %s) disconnected', socket.id, clients_stored[socket.id].name);
		io.to(room).emit('userD', clients_stored[socket.id].name + " disconnected");
		io.to(room).emit('dismissUser', "Bye " + clients_stored[socket.id].name);
		clients_stored = DictionaryDelete(socket.id, clients_stored);
		console.log('Total number of clients: %s\n', Object.keys(clients_stored).length);
	});

	socket.on("typing", function (data) {
		typing(data, socket.id);
	}); // listens for client typing - see function section


	io.to(room).emit('getTags', availableTags); // Sends tags to client on 'getTags'

	//end of connection socket function
});

var os = require('os');
var ifaces = os.networkInterfaces();
var ip = "";
for (var dev in ifaces) {
	ifaces[dev].forEach(function (details) {
		if (details.family == 'IPv4' && ip == "") {
			ip = details.address;
		}
	});
}

http.listen(3000, function () {
	console.log("listening on", ip? ip:"localhost", "port " + 3000);
	//console.log('listening on localhost:3000');
});


/*********** HELPERS / FUNCTIONS *************/

/* Helper: Custom Dictionary Deleting */
function DictionaryDelete(key, dict) {
	if (!dict.hasOwnProperty(key)) {
		return dict;
	}
	if (isNaN(parseInt(key)) || !(dict instanceof Array)) {
		delete dict[key];
		return dict;
	}
	else {
		dict.splice(key, 1);
		return dict;
	}
}


/* On Initialize User */
function initUser(person, id) {
	if (typeof person !== "undefined" && person.name != '') {
		clients_stored[id] = person;
		console.log('User %s Initialized with the name of %s\nTotal number of users:%s\n', id, person.name, Object.keys(clients_stored).length);
		io.to(room).emit('greetUser', "Welcome " + person.name);
		io.to(room).emit('serverStatus', person.name + ' Entered');
		//var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
	}
}


function processMsgType(message){
	if(message.msg.slice(-1)=='?')
	{
		return "Opinion Question";
	}else
	{
		return "Normal";
	}
}

/* On Chat Message Function */
function chatMessage(message) {
	if (isValid(message)) {
		
		//Server side Processing
		if(message.type ==""){
			message.type = processMsgType(message);	
		}
		
		message.from_id = global_id_counter++;
		
		console.log('from:%s\nto:%s\ntype:%s\nmessage: %s\n', message.from_user, message.to_id, message.type, message.msg);
		
		io.to(room).emit('chat message', message);
		messages_stored[message.from_id] = message;
		console.log('created and emmited its from_id as: %s\nTotal messages is %s\n', message.from_id, messages_stored.length);
		//for pm?: socket.to(room).emit('id',socket.id);
	}
}

/* On Typing */
function typing(data, id) {
	if (typeof clients_stored[id] !== "undefined")
		io.sockets.in (room).emit("isTyping", {
		isTyping: data, person: clients_stored[id].name
	});
	//check out socket.room soon
}

/* Valid Check */
function isValid(message) {
	if (typeof (message) == 'undefined') {
		console.log('Object error... Skipping');
		return false;
	}
	else if (message.msg == "") {
		console.log('Message error... Skipping');
		return false;
	}
	else if (message.from_user == "" || message.to_id == "") {
		console.log('Meta error... Skipping');
		return false;
	}
	else {
		return true;
	}
}
