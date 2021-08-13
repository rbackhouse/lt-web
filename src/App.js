import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import { Button } from '@material-ui/core';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import styled from 'styled-components';
import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';

import configData from "./config.json";

function Text(props) {
  return <div style={{ margin: 5 }}>{props.children}</div>;
}

//const MapMarker = ({ text }) => <div>{text}</div>;

/*
const Marker = ({}) => {
  const markerStyle = {
    border: '1px solid white',
    borderRadius: '50%',
    height: 10,
    width: 10,
    backgroundColor: 'blue',
    cursor: 'pointer',
    zIndex: 10,
  };

  return (
    <>
      <div style={markerStyle} />
    </>
  );
};
*/

const Wrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 18px;
  background-color: #000;
  border: 2px solid #fff;
  border-radius: 100%;
  user-select: none;
  transform: translate(-50%, -50%);
  cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
  &:hover {
    z-index: 1;
  }
`;

const Marker = ({ text, onClick }) => (
  <Wrapper
    alt={text}
    onClick={onClick}
  />
);

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

function SimpleDialog(props) {
  const { onClose, open, dialogTitle, trackables } = props;

  const handleListItemClick = (value) => {
    onClose(value);
  };

  return (
    <Dialog aria-labelledby="simple-dialog-title" open={open}>
      <DialogTitle id="simple-dialog-title">{dialogTitle}</DialogTitle>
      <List>
        {trackables.map((trackable) => (
          <ListItem button onClick={() => handleListItemClick(trackable)} key={trackable}>
            <ListItemText primary={trackable} />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}

class SimpleMap extends Component {
  static defaultProps = {
    center: {
      lat: 35.7351642,
      lng: -78.889743
    },
    zoom: 11
  };

  constructor(props) {
    super(props);
    this.state = {
      trackables: [], 
      isTracking: false, 
      dialogOpen: false, 
      dialogTitle: "",
      userName: "",
      trackee: "",
      markers: [],
      showAlert: false,
      alertMsg: "",
      showInfo: false,
      infoMsg: ""
    };
  }

  componentDidMount() {
    this.setState({isTracking: false});
    this.createWebSocket();
  }

  createWebSocket() {
    this.socket = new WebSocket(createWsURL());
    this.socket.onopen = () => {
      console.log('WebSocket Client Connected');
      this.setState({showInfo: true, infoMsg: "Connected to WebSocket"});

      const reqData = {
        RequestType: 2
      }            
      this.socket.send(JSON.stringify(reqData));
      if (this.state.isTracking) {
        this.startTracking(this.state.userName, this.state.trackee);
      }
    };

    this.socket.onmessage = (message) => {
      console.log(message.data);

      const response = JSON.parse(message.data);
      switch (response.Type) {
        case 0:
          this.setState({trackables: response.Trackables});
          this.setState({showInfo: true, infoMsg: "Loaded Trackables"});
          break;  
        case 1:
          break;  
        case 2:
          break;  
        case 3:
          break;  
        case 4:
          let timestamp = new Date(0);
          timestamp.setUTCSeconds(response.TrackingData.Timestamp);
          const marker = {
            latitude: response.TrackingData.Latitude, 
            longitude: response.TrackingData.Longitude,
            title: timestamp.toString()
          }
          this.state.markers.push(marker);
          this.setState({markers: this.state.markers});
          break; 
        default:
          break;   
      }
    };

    this.socket.onclose = (event) => {
      console.error("WebSocket close:", event);
      if (this.state.alertMsg === "") {
        this.createWebSocket();
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.setState({showAlert: true, alertMsg: "WebSocket error"});
    };
  }

  handleClose(trackable) {
    this.setState({dialogOpen: false});
    if (this.state.dialogTitle === "Select User") {
      this.setState({userName: trackable, dialogOpen: true, dialogTitle: "Select Trackee"});
    } else {
      this.setState({trackee: trackable, dialogTitle: "Select User"});
      this.startTracking(this.state.userName, trackable);
    }
  }

  startTracking(userName, trackee) {
    const reqData = {
      RequestType: 0,
      TrackingRequest: {
        TrackeeName: trackee,
        UserName: userName
      }
    }            
    this.socket.send(JSON.stringify(reqData));
  }

  render() {
    return (
      <div>
      <div style={{ margin: 10 }}>
        <Button disabled={this.state.isTracking} 
          variant="contained" 
          color="primary"
          onClick={() => {
              this.setState({isTracking: true, dialogOpen: true, dialogTitle: "Select User"});
          }}>
          Start Tracking
        </Button>
        <Button 
          disabled={!this.state.isTracking} 
          variant="contained"
          onClick={() => { 
            this.setState({isTracking: false, userName: undefined, trackee: undefined})
            const reqData = {
              RequestType: 1,
              TrackingRequest: {
                TrackeeName: this.state.trackee,
                UserName: this.state.userName
              }
            }            
            this.socket.send(JSON.stringify(reqData));      
          }} 
          color="primary">
          Stop Tracking
        </Button>
        <Text>User: {this.state.userName}</Text>
        <Text>Trackee: {this.state.trackee}</Text>
      </div>
      <div style={{ height: '90vh', width: '100%' }}>
        <GoogleMapReact
          bootstrapURLKeys={{ key: configData.mapKey }}
          defaultCenter={this.props.center}
          defaultZoom={this.props.zoom}
        >
          {this.state.markers.map((marker, index) => (
            <Marker
              lat={marker.latitude}
              lng={marker.longitude}
              text={marker.title}
              key={index}
            />
          ))}    
        </GoogleMapReact>
      </div>
      <SimpleDialog open={this.state.dialogOpen} onClose={(trackable)=> this.handleClose(trackable)} dialogTitle={this.state.dialogTitle} trackables={this.state.trackables}/>
      <Snackbar
        anchorOrigin={ {vertical: 'bottom', horizontal: 'left' }}
        open={this.state.showAlert}
        onClose={() => this.setState({showAlert: false})}
      >
          <Alert severity="error" onClose={() => { this.setState({showAlert: false}); }}>{this.state.alertMsg}</Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={ {vertical: 'bottom', horizontal: 'left' }}
        open={this.state.showInfo}
        onClose={() => this.setState({showInfo: false})}
        autoHideDuration={6000}
      >
          <Alert onClose={() => { this.setState({showInfo: false}); }}>{this.state.infoMsg}</Alert>
      </Snackbar>

      </div>
    );
  }
}

export default SimpleMap;
