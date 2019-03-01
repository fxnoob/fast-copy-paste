import React from 'react';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Switch from '@material-ui/core/Switch';
import Fab from '@material-ui/core/Fab';
import NavigationIcon from '@material-ui/icons/Navigation';

import MessageLib from "../../src/util/message";
import {Pages as PageLib} from "../../src/util/pages";

const page = new PageLib();
class Settings extends React.Component {
    state = {
        isExtAllowed: true ,
        timeStamp: +new Date ,
        data: "" ,
        isOverridable: false
    };
    componentDidMount() {
        const message = new MessageLib();
        message.getData()
            .then(res => {
                this.setState(res);
            });
    }
    handleChange = name => event => {
        this.setState({ [name]: event.target.checked });
    };
    openOptionPage() {
        page.openPage("option.html");
    }
    render() {
        return (
            <FormControl component="fieldset">
                <FormLabel component="legend">Basic Settings</FormLabel>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={this.state.isExtAllowed}
                                onChange={this.handleChange('gilad')}
                                value="gilad"
                            />
                        }
                        label="Enable/Disable Extension"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={this.state.isOverridable}
                                onChange={this.handleChange('jason')}
                                value="Override text"
                            />
                        }
                        label="Override text"
                    />
                    <FormControlLabel
                        control={
                            <Fab variant="extended" aria-label="Delete" onClick={this.openOptionPage}>
                                <NavigationIcon />
                                Speech Recognition
                            </Fab>
                        }
                        label=""
                    />
                </FormGroup>
            </FormControl>
        );
    }
}

export default Settings;