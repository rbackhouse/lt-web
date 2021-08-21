import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import styled from 'styled-components';

import EventEmitter from "./EventEmitter";

import configData from "./config.json";

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

export default class TrackingMap extends Component {
  constructor(props) {
      super(props);
      this.state = {
        markers: []
      }
  }

  componentDidMount() {
    EventEmitter.subscribe("wsOnTrack", (trackingData) => {
      if (trackingData.TrackeeName === this.props.trackee) {
        let timestamp = new Date(0);
        timestamp.setUTCSeconds(trackingData.TrackingData.Timestamp);
        const marker = {
          latitude: trackingData.TrackingData.Latitude, 
          longitude: trackingData.TrackingData.Longitude,
          title: timestamp.toString()
        }
        this.state.markers.push(marker);
        this.setState({markers: this.state.markers});
      }
    });
  }

  componentWillUnmount() {
    EventEmitter.unsubscribe("wsOnTrack");
  }

  render() {
    const { def, value, index } = this.props;
    return (
      <div 
      style={{ height: '75vh'}}
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}        
      >
      <GoogleMapReact
        bootstrapURLKeys={{ key: configData.mapKey }}
        defaultCenter={def.center}
        defaultZoom={def.zoom}
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
    );
  }
}
