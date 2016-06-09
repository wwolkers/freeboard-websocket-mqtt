# freeboard-websocket-mqtt
Plugin for Freeboard to communicate using MQTT over websocket


Clone the repository, copy the files into your
freeboard/plugins/thirdparty folder

modify the index.html to load the ws_mqtt.js file.

example:

    <script type="text/javascript">
            head.js("js/freeboard_plugins.min.js",
	    "plugins/thirdparty/ws_mqtt.js",
	    // *** Load more plugins here ***

