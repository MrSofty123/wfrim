import {
    Button, 
    IconButton,
    ButtonGroup,
    Dialog,
    DialogTitle, 
    DialogContent,
    DialogContentText,
    Alert,
    FormControlLabel,
    Checkbox,
    TextField,
    DialogActions,
    Box,
    Card,
    CardContent,
    CardActionArea,
    Typography,
    Avatar,
    Grid,
    Tooltip,
    CssBaseline,
    Select,
    MenuItem,
    FormControl,
    Input
} from '@mui/material';
import {
    AddBox,
    Add,
    Remove,
    Delete,
    Settings
} from '@mui/icons-material';
import React from 'react';
import {event} from '../eventHandler'
import lith from '../../../assets/lith.png'
import meso from '../../../assets/meso.png'
import neo from '../../../assets/neo.png'
import axi from '../../../assets/axi.png'
import Repeatable from 'react-repeatable'
import {convertUpper,dynamicSort} from './extras'
import {config} from './config'

interface relicProps {
    name: string,
    quantity: number,
    opened: number,
    display: boolean,
    wtb: boolean,
    wth: boolean,
    buy_price: number,
    refinement: {cycle: string, refinement: string}
}
var relicDB:Array<relicProps> = []
interface Iitems_list {
    [key: string]: {
        item_url: string,
        sell_price: string,
        rewards: {
            common: Array<string>,
            uncommon: Array<string>,
            rare: Array<string>,
        },
        relics: Array<{link: string, name: string}>,
        tags: Array<string>,
    }
}
var items_list:Iitems_list = {}

interface IshowTiers {
    lith: boolean,
    meso: boolean,
    neo: boolean,
    axi: boolean,
}

var showTiers:IshowTiers = {lith:true,meso:true,neo:true,axi:true}

interface IInventoryProps {
}
interface IInventoryState {
    updateCards: boolean,
    searchRelic: Array<string>,
}

class Inventory extends React.Component<IInventoryProps,IInventoryState> {
    constructor(props:any) {
      super(props);
      this.state = {
        updateCards: false,
        searchRelic: []
      };
    }
    
    componentDidMount() {
        event.on('relicDBFetch', (data) => {
            relicDB = []
            this.setState({updateCards: !this.state.updateCards}, () => {
                relicDB = typeof data == 'object' ? data:JSON.parse(data as string)
                this.setState({updateCards: !this.state.updateCards})
            });
        });
        event.on('itemsListFetch', (data) => {
            // convert into keys for faster access
            data.forEach((item:any) => {
                items_list[item.item_url as keyof Iitems_list] = item
            })
            this.setState({updateCards: !this.state.updateCards});
        })
        event.on('configFetchComplete', (data:any) => {
            this.setState({updateCards: !this.state.updateCards});
        })
    }

    componentDidUpdate() {
        // NOTE THIS WILL BE LOGGED TWICE BECAUSE OF ARRAY STATE OF RELICSDB
        console.log('*************updating inventory*******************')
    }

    childCallback = (option:string, arg:any) => {
        if (option=="updateCards") this.setState({updateCards: !this.state.updateCards});
        if (option=="searchRelic") this.setState({searchRelic: arg});
    }

    render() {
        return (
            <Grid container spacing={4}>
                <CssBaseline/>
                <Grid item xs={12}>
                    <AddRelic childCallback={this.childCallback} searchRelic={this.state.searchRelic}/>
                </Grid>
                <Grid item xs={12}>
                    <Grid container spacing={1} key="relicsGrid">
                        {this.state.updateCards}
                        {relicDB.map((relic:relicProps, i:number) => {
                            //console.log('Creating card ' + relic.name)
                            if (showTiers[(relic.name.split(' '))[0].toLowerCase() as keyof IshowTiers]) {
                                if (relic.display || !relic.hasOwnProperty("display"))
                                    if (this.state.searchRelic.length == 0 || this.state.searchRelic.includes(relic.name))
                                        return <Grid item key={`card${relic.name.replace(/ /g,'_')}`}>
                                                    <RelicCard name={relic.name} quantity={relic.quantity} opened={relic.opened} refinement={relic.refinement} wtb={relic.wtb} wth={relic.wth} buy_price={relic.buy_price} childCallback={this.childCallback}/>
                                                </Grid>
                            }
                        })}
                    </Grid>
                </Grid>
            </Grid>
        )
    }
}

