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
    IconButton,
    Table,TableBody,TableCell,TableContainer,TableHead,TableRow,
    Tooltip,
    Select,SelectChangeEvent,MenuItem
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
import {convertUpper,dynamicSort,dynamicSortDesc} from './extras'

import {config} from './config'
import { Event } from 'electron';

interface relicProps {
    name: string,
    quantity: number,
    opened: number,
    display: boolean,
    wtb: boolean,
    buy_price: number,
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
    tradeHotkeyModifier: string,
    tradeHotkey: string,
    enableHotkey: boolean,
    hotkeyRandomizer: boolean,
    hotkeySequential: boolean,
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
        tradeHotkeyModifier: 'ctrl',
        tradeHotkey: 'num8',
        enableHotkey: true,
        hotkeyRandomizer: true,
        hotkeySequential: false,
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
            this.setState({
                tradeHotkeyModifier: (config as any).tradeHotkeyModifier, 
                tradeHotkey: (config as any).tradeHotkey,
                enableHotkey: (config as any).enableHotkey,
                hotkeyRandomizer: (config as any).hotkeyRandomizer,
                hotkeySequential: (config as any).hotkeySequential,
            });
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
        let temp1 = Array.from(relicDB)
        temp1.sort(dynamicSortDesc('buy_price'))
        var all_pastas: Array<string> = []
        var startText = (this.state.tradingStartText + ' WTB ').trim()
        var pasta = startText + ' ';
        var priceText = `${temp1[0]?.buy_price}p ea`;
        var endText = this.state.tradingEndText.trim();
        var relicStr = ''
        temp1.forEach((relic, index:number) => {
            if (!relic.display) return
            if (!relic.wtb) return
            relicStr = `[${relic.name} relic]`
            if ((index == 0) || ((pasta + relicStr + priceText + endText).length <= 120) && (temp1[index-1].buy_price == relic.buy_price)) pasta += relicStr
            else {
                pasta += ' ' + priceText
                if (temp1[index-1]?.buy_price != relic.buy_price)
                    priceText = `${relic.buy_price}p ea`
                if ((pasta + relicStr + priceText + endText).length > 120) {
                    all_pastas.push(pasta)
                    pasta = startText + ' ' + relicStr
                } 
                else
                    pasta += ' ' + relicStr
            }
        })
        all_pastas.push(pasta + ' ' + priceText + endText)
        this.setState({textTrading: all_pastas.join('\n')})
        event.emit('postPastas', all_pastas)
    }

    hostsCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        showTiers[e.target.id as keyof IshowTiers] = e.target.checked
        this.computeTexts()
    }

    hotkeyCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.id == 'enableHotkey') {
            this.setState({enableHotkey: e.target.checked}, () => {
                (config as any).enableHotkey = this.state.enableHotkey;
                event.emit('postConfig', config)
            })
        }
        if (e.target.id == 'hotkeyRandomizer') {
            this.setState({hotkeyRandomizer: e.target.checked,hotkeySequential: !e.target.checked}, () => {
                (config as any).hotkeyRandomizer = this.state.hotkeyRandomizer;
                (config as any).hotkeySequential = this.state.hotkeySequential;
                event.emit('postConfig', config)
            })
        }
        if (e.target.id == 'hotkeySequential') {
            this.setState({hotkeySequential: e.target.checked,hotkeyRandomizer: !e.target.checked}, () => {
                (config as any).hotkeySequential = this.state.hotkeySequential;
                (config as any).hotkeyRandomizer = this.state.hotkeyRandomizer;
                event.emit('postConfig', config)
            })
        }
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

    handleHotkeyChange = (e: SelectChangeEvent) => {
        if (e.target.name == 'selectTradeHotkeyModifier') {
            this.setState({tradeHotkeyModifier: e.target.value}, () => {
                (config as any).tradeHotkeyModifier = this.state.tradeHotkeyModifier;
                event.emit('postConfig', config)
            })
        }
        if (e.target.name == 'selectTradeHotkey') {
            this.setState({tradeHotkey: e.target.value}, () => {
                (config as any).tradeHotkey = this.state.tradeHotkey;
                event.emit('postConfig', config)
            })
        }
    }
  
    closeShowCustomHosts = () => {
        this.setState({openShowCustomHosts: false})
    };

    render() {
        const hotkeysModifiers = ['None','ctrl','alt','shift']
        const hotkeys = ['num1','num2','num3','num4','num5','num6','num7','num8','num9','num0','1','2','3','4','5','6','7','8','9','0',"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]
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
                            <Typography style={{fontSize: '36px'}}>Trading</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <TextareaAutosize minRows={10} maxRows={10} value={this.state.textTrading} style={{color:'white',backgroundColor:'#171717',resize:'none', width:'100%'}} readOnly/>
                        </Grid>
                        <div style={{display: 'flex',alignItems: 'center'}}>
                            <Typography>Hotkey:</Typography>
                            <Select
                                value={this.state.tradeHotkeyModifier}
                                name = 'selectTradeHotkeyModifier'
                                onChange={this.handleHotkeyChange}
                                size = 'small'
                                style={{marginLeft: '10px'}}
                            >
                                {hotkeysModifiers.map(hotkey => {
                                    return <MenuItem value={hotkey}>{hotkey}</MenuItem>
                                })}
                            </Select>
                            <Typography style={{marginLeft: '10px'}}>+</Typography>
                            <Select
                                value={this.state.tradeHotkey}
                                name = 'selectTradeHotkey'
                                onChange={this.handleHotkeyChange}
                                size = 'small'
                                style={{marginLeft: '10px'}}
                            >
                                {hotkeys.map(hotkey => {
                                    return <MenuItem value={hotkey}>{hotkey}</MenuItem>
                                })}
                            </Select>
                        </div>    
                        <Grid item xs={12}>
                            <FormControlLabel style={{marginLeft: '20px'}} control={<Checkbox onChange={this.hotkeyCheckboxChange} checked={this.state.enableHotkey} id='enableHotkey'/>} label="Enable Hotkey" />
                            <FormControlLabel control={<Checkbox onChange={this.hotkeyCheckboxChange} checked={this.state.hotkeyRandomizer} id='hotkeyRandomizer'/>} label="Randomized" />
                            <FormControlLabel control={<Checkbox onChange={this.hotkeyCheckboxChange} checked={this.state.hotkeySequential} id="hotkeySequential"/>} label="Sequential" />
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