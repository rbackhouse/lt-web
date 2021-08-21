import EventEmitter from "./EventEmitter";
import configData from "./config.json";

function createWsURL() {
    if (configData.wsUrl) {
      return configData.wsUrl;
    }
    var wsUrl;
    if (window.location.protocol === "https:") {
      wsUrl = "wss";
    } else {
      wsUrl = "ws";
    }
    wsUrl += '://' + window.location.host+"/ws";
    return wsUrl;
}
  
const WS = {
    socket: undefined,
    isErrored: false,
    createWebSocket: function () {
        this.socket = new WebSocket(createWsURL());
        this.socket.onopen = () => {
            EventEmitter.dispatch("wsOnOpen", {});
        };
    
        this.socket.onmessage = (message) => {
            console.log(message.data);
    
            const response = JSON.parse(message.data);
            switch (response.Type) {
                case 0:
                    EventEmitter.dispatch("wsOnGetTrackables", response.Trackables);
                    break;  
                case 1:
                    break;  
                case 2:
                    break;  
                case 3:
                    break;  
                case 4:
                    EventEmitter.dispatch("wsOnTrack", response);
                    break; 
                default:
                    break;   
            }
        };
    
        this.socket.onclose = (event) => {
            EventEmitter.dispatch("wsOnClose", {});
            if (!this.isErrored) {
                this.socket = undefined;
                this.createWebSocket();
            }
        };
    
        this.socket.onerror = (error) => {
            this.isErrored = true;
            EventEmitter.dispatch("wsOnError", {});
        };
    },
    send: function(reqData) {
        this.socket.send(JSON.stringify(reqData));
    }    
}

export default WS;
