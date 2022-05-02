import {
    FormGroup,
    FormControlLabel,
    Switch,
    FormControl,
    FormLabel,
    Box,
    Slider,
    Input,
    Grid,
    Typography,
    Button,
    Dialog,
    DialogTitle, 
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import {
    AddBox,
    Add,
    Remove,
    Delete,
    VolumeUp,
    FileDownload
} from '@mui/icons-material';;
import { styled } from '@mui/material/styles';
import { ColorPicker, Color } from 'material-ui-color';

import React from 'react';
import {event} from '../eventHandler'
/*
import lith from '../../../assets/lith.png'
import meso from '../../../assets/meso.png'
import neo from '../../../assets/neo.png'
import axi from '../../../assets/axi.png'
import Repeatable from 'react-repeatable'
import {convertUpper,dynamicSort} from './extras'
*/

import {config} from './config'
import { Event } from 'electron';

export {Settings}

interface ISettingsState {
    update: boolean,
    inv_upths_val: number,
    inv_loths_val: number,
    inv_upths_col: number,
    inv_loths_col: number,
    alertOpen: boolean,
    alertTitle: string,
    alertContent: string
}

interface ISettingsProps {
}

class Settings extends React.Component<ISettingsProps,ISettingsState> {
    constructor(props:any) {
      super(props);
      this.state = {
        update: false,
        inv_upths_val: Object.keys(config).length > 0 ? (config as any).inv_upths_val:0,
        inv_loths_val: Object.keys(config).length > 0 ? (config as any).inv_loths_val:0,
        inv_upths_col: Object.keys(config).length > 0 ? (config as any).inv_upths_col:'transparent',
        inv_loths_col: Object.keys(config).length > 0 ? (config as any).inv_loths_col:'transparent',
        alertOpen: false,
        alertTitle: '',
        alertContent: ''
      };
    }
    
    componentDidMount() {
        event.on('configFetchComplete', (data:any) => {
            this.setState({update: true});
        })
        event.on('importSRBResponse', (arg) => {
            this.setState({alertOpen: true, alertTitle: arg.message.title, alertContent: arg.message.content})
        })
    }

    handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const new_config:any = config
        new_config[e.target.id] = e.target.checked
        event.emit('postConfig', new_config)
    }

    
    handleSliderChange = (id:string, newValue: number | number[]) => {
        console.log(id)
        var stateObject:ISettingsState = this.state
        stateObject[id] = Number(newValue)
        this.setState(stateObject)
        const new_config:any = config
        new_config[id] = stateObject[id]
        event.emit('postConfig', new_config)
    };

    handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        var stateObject:ISettingsState = this.state
        stateObject[e.target.id] = e.target.value === '' ? 0 : Number(e.target.value)
        this.setState(stateObject)
        const new_config:any = config
        new_config[e.target.id] = stateObject[e.target.id];
        event.emit('postConfig', new_config)
    };

    handleBlur = () => {
        if (this.state.inv_upths_val < 0) {
            this.setState({inv_upths_val: 0})
        } else if (this.state.inv_upths_val > 100) {
            this.setState({inv_upths_val: 100})
        }
        if (this.state.inv_loths_val < 0) {
            this.setState({inv_loths_val: 0})
        } else if (this.state.inv_loths_val > 100) {
            this.setState({inv_loths_val: 100})
        }
    };

    handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        var file_paths:any = {relicsDB: '', log_files: []}
        Array.from(e.target.files as FileList).forEach(file => {
            if (file.name.toLowerCase() == 'srbdb.json' && !file.path.toLowerCase().match('backup')) file_paths.relicsDB = file.path
            if (file.name.toLowerCase().match(/_log.json$/)) file_paths.log_files.push(file.path)
        })
        event.emit('importSRBRequest',file_paths)
    }

    alertHandleClose = () => {
        this.setState({alertOpen: false, alertTitle: '', alertContent: ''})
    }

    handleColorChange = (id:string, newValue: Color) => {
        var stateObject:ISettingsState = this.state
        stateObject[id] = `#${newValue.hex}`
        this.setState(stateObject)
        const new_config:any = config
        new_config[id] = `#${newValue.hex}`
        event.emit('postConfig', new_config)
    };


    render() {
        return (
            <Grid container maxHeight={'90vh'} overflow='auto'>
                {this.state.update}
                <Grid item xs={6}>
                    <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
                            <FormGroup>
                                <FormLabel style={{fontSize:"64px"}} component="legend">Inventory</FormLabel>
                                <FormControlLabel
                                    control={<Switch checked={(config as any).showDropsonHover} onChange={this.handleChange} id="showDropsonHover"/>}
                                    label="Show drops on hover"
                                />
                                <FormControl>
                                    <Typography>
                                        Quantity Upper Threshold
                                    </Typography>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={2}>
                                            <ColorPicker defaultValue={(config as any).inv_upths_col} value={this.state.inv_upths_col} hideTextfield onChange={(newValue: Color) => this.handleColorChange('inv_upths_col', newValue)}/>
                                        </Grid>
                                        <Grid item xs={7}>
                                            <Slider
                                            value={this.state.inv_upths_val}
                                            onChange={(event: Event,newValue: number | number[], activeThumb: number) => this.handleSliderChange('inv_upths_val', newValue)}
                                            />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Input
                                            value={this.state.inv_upths_val}
                                            size="small"
                                            onChange={this.handleInputChange}
                                            onBlur={this.handleBlur}
                                            id='inv_upths_val'
                                            inputProps={{
                                                step: 5,
                                                min: 0,
                                                max: 100,
                                                type: 'number',
                                                'aria-labelledby': 'input-slider',
                                            }}
                                            />
                                        </Grid>
                                    </Grid>
                                </FormControl>
                                <FormControl>
                                    <Typography>
                                        Quantity Lower Threshold
                                    </Typography>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={2}>
                                            <ColorPicker defaultValue={(config as any).inv_loths_col} value={this.state.inv_loths_col} hideTextfield onChange={(newValue: Color) => this.handleColorChange('inv_loths_col', newValue)}/>
                                        </Grid>
                                        <Grid item xs={7}>
                                            <Slider
                                            value={this.state.inv_loths_val}
                                            onChange={(event: Event,newValue: number | number[], activeThumb: number) => this.handleSliderChange('inv_loths_val', newValue)}
                                            />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Input
                                            value={this.state.inv_loths_val}
                                            size="small"
                                            onChange={this.handleInputChange}
                                            onBlur={this.handleBlur}
                                            id='inv_loths_val'
                                            inputProps={{
                                                step: 5,
                                                min: 0,
                                                max: 100,
                                                type: 'number',
                                                'aria-labelledby': 'input-slider',
                                            }}
                                            />
                                        </Grid>
                                    </Grid>
                                </FormControl>
                            </FormGroup>
                    </FormControl>
                </Grid>
                <Grid item xs={6}>
                    <label htmlFor="srb-dir">
                        <Input style={{display: 'none'}} id="srb-dir" type="file" inputProps={{accept: ".txt", multiple: true, webkitdirectory:""}} onChange={this.handleFileChange}/>
                        <Button variant="contained" startIcon={<FileDownload />} component="span">
                            Import SRB Folder
                        </Button>
                    </label>
                </Grid>
                <Dialog open={this.state.alertOpen} onClose={this.alertHandleClose}>
                    <DialogTitle>
                    {this.state.alertTitle}
                    </DialogTitle>
                    <DialogContent>
                    <DialogContentText>
                        {this.state.alertContent}
                    </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.alertHandleClose}>Ok</Button>
                    </DialogActions>
                </Dialog>
            </Grid>
        )
    }
}