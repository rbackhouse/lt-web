
import React, { Component } from 'react';
import { Button } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ExploreIcon from '@material-ui/icons/Explore';
import { withStyles } from "@material-ui/core/styles";
import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import PersonIcon from '@material-ui/icons/Person';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import EventEmitter from "./EventEmitter";
import WS from "./WS";
import TrackingMap from './TrackingMap';

const drawerWidth = 240;

const styles = theme => ({
    root: {
      display: 'flex',
    },
    appBar: {
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    appBarShift: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    hide: {
      display: 'none',
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
    },
    drawerPaper: {
      width: drawerWidth,
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0, 1),
      // necessary for content to be below app bar
      ...theme.mixins.toolbar,
      justifyContent: 'flex-end',
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginLeft: -drawerWidth,
    },
    contentShift: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    },
});

function SelectIdDialog(props) {
  const { onClose, open, trackables, title } = props;

  const handleListItemClick = (value) => {
    onClose(value);
  };

  return (
    <Dialog aria-labelledby="simple-dialog-title" open={open}>
      <DialogTitle id="simple-dialog-title">{title}</DialogTitle>
      <List>
        {trackables.map((trackable) => (
          <ListItem button onClick={() => handleListItemClick(trackable)} key={trackable}>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary={trackable} />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}

function a11yProps(index) {
  return {
    id: `tracking-tab-${index}`,
    'aria-controls': `tracking-tabpanel-${index}`,
  };
}

class TrackApp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userName: "",
            drawOpen: false,
            trackables: [], 
            showAlert: false,
            alertMsg: "",
            showInfo: false,
            infoMsg: "",
            tabvalue: 0,
            mapTabs: [],
            dialogTitle: "Select a User"
        };
    }
    
    componentDidMount() {
      EventEmitter.subscribe("wsOnOpen", () => {
        console.log('WebSocket Client Connected');
        this.setState({showInfo: true, infoMsg: "Connected to WebSocket"});
        if (this.state.trackables.length === 0) {
          const reqData = {
            RequestType: 2
          }            
          WS.send(reqData);
        }
      });
      EventEmitter.subscribe("wsOnClose", () => {
        
      });
      EventEmitter.subscribe("wsOnError", () => {
        this.setState({showAlert: true, alertMsg: "WebSocket error"});
      });
      EventEmitter.subscribe("wsOnGetTrackables", (trackables) => {
        this.setState({trackables: trackables, dialogOpen: true, dialogTitle: "Select a User"});
      });
      WS.createWebSocket();  
    }

    handleDrawerOpen() {
        this.setState({drawOpen: true})
    }

    handleDrawerClose() {
        this.setState({drawOpen: false})
    }

    handleSelectId(userName) {
      this.setState({dialogOpen: false});
      if (this.state.dialogTitle === "Select a User") {
        this.setState({userName: userName});
      } else {
        const reqData = {
          RequestType: 0,
          TrackingRequest: {
            TrackeeName: userName,
            UserName: this.state.userName
          }
        }            
        WS.send(reqData);
    
        this.state.mapTabs.push({
          defaultLocation: {
            center: {
              lat: 35.7351642,
              lng: -78.889743
            },
            zoom: 15
          },
          trackee: userName
        });
        this.setState({mapTabs: this.state.mapTabs}); 
      }
    }
  
    handleTabChange = (event, newValue) => {
      this.setState({tabvalue: newValue});
    }

    handleTracking() {
      this.setState({drawOpen: false, dialogOpen: true, dialogTitle: "Select a Trackee"});
    }

    render() {
        const { classes } = this.props;
        return (
            <div>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton onClick={() => this.handleDrawerOpen()} edge="start" style={{marginRight: 2}} color="inherit" aria-label="menu">
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" style={{flexGrow: 1}}>
                            Location Tracker ({this.state.userName})
                        </Typography>
                        <Button color="inherit" onClick={() => this.setState({dialogOpen: true, dialogTitle: "Select a User"})}>Set User</Button>
                    </Toolbar>
                </AppBar>
                <Drawer
                    className={classes.drawer}
                    anchor="left"
                    open={this.state.drawOpen}
                    onClose={() => this.handleDrawerClose()}
                    classes={{
                    paper: classes.drawerPaper,
                    }}>
                    <List>
                        <ListItem button key="Track" onClick={() => this.handleTracking()}>
                        <ListItemIcon><ExploreIcon/></ListItemIcon>
                        <ListItemText primary="Track" />
                        </ListItem>
                    </List>
                </Drawer>
                <AppBar color="transparent" position="static">
                    <Tabs value={this.state.tabvalue} onChange={this.handleTabChange} aria-label="tracking tabs">
                      {this.state.mapTabs.map((mapTab, index) => (
                        <Tab label={mapTab.trackee} {...a11yProps(index)} />
                      ))}  
                    </Tabs>
                </AppBar>
                {this.state.mapTabs.map((mapTab, index) => (
                  <TrackingMap def={mapTab.defaultLocation} value={this.state.tabvalue} index={index} trackee={mapTab.trackee}/>
                ))}  
                <Snackbar
                  anchorOrigin={ {vertical: 'bottom', horizontal: 'left' }}
                  open={this.state.showAlert}
                  onClose={() => this.setState({showAlert: false})}>
                    <Alert severity="error" onClose={() => { this.setState({showAlert: false}); }}>{this.state.alertMsg}</Alert>
                </Snackbar>
                <Snackbar
                  anchorOrigin={ {vertical: 'bottom', horizontal: 'left' }}
                  open={this.state.showInfo}
                  onClose={() => this.setState({showInfo: false})}
                  autoHideDuration={6000}>
                    <Alert onClose={() => { this.setState({showInfo: false, infoMsg: ""}); }}>{this.state.infoMsg}</Alert>
                </Snackbar>
                <SelectIdDialog title={this.state.dialogTitle} open={this.state.dialogOpen} onClose={(userName)=> this.handleSelectId(userName)} trackables={this.state.trackables}/>
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(TrackApp);