interface IRelicCardProps {
    name: string,
    quantity: number,
    opened: number,
    wtb: boolean,
    wth: boolean,
    buy_price: number,
    refinement: {cycle: string, refinement: string},
    childCallback: Function,
}
interface IRelicCardState {
    name: string,
    quantity: number,
    opened: number,
    refinement: {cycle: string, refinement: string},
    childCallback: Function,
    image: string,
    open: boolean,
    selectCycleValue: string,
    selectRefinementValue: string,
    wtb: boolean,
    wth: boolean,
    buy_price: number
}

class RelicCard extends React.Component<IRelicCardProps,IRelicCardState> {
    constructor(props:any) {
      super(props);
      this.state = {
        name: this.props.name,
        quantity: this.props.quantity,
        opened: this.props.opened,
        refinement: this.props.refinement,
        childCallback: this.props.childCallback,
        image: this.props.name.match('Lith')? lith:this.props.name.match('Meso')? meso:this.props.name.match('Neo')? neo:this.props.name.match('Axi')? axi:'',
        open: false,
        selectCycleValue: this.props.refinement.cycle,
        selectRefinementValue: this.props.refinement.refinement,
        wtb: this.props.wtb,
        wth: this.props.wth,
        buy_price: this.props.buy_price
      };
    }
    updateRelicDB = () => {
        relicDB.map((relic,i) => {
            if (relic.name == this.props.name)
                relicDB[i].quantity = this.state.quantity
        })
        event.emit('postRelicDB', relicDB)
    }
    handleRelicAddOne = () => {
        this.setState({quantity: Number(this.state.quantity)+1},this.updateRelicDB)
    }
    handleRelicRemoveOne = () => {
        this.setState({quantity: Number(this.state.quantity)-1},this.updateRelicDB);
    }
    handleRelicDelete = () => {
        relicDB.map((relic,i) => {
            if (relic.name == this.props.name)
                relicDB[i].display = false
        })
        event.emit('postRelicDB', relicDB)
        this.props.childCallback('updateCards',null)
    }

    getTooltipTitle = () => {
        interface Idrops {
            text: string,
            rarity: string,
            rarity_index: number
        }
        const colors = {
            rare: 'gold',
            uncommon: 'silver',
            common: '#E59866',
            error: '#D7193F'
        }
        function rarityIndex (rarity:string) {
            return rarity == 'common' ? 1 : (rarity == 'uncommon' ? 2 : 3)
        }
        const drops:Array<Idrops> = []
        const relic_str = this.state.name.toLowerCase().replace(/ /g,'_') + '_relic'
        if (items_list[relic_str as keyof Iitems_list]) {
            try {
                for (const [key, value] of Object.entries(items_list[relic_str as keyof Iitems_list].rewards)) {
                    if (key == 'common' && value.length == 2)
                        drops.push({text: 'forma_blueprint', rarity: key, rarity_index: rarityIndex(key)})
                    if (key == 'uncommon' && value.length == 1)
                        drops.push({text: 'forma_blueprint', rarity: key, rarity_index: rarityIndex(key)})
                    value.map(drop => {
                        drops.push({text: drop, rarity: key, rarity_index: rarityIndex(key)})
                    })
                }
                drops.sort(dynamicSort('text'))
                drops.sort(dynamicSort('rarity_index'))
                drops.forEach((drop,i) => {
                    if (drop.text != 'forma_blueprint')
                        drops[i].text += ` (${items_list[drop.text as keyof Iitems_list].sell_price}p)`
                    drops[i].text = convertUpper(drops[i].text)
                })
                //console.log(JSON.stringify(drops))
            } catch (e) {
                console.log(e + '\n' + JSON.stringify(items_list[relic_str as keyof Iitems_list]))
                drops.push({text: 'Error loading drops', rarity: 'error', rarity_index: 1})
            }
        }
        return (
            <React.Fragment>
            <Typography color="inherit">
                <div style={{whiteSpace: 'pre-line'}}>
                    {drops.length > 0 ? drops.map(drop => {return <p style={{color: colors[drop.rarity as keyof typeof colors]}}>{drop.text}</p>}):'Loading drops...'}
                </div>
            </Typography>
          </React.Fragment>
        )
    }
    handleSettingsOpen = () => {
      this.setState({open: true});
    };
  
