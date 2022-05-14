import {
    FormGroup,
    FormControlLabel,
    Switch,
    FormControl,
    FormLabel,
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
    Checkbox
} from '@mui/material';
import {
    FileDownload
} from '@mui/icons-material';;
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


interface ISettingsProps {
}
interface ISettingsState {
    showDropsonHover: boolean,
    startUpOnBoot: boolean,
    inv_upths_val: number,
    inv_loths_val: number,
    inv_upths_col: string,
    inv_loths_col: string,
    alertOpen: boolean,
    alertTitle: string,
    alertContent: string
}

var postConfigTimer:ReturnType<typeof setTimeout>;

class Settings extends React.Component<ISettingsProps,ISettingsState> {
    constructor(props:any) {
      super(props);
      this.state = {
        showDropsonHover: false,
        startUpOnBoot: false,
        inv_upths_val: 0,
        inv_loths_val: 0,
        inv_upths_col: 'transparent',
        inv_loths_col: 'transparent',
        alertOpen: false,
        alertTitle: '',
        alertContent: ''
      };
    }
    
    componentDidMount() {
        event.on('configFetchComplete', (data:any) => {
            this.setState({
                showDropsonHover: (config as any).showDropsonHover,
                inv_upths_val: (config as any).inv_upths_val, 
                inv_loths_val: (config as any).inv_loths_val,
                inv_upths_col: (config as any).inv_upths_col,
                inv_loths_col: (config as any).inv_loths_col,
                startUpOnBoot: (config as any).startUpOnBoot
            })
        })
        event.on('importSRBResponse', (arg) => {
            this.setState({alertOpen: true, alertTitle: arg.message.title, alertContent: arg.message.content})
        })
        event.on('importGDPRResponse', (arg) => {
            this.setState({alertOpen: true, alertTitle: arg.message.title, alertContent: arg.message.content})
        })
    }

    componentDidUpdate() {
        console.log('*************updating settings*******************')
    }
    
    handleSliderChange = (id:string, newValue: number | number[]) => {
        console.log(id)
        var stateObject:ISettingsState = this.state
        stateObject[id] = Number(newValue)
        this.setState(stateObject)
        const new_config:any = config
        new_config[id] = stateObject[id]
        clearTimeout(postConfigTimer)
        postConfigTimer = setTimeout(() => event.emit('postConfig', new_config), 1000)
    };

    handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        var stateObject:ISettingsState = this.state
        stateObject[e.target.id] = e.target.value === '' ? 0 : Number(e.target.value)
        this.setState(stateObject)
        const new_config:any = config
        new_config[e.target.id] = stateObject[e.target.id];
        clearTimeout(postConfigTimer)
        postConfigTimer = setTimeout(() => event.emit('postConfig', new_config), 1000)
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

    handleFileChangeSRB = (e: React.ChangeEvent<HTMLInputElement>) => {
        var file_paths:any = {relicsDB: '', log_files: []}
        Array.from(e.target.files as FileList).forEach(file => {
            if (file.name.toLowerCase() == 'srbdb.json' && !file.path.toLowerCase().match('backup')) file_paths.relicsDB = file.path
            if (file.name.toLowerCase().match(/_log.json$/)) file_paths.log_files.push(file.path)
        })
        event.emit('importSRBRequest',file_paths)
    }

    handleFileChangeGDPR = (e: React.ChangeEvent<HTMLInputElement>) => {
        var file_paths:Array<string> = []
        Array.from(e.target.files as FileList).forEach(file => {
            if (file.type != 'text/plain') {
                this.setState({alertOpen: true, alertTitle: 'IMPORT GDPR', alertContent: 'Please only select .txt file(s)'})
                return
            } else file_paths.push(file.path)
        })
        event.emit('importGDPRRequest',file_paths)
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
        clearTimeout(postConfigTimer)
        postConfigTimer = setTimeout(() => event.emit('postConfig', new_config), 1000)
    };

    handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const new_config:any = config
        new_config[e.target.id] = e.target.checked
        clearTimeout(postConfigTimer)
        postConfigTimer = setTimeout(() => event.emit('postConfig', new_config), 200)
        if (e.target.id == 'startUpOnBoot') event.emit('toggleStartUp', e.target.checked)
        var stateObject:ISettingsState = this.state
        stateObject[e.target.id] = e.target.checked
        this.setState(stateObject)
    }

    render() {
        return (<React.Fragment>
            <Grid container maxHeight={'90vh'} overflow='auto'>
                <Grid item xs={6}>
                    <Grid container>
                        <Grid item xs={12}>
                            <Typography style={{fontSize: '36px'}}>Inventory</Typography>
                        </Grid>
                        <Grid item xs={12} style={{paddingLeft: '8px'}}>
                            <FormControlLabel
                                control={<Switch checked={this.state.showDropsonHover} onChange={this.handleSwitchChange} id="showDropsonHover"/>}
                                label="Show drops on hover"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl>
                                <Typography>Quantity Upper Threshold</Typography>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={3}>
                                        <ColorPicker value={this.state.inv_upths_col} hideTextfield onChange={(newValue: Color) => this.handleColorChange('inv_upths_col', newValue)}/>
                                    </Grid>
                                    <Grid item xs={6} style={{marginTop: '5px'}}>
                                        <Slider
                                        value={this.state.inv_upths_val}
                                        onChange={(event: Event,newValue: number | number[]) => this.handleSliderChange('inv_upths_val', newValue)}
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
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl>
                                <Typography>Quantity Lower Threshold</Typography>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={3}>
                                        <ColorPicker value={this.state.inv_loths_col} hideTextfield onChange={(newValue: Color) => this.handleColorChange('inv_loths_col', newValue)}/>
                                    </Grid>
                                    <Grid item xs={6} style={{marginTop: '5px'}}>
                                        <Slider
                                        value={this.state.inv_loths_val}
                                        onChange={(event: Event,newValue: number | number[]) => this.handleSliderChange('inv_loths_val', newValue)}
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
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={6}>
                    <Grid container rowSpacing={1}>
                        <Grid item xs={12}>
                            <Typography style={{fontSize: '36px'}}>General</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={<Switch checked={this.state.startUpOnBoot} onChange={this.handleSwitchChange} id="startUpOnBoot"/>}
                                label="Start with Windows"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <label htmlFor="srb-dir">
                                <Input style={{display: 'none'}} id="srb-dir" type="file" inputProps={{accept: ".txt", multiple: true, webkitdirectory:""}} onChange={this.handleFileChangeSRB}/>
                                <Button variant="contained" startIcon={<FileDownload />} component="span">
                                    Import SRB Folder
                                </Button>
                            </label>
                        </Grid>
                        <Grid item xs={12}>
                            <label htmlFor="gdpr-file">
                                <Input style={{display: 'none'}} id="gdpr-file" type="file" inputProps={{accept: ".txt", multiple: true}} onChange={this.handleFileChangeGDPR}/>
                                <Button variant="contained" startIcon={<FileDownload />} component="span">
                                    Import GDPR
                                </Button>
                            </label>
                        </Grid>
                    </Grid>
                </Grid>
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
        </React.Fragment>
        )
    }
}

export default React.memo(Settings)