// rtc chat caller-enter-name.js
// Copyright 2013 Timur Mehrvarz <timur.mehrvarz@riseup.net>
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

var host;
var socket = null;
var lastServerAction = 0;

$(function(){
	host = location.hostname;
    console.log("start: host",host);
    console.log("start: wsCallerPort:",wsCallerPort," key:",key);
	connectToCallerService();
});

function connectToCallerService() {
    var hostAddr = host+":"+wsCallerPort;
    var	socketServerAddress;
	if(window.location.href.indexOf("https://")==0)
		socketServerAddress = "wss://"+hostAddr+"/ws";
	else
		socketServerAddress = "ws://"+hostAddr+"/ws";
    console.log("connecting to admin server",hostAddr);
    socket = new WebSocket(socketServerAddress);
    if(!socket) {
	    console.log("failed to connect to admin server",hostAddr);
		window.setTimeout(function(){
			connectToCallerService();
		},2000);
	}
    console.log("connected to admin server "+hostAddr);

	socket.onopen = function () {
		lastServerAction = new Date().getTime();
	    // start heartbeat (send "alive?" requests, if last "connect" is older than)
	    checkHeartBeats();
        $('#getRoomName').modal('show');
	    $('#roomName').focus();
	    $('#linktyp').prop('checked', false);
	};
	socket.onerror = function () {
	    console.log("failed to connect to admin server",hostAddr);
		window.setTimeout(function(){
			connectToAdminServer();
		},3000);
	}
    socket.onmessage = function(m) { 
        var data = JSON.parse(m.data);
    	//console.log("socket message raw:", data);
    	
    	switch(data.command) {
		case "alive!":
			// this is the host confirming connect or alive
			//console.log("connect:");
			// reset heartbeat timeout
			lastServerAction = new Date().getTime();
			break;

		case "info":
			var msg = data.msg;
			console.log(msg);

		case "newRoom":
			var roomName = data.roomName;
			lastServerAction = new Date().getTime();
			console.log("newRoom: roomName="+roomName);
			if(roomName!="") {
				window.location.href = "https://"+location.hostname+":"+wsPort+"/?room="+roomName;
            }
		}
    }
}

function checkHeartBeats() {
	window.setTimeout(function(){
		var timeSinceLastServerAction = new Date().getTime() - lastServerAction;
		if(timeSinceLastServerAction>6000) {
			// must reconnect
		    console.log("disconnected from admin server");
			connectToAdminServer();
			return;
		}
		
		if(timeSinceLastServerAction>3000) {
		    console.log("check if admin server still alive...");
	    	socket.send(JSON.stringify({command:'alive?'}));
		}
		checkHeartBeats();
    },500);
}

$('#callBtn').click(function() {
    // user has entered a room name
    makeCall()
});

function makeCall() {
	// caller has entered his name
	// we need to offer callee and allow him to answer the incoming call
    var username = $('#roomName').val();
    var linktype = "relayed";
	if($('#linktyp').is(':checked')) {
		linktype = "p2p";
	}   
    console.log("makeCall() username="+username+" linktype="+linktype+" key="+key);
    if(username.length>0) {
		// socket.send to callerService.go: case "call"
        console.log("makeCall() socket.send 'call'");
	    $('#getRoomName').modal('hide');
		socket.send(JSON.stringify({command:'call', name: username, linktype: linktype, key: key}));
	} else {
        console.log("makeCall() no username");
        location.reload();
	}
}