    handleSettingsClose = () => {
        relicDB.map((relic, i) => {
            if (relic.name == this.state.name) 
                this.setState({open: false, selectCycleValue: relic.refinement.cycle, selectRefinementValue: relic.refinement.refinement});
        })
    };

    handleSettingsApply = () => {
        relicDB.map((relic, i) => {
            if (relic.name == this.state.name) {
                relicDB[i].refinement = {cycle: this.state.selectCycleValue, refinement: this.state.selectRefinementValue}
                relicDB[i].wtb = this.state.wtb
                relicDB[i].wth = this.state.wth
                relicDB[i].buy_price = this.state.buy_price
            }
        })
        event.emit('postRelicDB', relicDB)
    };

    render() {
        return (
            <Card variant="outlined" style={{width: "215px",borderWidth:"1px",color: this.state.quantity <= (config as any).inv_loths_val ? ((config as any).inv_loths_col):(this.state.quantity < (config as any).inv_upths_val ? '':(config as any).inv_upths_col)}}>
                <CardActionArea>
                    <Tooltip enterNextDelay={500} title={(config as any).showDropsonHover ? <this.getTooltipTitle />:''}>
                        <CardContent>
                            <Grid container spacing={2} justifyContent="center" alignItems="center">
                                <Grid item xs={3}>
                                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                        <Avatar
                                            alt="relic.png"
                                            src={this.state.image}
                                            sx={{ width: 32, height: 32 }}
                                        />
                                    </Typography>
                                </Grid>
                                <Grid item xs={7}>
                                    <Typography variant="h6" component="div">
                                        {this.state.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={2}></Grid>
                            </Grid>
                            <Typography variant="body2">
                                <Grid container spacing={1} justifyContent="center" alignItems="center">
                                    <Grid item xs={6}>
                                        Owned: {this.state.quantity}
                                    </Grid>
                                    <Grid item xs={6}>
                                        Opened: {this.state.opened}
                                    </Grid>
                                    <ButtonGroup disableElevation variant="contained">
                                        <Repeatable onHold={this.handleRelicAddOne}>
                                            <IconButton aria-label="plusone" color="success" onClick={this.handleRelicAddOne} style={{boxShadow:"none"}}><Add /></IconButton>
                                        </Repeatable>
                                        <Repeatable onHold={this.handleRelicRemoveOne}>
                                            <IconButton aria-label="minusone" color="secondary" onClick={this.handleRelicRemoveOne} style={{boxShadow:"none"}}><Remove /></IconButton>
                                        </Repeatable>
                                        <IconButton aria-label="delete" color="error" onClick={this.handleRelicDelete} style={{boxShadow:"none"}}><Delete /></IconButton>
                                        <IconButton aria-label="delete" onClick={this.handleSettingsOpen} style={{boxShadow:"none"}}><Settings /></IconButton>
                                    </ButtonGroup>

                                </Grid>
                            </Typography>
                        </CardContent>
                    </Tooltip>
                </CardActionArea>
                <Dialog open={this.state.open} onClose={this.handleSettingsClose} fullWidth={true} maxWidth={"sm"}>
                    <DialogTitle>{this.state.name}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={1} justifyContent="center" alignItems="center">
                            <Grid item xs={12}>
                                <div style={{display: 'flex',alignItems: 'center'}}>
                                    <Typography>Refinement:</Typography>
                                    <Select
                                        value={this.state.selectCycleValue}
                                        onChange= {(e) => this.setState({selectCycleValue: e.target.value})}
                                        size = 'small'
                                        style={{marginLeft: '10px'}}
                                    >
                                        <MenuItem value='1b1'>1b1</MenuItem>
                                        <MenuItem value='2b2'>2b2</MenuItem>
                                        <MenuItem value='3b3'>3b3</MenuItem>
                                        <MenuItem value='4b4'>4b4</MenuItem>
                                    </Select>
                                    <Select
                                        value={this.state.selectRefinementValue}
                                        onChange= {(e) => this.setState({selectRefinementValue: e.target.value})}
                                        size = 'small'
                                        style={{marginLeft: '10px'}}
                                    >
                                        <MenuItem value='int'>int</MenuItem>
                                        <MenuItem value='exc'>exc</MenuItem>
                                        <MenuItem value='flaw'>flaw</MenuItem>
                                        <MenuItem value='rad'>rad</MenuItem>
                                    </Select>
                                </div>
                            </Grid>
                            <Grid item xs={12}>
                                <div style={{display: 'flex',alignItems: 'center'}}>
                                    <FormControlLabel control={<Checkbox checked={this.state.wtb} onChange={(e) => this.setState({wtb: e.target.checked})}/>} label="Want to Buy" />
                                    <Typography style={{marginLeft: '20px'}}>Buy price:</Typography>
                                    <Input
                                        value={this.state.buy_price}
                                        size="small"
                                        onChange={(e) => this.setState({buy_price: e.target.value === '' ? 1:Number(e.target.value)})}
                                        inputProps={{
                                            step: 1,
                                            min: 1,
                                            max: 100,
                                            type: 'number',
                                        }}
                                        style= {{
                                            width: '50px',
                                            marginLeft: '10px'
                                        }}
                                    />
                                </div>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel control={<Checkbox checked={this.state.wth} onChange={(e) => this.setState({wth: e.target.checked})}/>} label="Want to Host" />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleSettingsApply}>Apply</Button>
                        <Button onClick={this.handleSettingsClose}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Card>
        )
    }
}

