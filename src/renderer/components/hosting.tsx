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
    Checkbox,
    TextField,
    TextareaAutosize,
    CssBaseline,
    Paper,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip
} from '@mui/material';
import {
    Delete,
    Settings,
    Info
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
*/
import {convertUpper,dynamicSort} from './extras'

import {config} from './config'
import { Event } from 'electron';

interface relicProps {
    name: string,
    quantity: number,
    opened: number,
    display: boolean,
    refinement: {cycle: string, refinement: string}
}
var relicDB:Array<relicProps> = []

interface IshowTiers {
    lith: boolean,
    meso: boolean,
    neo: boolean,
    axi: boolean,
}
var showTiers:IshowTiers = {lith:true,meso:true,neo:true,axi:true}

interface IHostingProps {
}
interface IHostingState {
    update: boolean,
    textCopyHosts: string,
    hostsCustomText: string,
    hostsQuantityThreshold: number,
    hostsCycleCount: number,
    openShowCustomHosts: boolean,
    alertOpen: boolean,
    alertTitle: string,
    alertContent: string,
    buttonCopyText: string,
    textTrading: string,
    buttonCopyTextTrading: string,
    tradingStartText: string,
    tradingEndText: string,
}

class Hosting extends React.Component<IHostingProps,IHostingState> {
    constructor(props:any) {
      super(props);
      this.state = {
        update: false,
        textCopyHosts: '',
        hostsCustomText: '',
        hostsQuantityThreshold: 10,
        hostsCycleCount: 0,
        openShowCustomHosts: false,
        alertOpen: false,
        alertTitle: '',
        alertContent: '',
        buttonCopyText: '',
        textTrading: '',
        buttonCopyTextTrading: '',
        tradingStartText: '',
        tradingEndText: '',
      };
    }
    
    componentDidMount() {
        this.computeTexts()
        this.computeTextTrading()
        event.on('relicDBFetch', (data) => {
            relicDB = []
            this.setState({update: !this.state.update}, () => {
                relicDB = typeof data == 'object' ? data:JSON.parse(data as string)
                this.computeTexts()
                this.computeTextTrading()
            });
        });
        event.on('configFetchComplete', (data:any) => {
            this.setState({update: !this.state.update});
        })
    }

    componentDidUpdate() {
        // NOTE THIS WILL BE LOGGED TWICE BECAUSE OF ARRAY STATE OF RELICSDB
        console.log('*************updating hosting*******************')
    }

    computeTexts = () => {
        var temp1:Array<string> = [];
        var hosted: Array<string> = [];
        (config as any).customHosts?.map((host:any,i:number) => {
            if (showTiers[host.tier.toLowerCase() as keyof IshowTiers]) {
                var mainStatus = false
                var offcycleStatus = false
                var doHost = false
                host.mainRelics.forEach((hostRelic:string) => {
                    // get inventory quantity
                    for (const relic of relicDB) {
                        if (relic.name.toLowerCase() == `${host.tier} ${hostRelic}`.toLowerCase()) {
                            if (relic.quantity >= this.state.hostsQuantityThreshold) {
                                mainStatus = true   // atleast one main relic is more than threshold
                                break
                            }
                        }
                    }
                    //if (doHost) 
                })
                host.offcycleRelics.forEach((hostRelic:string) => {
                    // get inventory quantity
                    for (const relic of relicDB) {
                        if (relic.name.toLowerCase() == `${host.tier} ${hostRelic}`.toLowerCase()) {
                            if (relic.quantity >= this.state.hostsQuantityThreshold) {
                                offcycleStatus = true  // atleast one offcycle relic is more than threshold
                                break
                            }
                        }
                    }
                    //if (doHost) hosted.push(`${host.tier} ${hostRelic}`.toLowerCase())
                })
                if ((mainStatus && host.offcycleRelics.length == 0) || (mainStatus && offcycleStatus)) doHost = true;
                if (doHost) {
                    temp1.push(`${host.tier} ${host.mainRelics.join(' ')} ${host.mainCycle} ${host.mainRefinement} ${host.offcycleRefinement == '' ? '':`with ${host.offcycleRelics.join(' ')} ${host.offcycleRefinement} offcycle`} ${this.state.hostsCycleCount > 0 ? `${this.state.hostsCycleCount}+ cycles`:''}`.trim())
                    host.mainRelics.forEach((hostRelic:string) => hosted.push(`${host.tier} ${hostRelic}`.toLowerCase()))
                    host.offcycleRelics.forEach((hostRelic:string) => hosted.push(`${host.tier} ${hostRelic}`.toLowerCase()))
                }
            }
        });
        relicDB.map((relic,i) => {
            if (showTiers[(relic.name.split(' '))[0].toLowerCase() as keyof IshowTiers])
                if (relic.display && !hosted.includes(relic.name.toLowerCase()))
                    if (relic.quantity >= this.state.hostsQuantityThreshold)
                        temp1.push(`${relic.name} ${relic.refinement.cycle} ${relic.refinement.refinement} ${this.state.hostsCycleCount > 0 ? `${this.state.hostsCycleCount}+ cycles`:''}`.trim())
        });
        this.setState({textCopyHosts: temp1.sort().join('\n')})
    }

    computeTextTrading = () => {
        var all_pastas: Array<string> = []
        var startText = (this.state.tradingStartText + ' WTB ').trim()
        var endText = ('5p ea ' + this.state.tradingEndText).trim()
        var temp = startText + ' '
        relicDB.forEach((relic, index:number) => {
            var relicStr = `[${relic.name} relic]`
            if ((temp + relicStr + endText).length <= 120) temp += relicStr
            else {
                temp += ' ' + endText
                all_pastas.push(temp)
                temp = startText + ' ' + relicStr
            }
        })
        all_pastas.push(temp + ' ' + endText)
        //all_pastas.forEach((pasta) => console.log(pasta.length))
        this.setState({textTrading: all_pastas.join('\n')})
        event.emit('postPastas', all_pastas)
    }

    hostsCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        showTiers[event.target.id as keyof IshowTiers] = event.target.checked
        this.computeTexts()
    }

    handleHostsCustomKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            var tier:string = ''
            var mainRelics:Array<string> = [];
            var mainCycle = '';
            var mainRefinement = '';
            var offcycleRelics:Array<string> = [];
            var offcycleRefinement = '';
            var mainStr:string = this.state.hostsCustomText.toLowerCase().replaceAll('intact','int').replaceAll('exceptional','exc').replaceAll('flawless','flaw').replaceAll('radiant','rad')
            var arr:Array<string> = mainStr.split(' ');
            for (const str of arr) {
                if (str == 'lith' || str == 'meso' || str == 'neo' || str == 'axi') {
                    tier = convertUpper(str);
                    break;
                }
            }
            if (tier == '') {
                this.setState({hostsCustomText: '', alertOpen: true, alertTitle: 'Error adding custom host', alertContent: 'Could not identify relic tier.\r\nExample: lith v2 v8 rad 2b2 with v1 flaw offcycle'})
                return
            }
            mainStr = mainStr.replaceAll('lith','').replaceAll('meso','').replaceAll('neo','').replaceAll('axi','');
            var arr:Array<string> = mainStr.split(' ');
            var pushOffcycle = false;
            for (const str of arr) {
                if (Number(str[1]) && (str.length == 2 || str.length == 3)) {
                    if (pushOffcycle) offcycleRelics.push(str)
                    else mainRelics.push(str.toUpperCase())
                }
                if (str == 'with') pushOffcycle = true;
                if (str == '1b1' || str == '2b2' || str == '3b3' || str == '4b4') mainCycle = str
                if (str == 'int' || str == 'exc' || str == 'flaw' || str == 'rad') {
                    if (pushOffcycle) offcycleRefinement = str
                    else mainRefinement = str
                }
            }
            if (mainCycle == '') {
                this.setState({hostsCustomText: '', alertOpen: true, alertTitle: 'Error adding custom host', alertContent: 'Could not identify host cycle.\r\nExample: lith v2 v8 rad 2b2 with v1 flaw offcycle'})
                return
            }
            if (mainRefinement == '') {
                this.setState({hostsCustomText: '', alertOpen: true, alertTitle: 'Error adding custom host', alertContent: 'Could not identify host refinement.\r\nExample: lith v2 v8 rad 2b2 with v1 flaw offcycle'})
                return
            }
            if ((offcycleRelics.length > 0) && offcycleRefinement == '') {
                this.setState({hostsCustomText: '', alertOpen: true, alertTitle: 'Error adding custom host', alertContent: 'Could not identify offcycle refinement.\r\nExample: lith v2 v8 rad 2b2 with v1 flaw offcycle'})
                return
            }
            (config as any).customHosts.push({tier: tier, mainRelics: mainRelics.sort(), mainCycle: mainCycle, mainRefinement: mainRefinement, offcycleRelics: offcycleRelics.sort(), offcycleRefinement: offcycleRefinement})
            event.emit('postConfig', config)
            this.computeTexts()
            this.setState({hostsCustomText: ''})
        }
    }
  
    closeShowCustomHosts = () => {
        this.setState({openShowCustomHosts: false})
    };

    render() {
        return (<React.Fragment>
            <Grid container maxHeight={'90vh'} overflow='auto'>
                <CssBaseline />
                <Grid container columnSpacing={2} rowSpacing={2} justifyContent="left" alignItems="left" minWidth='500px'>
                    <Grid item xs={12}>
                        <Grid item xs={12}>
                            <div style={{display: 'flex',alignItems: 'center'}}>
                                <Typography style={{fontSize: '36px'}}>Hosts</Typography>
                                <Tooltip title={this.state.buttonCopyText} open={this.state.buttonCopyText == ''? false:true} placement='right'>
                                    <Button 
                                    variant="outlined" 
                                    onClick={() => {
                                        navigator.clipboard.writeText(this.state.textCopyHosts);
                                        this.setState({buttonCopyText: 'Copied!'}, () => setTimeout(() => this.setState({buttonCopyText: ''}), 3000))
                                    }} 
                                    style={{marginLeft: '20px'}} size='small'>Copy</Button>
                                </Tooltip>
                            </div>
                        </Grid>
                        <div style={{display: 'flex',alignItems: 'center'}}>
                            <Typography>Quantity Threshold:</Typography>
                            <Input
                                value={this.state.hostsQuantityThreshold}
                                size="small"
                                onChange={(e) => this.setState({hostsQuantityThreshold: e.target.value === '' ? 0:Number(e.target.value)}, () => this.computeTexts())}
                                inputProps={{
                                    step: 1,
                                    min: 0,
                                    max: 100,
                                    type: 'number',
                                }}
                                style= {{
                                    width: '50px',
                                    marginLeft: '20px'
                                }}
                            />
                        </div>
                        <div style={{display: 'flex',alignItems: 'center'}}>
                            <Typography style={{paddingLeft: '52px'}}>Cycle count:</Typography>
                            <Input
                                value={this.state.hostsCycleCount}
                                size="small"
                                onChange={(e) => this.setState({hostsCycleCount: e.target.value === '' ? 0:Number(e.target.value)}, () => this.computeTexts())}
                                inputProps={{
                                    step: 1,
                                    min: 0,
                                    max: 100,
                                    type: 'number',
                                }}
                                style= {{
                                    width: '50px',
                                    marginLeft: '20px'
                                }}
                            />
                        </div>
                                        
                        <Grid item xs={12}>
                            <FormControlLabel control={<Checkbox defaultChecked onChange={this.hostsCheckboxChange} id="lith"/>} label="Lith" />
                            <FormControlLabel control={<Checkbox defaultChecked onChange={this.hostsCheckboxChange} id="meso"/>} label="Meso" />
                            <FormControlLabel control={<Checkbox defaultChecked onChange={this.hostsCheckboxChange} id="neo"/>} label="Neo" />
                            <FormControlLabel control={<Checkbox defaultChecked onChange={this.hostsCheckboxChange} id="axi"/>} label="Axi" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextareaAutosize minRows={10} maxRows={10} value={this.state.textCopyHosts} style={{color:'white',backgroundColor:'#171717',resize:'none',width:'50%'}} readOnly/>
                        </Grid>
                        <div style={{display: 'flex',alignItems: 'center'}}>
                            <Typography>Custom Hosts</Typography>
                            <Tooltip title='This will override default hosts from Inventory' placement='right'>
                                <IconButton style={{marginLeft: '5px'}}><Info /></IconButton>
                            </Tooltip>
                        </div>
                        <div style={{display: 'flex',alignItems: 'center'}}>
                            <Input placeholder="<relic> <refinement>" value={this.state.hostsCustomText} style={{width:'270px',backgroundColor:'#171717'}} onChange={(e) => this.setState({hostsCustomText: e.target.value})} onKeyUp={this.handleHostsCustomKeyUp}/>
                            <IconButton onClick={() => this.setState({openShowCustomHosts: true})} style={{boxShadow:"none", marginLeft: '5px'}}><Settings /></IconButton>
                        </div>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid item xs={12}>
                            <div style={{display: 'flex',alignItems: 'center'}}>
                                <Typography style={{fontSize: '36px'}}>Trading</Typography>
                                <Tooltip title={this.state.buttonCopyTextTrading} open={this.state.buttonCopyTextTrading == ''? false:true} placement='right'>
                                    <Button 
                                    variant="outlined" 
                                    onClick={() => {
                                        navigator.clipboard.writeText(this.state.textTrading);
                                        this.setState({buttonCopyTextTrading: 'Copied!'}, () => setTimeout(() => this.setState({buttonCopyTextTrading: ''}), 3000))
                                    }} 
                                    style={{marginLeft: '20px'}} size='small'>Copy</Button>
                                </Tooltip>
                            </div>
                        </Grid>
                        <Grid item xs={12}>
                            <TextareaAutosize minRows={10} maxRows={10} value={this.state.textTrading} style={{color:'white',backgroundColor:'#171717',resize:'none', width:'100%'}} readOnly/>
                        </Grid>
                    </Grid>
                </Grid>
                <Dialog open={this.state.openShowCustomHosts} onClose={this.closeShowCustomHosts} fullWidth={true} maxWidth={"sm"}>
                    <DialogTitle>Custom Hosts</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={1} justifyContent="center" alignItems="center">
                            <TableContainer sx={{ maxHeight: '100%', maxWidth: '100%' }}>
                                <Table>
                                    <TableHead>
                                    <TableRow>
                                        <TableCell>Host</TableCell>
                                        <TableCell align="right">Options</TableCell>
                                    </TableRow>
                                    </TableHead>
                                    <TableBody>
                                    {(config as any).customHosts?.map((host:any,index:number) => (
                                        <TableRow
                                        key={'custom_host_' + index}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                        <TableCell component="th" scope="row">
                                            {`${host.tier} ${host.mainRelics.join(' ')} ${host.mainCycle} ${host.mainRefinement} ${host.offcycleRefinement == '' ? '':`with ${host.offcycleRelics.join(' ')} ${host.offcycleRefinement} offcycle`}`}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton color='error' onClick={() => {(config as any).customHosts.splice(index,1);event.emit('postConfig', config);this.computeTexts()}} style={{boxShadow:"none", marginLeft: '5px'}}><Delete /></IconButton>
                                        </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.closeShowCustomHosts}>Close</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={this.state.alertOpen} onClose={() => this.setState({alertOpen: false, alertTitle: '', alertContent: ''})} fullWidth={true} maxWidth={"sm"}>
                    <DialogTitle>{this.state.alertTitle}</DialogTitle>
                    <DialogContent>
                        {this.state.alertContent}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => this.setState({alertOpen: false, alertTitle: '', alertContent: ''})}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Grid>
        </React.Fragment>
        )
    }
}

export default React.memo(Hosting)