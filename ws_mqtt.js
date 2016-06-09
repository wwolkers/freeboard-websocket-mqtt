// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ freeboard.io-node.js                                               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2014 Hugo Sequeira (https://github.com/hugocore)       │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Freeboard datasource plugin for node.js and socket.io.             │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function() {
	
	var nodeJSDatasource = function(settings, updateCallback) {

		var self = this,
			currentSettings = settings,
			url,
			mqtt,
			newMessageCallback;
		var reconnectTimeout = 2000;

		function subscribeMQTT(topic, topicEvent) {
			// Sends request to subscribe
			// (handle event on server-side)
			self.mqtt.subscribe(topic, {qos: 0});
			console.info("Subscribing to '%s' with event '%s'", topic, topicEvent);
		}

		function discardSocket() {
			// Disconnect datasource websocket
			if (self.socket) {
				self.socket.disconnect();
			}
		}
		
		function connectToServer(url) {
			var parser = document.createElement('a');
			parser.href = self.url;
			
			// parser.protocol; // => "http:"
			// parser.hostname; // => "example.com"
			// parser.port;     // => "3000"
			// parser.pathname; // => "/pathname/"
			// parser.search;   // => "?search=test"
			// parser.hash;     // => "#hash"
			// parser.host;     // => "example.com:3000"
			
			self.mqtt = new Paho.MQTT.Client(parser.hostname,
			parseInt(parser.port),
			parser.pathname,
			"web_" + parseInt(Math.random() * 100, 10));
			

                        // set callback handlers
			self.mqtt.onConnectionLost = onConnectionLost;
			self.mqtt.onMessageArrived = onMessageArrived;
			
			// Connect the client, providing an onConnect callback
			self.mqtt.connect({
			    onSuccess: onConnect
			    });

		}

                function onConnectionLost(response) {
		    setTimeout(connectToServer, reconnectTimeout);
		    console.error("Connection to websocket lost, reconnecting to url: %s", self.url);
//	            $('#status').val("connection lost: " + responseObject.errorMessage + ". Reconnecting");
		};
    
		function initializeDataSource() {
			// Reset connection to server
			discardSocket();
			self.url = currentSettings.url;
			connectToServer();
		}
		
		// Called when the connection is made
		function onConnect(){
		    console.log("Connected to MQTT!");
		    
		     // Subscribe to MQTT topics
		     _.each(currentSettings.topics, function(topicConfig) {
		         var topicName = topicConfig.topicName;
			 var topicEvent = topicConfig.topicEvent;
			 console.info("name: %s, event: %s", topicName, topicEvent);
			 if (!_.isUndefined(topicName) && !_.isUndefined(topicEvent)) {
			     subscribeMQTT(topicName, topicEvent);
			 }
		      });
							
		}
		
		// called when a message arrives
		function onMessageArrived(message) {
		    console.log("Topic: %s => %s",message.destinationName, message.payloadString);
		    try {
		        var objdata = JSON.parse(message.payloadString);
			if (typeof objdata == "object") {
		            updateCallback(objdata);
			} else {
			    var data = {};
			    var text = message.destinationName;
			    data[text] = message.payloadString;
		            updateCallback(data);
			}
		    } catch (e) {
		      console.log(e instanceof SyntaxError); // true
		        console.log(e.message);                // "missing ; before statement"
			console.log(e.name);                   // "SyntaxError"
			console.log(e.fileName);               // "Scratchpad/1"
			console.log(e.lineNumber);             // 1
			console.log(e.columnNumber);           // 4
			console.log(e.stack);                  // "@Scratchpad/1:2:3\n"
		    }
		}
		
		this.updateNow = function() {
			// Just seat back, relax and wait for incoming events
			return;
		};

		this.onDispose = function() {
			// Stop responding to messages
			self.newMessageCallback = function(message) {
				return;
			};
			discardSocket();
		};

		this.onSettingsChanged = function(newSettings) {
			currentSettings = newSettings;
			initializeDataSource();
		};
		
		initializeDataSource();
	};

	freeboard
			.loadDatasourcePlugin({
				type_name : "ws_mqtt",
				display_name : "MQTT over websockets",
				description : "A real-time stream datasource using MQTT over websockets.",
				external_scripts : ["http://www.penninkshof16.nl/freeboard/ws/simple-mqtt-websocket-example/mqttws31.js"],
				settings : [
						{
							name : "url",
							display_name : "Server URL",
							description : "(Optional) In case you are using custom namespaces, add the name of the namespace (e.g. chat) at the end of your URL.<br>For example: http://localhost/chat",
							type : "text"
						},
						{
							name : "topics",
							display_name : "Topics to subscribe to",
							description : "In case you are using rooms, specify the name of the rooms you want to join. Otherwise, leave this empty.",
							type : "array",
							settings : [ {
								name : "topicName",
								display_name : "Topic name",
								type : "text"
							}, {
								name : "topicEvent",
								display_name : "Name of the event to subscribe",
								type : "text"
							} ]
						} ],
				newInstance : function(settings, newInstanceCallback,
						updateCallback) {
					newInstanceCallback(new nodeJSDatasource(settings,
							updateCallback));
				}
			});
}());