interface IAddRelicProps {
    childCallback: Function
    searchRelic: Array<string>
}
interface IAddRelicState {
    open: boolean,
    input: string,
    searchText: string,
    dialogMsg: string,
    childCallback: Function
}

var searchTimeout:ReturnType<typeof setTimeout>;
const searchTimeoutms = 200
class AddRelic extends React.Component<IAddRelicProps,IAddRelicState> {
    constructor(props:any) {
        super(props);
        this.state = {
          open: false,
          input: '',
          searchText: '',
          dialogMsg: '',
          childCallback: this.props.childCallback,
        };
      }

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({input: event.target.value});
    }

    handleChangeSearchRelic = (event: React.ChangeEvent<HTMLInputElement>) => {
        //console.log(event.target.value)
        if (event.target.value == '' || event.target.value == this.state.searchText) this.setState({searchText: ''}, () => this.handleSearchRelic())
        else {
            clearTimeout(searchTimeout)
            searchTimeout = setTimeout(this.handleSearchRelic, searchTimeoutms);
            this.setState({searchText: event.target.value});
        }
    }

    handleDialogKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') this.handleAdd()
    }

    handleSearchRelicKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            clearTimeout(searchTimeout)
            this.handleSearchRelic()
        }
    }

    handleSearchRelic = () => {
        console.log('searching: ' + this.state.searchText)
        var str = this.state.searchText.trim().replace('relic','').replace(/ /g,'_').toLowerCase();
        var relicsList:Array<string> = []
        if (str != '') {
            Object.keys(items_list).forEach(item => {
                if (item.match('^' + str + '\W*')) {
                    if (!items_list[item].tags.includes('relic')) {
                        if(items_list[item].relics) {
                            items_list[item].relics.forEach(relic => {
                                relicsList.push(convertUpper(relic.link.replace('_relic','')))
                            })
                        }
                    } else {
                        relicsList.push(convertUpper(item.replace('_relic','')))
                    }
                }
            })
            relicDB.forEach(relic => {
                if (relic.name.match('^' + str + '\W*')) relicsList.push(relic.name)
            })
        }
        this.props.childCallback('searchRelic', relicsList)
    }

    handleOpen = () => {
      this.setState({open: true});
    };
  
    handleClose = () => {
      this.setState({open: false,input: '',dialogMsg:''});
    };

    handleAdd = () => {
        const str = this.state.input.toLowerCase().replace('relic','')
        const str2 = this.state.input.toLowerCase().replace('relic','').replace(/ /g, '_') + '_relic'
        if (Object.keys(items_list).length == 0) {
            this.setState({dialogMsg: 'Please wait, loading relics list...'});
            setTimeout(this.handleAdd, 1000)
            return;
        }
        if (items_list[str2 as keyof Iitems_list]) {
            var exists = 0
            relicDB.map((relic,i) => {
                if (relic.name.toLowerCase() == str && relic.display == false) {
                    relicDB[i].display = true
                    exists = 2
                } else if (relic.name.toLowerCase() == str) exists = 1
            })
            if (exists == 1) this.setState({dialogMsg: 'Already exists: ' + convertUpper(str) + ' Relic',input: ''});
            else if (exists == 2) {
                this.setState({dialogMsg: 'Re-activated: ' + convertUpper(str) + ' Relic',input: ''});
                this.props.childCallback('updateCards',null)
                event.emit('postRelicDB', relicDB)
            } else if (exists == 0) {
                relicDB.push({
                    name: convertUpper(str),
                    quantity: 0,
                    opened: 0,
                    display: true,
                    refinement: {cycle: '4b4', refinement: 'rad'},
                    wtb: true,
                    wth: true,
                    buy_price: 5
                })
                relicDB.sort(dynamicSort("name"))
                this.setState({dialogMsg: 'Added: ' + convertUpper(str) + ' Relic',input: ''});
                this.props.childCallback('updateCards', null)
                event.emit('postRelicDB', relicDB)
            }
        } else this.setState({dialogMsg: 'Could not find: ' + convertUpper(str2),input: ''});
    };

    alertValue = () => {
        if (this.state.dialogMsg.toLowerCase().match('added:') || this.state.dialogMsg.toLowerCase().match('re-activated:'))
            return (<Alert variant="outlined" severity="success">{this.state.dialogMsg}</Alert>)
        else if (this.state.dialogMsg.toLowerCase().match('could not find'))
            return (<Alert variant="outlined" severity="error">{this.state.dialogMsg}</Alert>)
        else if (this.state.dialogMsg.toLowerCase().match('already exists:') || this.state.dialogMsg.toLowerCase().match('please wait'))
            return (<Alert variant="outlined" severity="info">{this.state.dialogMsg}</Alert>)
        else
            return ''
    }

    handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log(event.target.id + ": " + event.target.checked)
        showTiers[event.target.id as keyof IshowTiers] = event.target.checked
        //console.log(JSON.stringify(showTiers))
        this.props.childCallback('updateCards',null)
    }

    totalRelics = () => {
        var total = 0
        {relicDB.map((relic:relicProps, i:number) => {
            if (showTiers[(relic.name.split(' '))[0].toLowerCase() as keyof IshowTiers]) {
                if (relic.display || !relic.hasOwnProperty("display"))
                    if (this.props.searchRelic.length == 0 || this.props.searchRelic.includes(relic.name))
                        total += Number(relic.quantity)
            }
        })}
        return total
    }

    render() {
        const alert = this.alertValue()
        const total = this.totalRelics()
        return (<React.Fragment>
            <Grid container spacing={2} justifyContent="center" alignItems="center">
                <Grid item xs={3}>
                    <Button variant="outlined" onClick={this.handleOpen} startIcon={<AddBox />}>Add Relic</Button>
                </Grid>
                <Grid item xs={9} style={{display: 'flex', justifyContent:'flex-end'}}>
                    <Typography style={{paddingRight: '30px', paddingTop: '25px'}}>Total: {total}</Typography>
                    <TextField variant="standard" id="standard-helperText" label="Search relic" style={{marginRight: "30px",marginBottom:"25px"}} onChange={this.handleChangeSearchRelic} onKeyUp={this.handleSearchRelicKeyUp}/>
                    <FormControlLabel control={<Checkbox defaultChecked={showTiers.lith ? true:false} onChange={this.handleCheckboxChange} id="lith"/>} label="Lith" />
                    <FormControlLabel control={<Checkbox  defaultChecked={showTiers.meso ? true:false} onChange={this.handleCheckboxChange} id="meso"/>} label="Meso" />
                    <FormControlLabel control={<Checkbox defaultChecked={showTiers.neo ? true:false} onChange={this.handleCheckboxChange} id="neo"/>} label="Neo" />
                    <FormControlLabel control={<Checkbox defaultChecked={showTiers.axi ? true:false} onChange={this.handleCheckboxChange} id="axi"/>} label="Axi" />
                </Grid>
            </Grid>
            <Dialog open={this.state.open} onClose={this.handleClose} fullWidth={true} maxWidth={"sm"}>
                <DialogTitle>Add New Relic</DialogTitle>
                <DialogContent>
                    {alert}
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        label="e.g. axi t2"
                        fullWidth
                        variant="standard"
                        onChange={this.handleChange}
                        onKeyUp={this.handleDialogKeyUp}
                        value={this.state.input}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleAdd}>Add</Button>
                    <Button onClick={this.handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
        )
    }
}

export default React.memo(Inventory)