import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import ListSubheader from '@material-ui/core/ListSubheader';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import SendIcon from '@material-ui/icons/Send';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import TextField from '@material-ui/core/TextField';
import Fab from '@material-ui/core/Fab';
import KeyboardVoiceIcon from '@material-ui/icons/KeyboardVoice';
import Divider from '@material-ui/core/Divider';
import { speechRecognition } from "../../src/util/speech_recognition";
import SpeechRecognitionSettings from "./settings/speech_recognition_setting";
const speechRecognitionController = new speechRecognition();
const styles = theme => ({
    root: {
        width: '100%',
        maxWidth: 700,
        backgroundColor: theme.palette.background.paper,
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing.unit * 2,
        right: theme.spacing.unit * 2,
    },
    nested: {
        paddingLeft: theme.spacing.unit * 4,
    },
});

class Home extends React.Component {
    state = {
        open: true,
    };
    componentDidMount() {
        speechRecognitionController.addCommand({'*text': (text) => {
                const appendText = " " + text;
                document.getElementById("speech_recognition_input_textarea").value+= appendText ;
                speechRecognitionController.sendTextToDom(text);
            }
        });
        speechRecognitionController.start();
    }

    handleClick = () => {
        this.setState(state => ({ open: !state.open }));
    };

    render() {
        const { classes } = this.props;

        return (
            <div>
                <List
                    component="nav"
                    subheader={<ListSubheader component="div">Speech Regconiton and Gesture Control settings</ListSubheader>}
                    className={classes.root}
                >
                    <ListItem button onClick={this.handleClick}>
                        <ListItemIcon>
                            <KeyboardVoiceIcon />
                        </ListItemIcon>
                        <ListItemText inset primary="Speech Reconition Settings" />
                        {this.state.open ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={this.state.open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            <ListItem button className={classes.nested}>
                                <TextField
                                    id="speech_recognition_input_textarea"
                                    label="Speech Text"
                                    placeholder="recognised text"
                                    helperText="recognised text"
                                    multiline
                                    rows="5"
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </ListItem>
                            <Divider/>
                            <ListItem button className={classes.nested}>
                                <SpeechRecognitionSettings/>
                            </ListItem>
                        </List>
                    </Collapse>
                    <ListItem button>
                        <ListItemIcon>
                            <SendIcon />
                        </ListItemIcon>
                        <ListItemText inset primary="Gesture Control Settings" />
                    </ListItem>
                </List>
                <Fab className={classes.fab} color="#222222">
                    <KeyboardVoiceIcon/>
                </Fab>
            </div>
        );
    }
}
Home.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Home);