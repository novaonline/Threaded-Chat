/* Functions & Helpers More related to what the browser needs to know
	I.E. Indepednent from  io.socket 
*/

/*random color gen.
'#'+(Math.random()*0xFFFFFF<<0).toString(16);


"#"+((1<<24)*Math.random()|0).toString(16)

'#'+Math.random().toString(16).substr(-6); 
*/

/* Non-Visual Functions */
var lastScrollTop = 0;
$(window).scroll(function (event) {
	var st = $(this).scrollTop();
	var chatbox = $("#inputbox");
	if (chatbox.position().top >= 0 && chatbox.position().top <= $(window).height()) //in viewport
	{
		if (st > lastScrollTop) {
			// downscroll code
			chatbox.animate( {
				"top": "10%"
			}, {
				queue:false,
				complete: function () {
					$("#dropdownbox").removeClass('dropup');
				}
			});
			//chatbox.css('top', "10%");
			//chatbox.animate({ "top": "-="+1 }, {duration: 5}, "fast" );
		} else {
			// upscroll code
			chatbox.animate( {
				"top": "90%"
			}, {
				queue:false,
				complete: function () {
					$("#dropdownbox").addClass('dropup');
				}
			});
			//chatbox.css('top', '90%');
			//chatbox.animate({ "top": "+="+1 }, {duration: 5}, "fast" );
		}
	}


	lastScrollTop = st;
});

$("body").keypress(function (e) {

	if (e.which != 13 && !Prompted) {
		$("#m").focus();
		//console.log( "Showing input: " + String.fromCharCode(e.which));
		$("#inputbox").animate( {
			opacity: 1
		}, {
			queue:false
		});
	}
	else {
		//console.log( "hiding input" );
		$("#inputbox").animate( {
			opacity: 0
		}, {
			queue:false
		});
	}
});

function CreateQuestionTypes(List_fromServer) {
	for (ins_list in List_fromServer) {
		$('#dropdownbox_data').append($("<li />",{role: "presentation"}).append($('<a/>',{ role:"menuitem", tabindex:"-1", text: ins_list})));
	}
}

/* Visual Functions */
function visual_greetUser(greet) {
	$('#messages').append($('<p>').text(greet));
}

function visual_sendMessage(to) {
	var result = new message(myMe.name, - 1, to, $('#m').val());
	$('#m').val('');
	return result;
}

function visual_getMessage(message, opTypes) {
	//if(($("#m").val().length === 0)){
	//return
	//}
	if (message.to_id != "all") {

		$('#' + message.to_id).append($('<li>').attr( {
			'class':'list-group-item',
			'id':message.from_id
		}).text(message.from_user + ": " + message.msg));

	}else {
		$('#messages').append($('<li>').attr( {
			'class':'list-group-item',
			'id':message.from_id
		}).text(message.from_user + ": " + message.msg));
	}
	if (opTypes[message.type].visual != "" || !(opTypes[message.type].visual === null)) {
		$('#' + message.from_id).prepend($('<span>').attr( {
			'class':'badge'
		}).text(opTypes[message.type].visual));
	}
	if (opTypes[message.type].reply) {
		console.log("just made " + message.from_id + " replyable");
		$('#' + message.from_id).bind('click', sendToUser);
		//$('#'+message.from_id).addClass("active");
	}

	//Make Better - use to use $(document).height
	if ($(window).scrollTop() + $(window).height() < $('#' + message.from_id).position().top) {
		$('#newMsgBox').text("Click here for new unread message");
		$('#newMsgBox').fadeIn('slow');

		$('#newMsgBox').click(function () {
			$('html, body').animate( {
				scrollTop: $('#' + message.from_id).offset().top
			}, {
				duration: 800,
				queue:false
			});
			$(this).fadeOut('slow');
		});

		//alert("Warning, New messages");
	}else {
		$('html, body').animate( {
			scrollTop: $('#' + message.from_id).offset().top
		}, 800);
	}
}

function visual_userTyping(message) {
	$("#" + message.from_user + "").remove();
	clearTimeout(timeout);
	timeout = setTimeout(timeoutFunction, 0);
}

function visual_dismissUser(dismiss) {
	$('#messages').append($('<p>').text(dismiss));
}

function visual_disconnect() {
	$('#messages').append($('<p>').text(("You've been disconnected. Sorry! We'll reconnect you the moment.")));
}

function visual_statusMessage(message) {
	console.log(message);
	$('#statusBox').text(message);
	$('#statusBox').fadeIn('slow').delay(5000).fadeOut('slow');
}

/* CLASSES AKA OBJECTS */

/* 
In all reality, these aren't needed, but I making objects look like classes.
This is where you will find all the client 'classes'

I had a tough time determining where should the work load go server or client?

So I decided to distribute it evenly - Have the server provide the data, have the server process the data.

So this file is ultimately the functions for 'browser processing'
*/
// me class
function me(name, color) {
	this.name = name;
	this.color = "#0";
}
// message class
function message(_fromU, _fromI, _toI, _msg) {
	this.msg = _msg;
	this.from_user = _fromU;
	//msg id
	this.from_id = _fromI;
	this.to_id = _toI;
	this.type = "";
}