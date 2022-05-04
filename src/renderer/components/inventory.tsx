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
    CssBaseline
} from '@mui/material';
import {
    AddBox,
    Add,
    Remove,
    Delete
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
    display: boolean
}
//var relicDB:Array<relicProps> = [{"name":"Axi A2","quantity":114},{"name":"Axi A5","quantity":8},{"name":"Axi A7","quantity":3},{"name":"Axi E1","quantity":40},{"name":"Axi G1","quantity":16},{"name":"Axi G8","quantity":0,"opened":0,"display":false},{"name":"Axi L1","quantity":1},{"name":"Axi L4","quantity":6},{"name":"Axi N1","quantity":18},{"name":"Axi N2","quantity":"17"},{"name":"Axi N3","quantity":18},{"name":"Axi N4","quantity":"15"},{"name":"Axi N5","quantity":0},{"name":"Axi N6","quantity":32},{"name":"Axi R1","quantity":"1"},{"name":"Axi S2","quantity":17},{"name":"Axi S3","quantity":532},{"name":"Axi S4","quantity":19},{"name":"Axi S5","quantity":3},{"name":"Axi S6","quantity":6},{"name":"Axi S7","quantity":63},{"name":"Axi T1","quantity":4},{"name":"Axi V1","quantity":4},{"name":"Axi V2","quantity":69},{"name":"Axi V8","quantity":680},{"name":"Axi V9","quantity":0},{"name":"Lith A1","quantity":128},{"name":"Lith B1","quantity":8},{"name":"Lith B4","quantity":280},{"name":"Lith C5","quantity":45},{"name":"Lith G1","quantity":5},{"name":"Lith G2","quantity":1},{"name":"Lith H1","quantity":22},{"name":"Lith M1","quantity":62},{"name":"Lith M2","quantity":50},{"name":"Lith N2","quantity":36},{"name":"Lith N3","quantity":7},{"name":"Lith O2","quantity":6},{"name":"Lith S3","quantity":2},{"name":"Lith S4","quantity":42},{"name":"Lith T3","quantity":6},{"name":"Lith T6","quantity":163},{"name":"Lith V1","quantity":304},{"name":"Lith V2","quantity":185},{"name":"Lith V6","quantity":1},{"name":"Lith V7","quantity":9},{"name":"Lith V8","quantity":9},{"name":"Meso B1","quantity":40},{"name":"Meso B3","quantity":22},{"name":"Meso C1","quantity":0},{"name":"Meso C3","quantity":13},{"name":"Meso E1","quantity":2},{"name":"Meso F1","quantity":2},{"name":"Meso F2","quantity":19},{"name":"Meso F3","quantity":"0"},{"name":"Meso M1","quantity":7},{"name":"Meso N2","quantity":93},{"name":"Meso N3","quantity":"0"},{"name":"Meso N4","quantity":5},{"name":"Meso N6","quantity":383},{"name":"Meso N8","quantity":"22"},{"name":"Meso O3","quantity":4},{"name":"Meso O4","quantity":14},{"name":"Meso S2","quantity":45},{"name":"Meso S3","quantity":5},{"name":"Meso S4","quantity":4},{"name":"Meso S5","quantity":85},{"name":"Meso S9","quantity":60},{"name":"Meso V1","quantity":90},{"name":"Meso V2","quantity":64},{"name":"Meso V6","quantity":9},{"name":"Neo A4","quantity":2},{"name":"Neo B3","quantity":0},{"name":"Neo D1","quantity":7},{"name":"Neo F1","quantity":4},{"name":"Neo K3","quantity":88},{"name":"Neo N11","quantity":10},{"name":"Neo N2","quantity":21,"display":false},{"name":"Neo N3","quantity":20,"display":false},{"name":"Neo N5","quantity":10},{"name":"Neo N6","quantity":11},{"name":"Neo N7","quantity":19},{"name":"Neo N9","quantity":19},{"name":"Neo O1","quantity":37},{"name":"Neo R1","quantity":308},{"name":"Neo S1","quantity":8},{"name":"Neo S10","quantity":18},{"name":"Neo S13","quantity":23},{"name":"Neo S2","quantity":13},{"name":"Neo S5","quantity":29},{"name":"Neo V1","quantity":5},{"name":"Neo V2","quantity":15},{"name":"Neo V3","quantity":139},{"name":"Neo V4","quantity":48},{"name":"Neo V5","quantity":163},{"name":"Neo V8","quantity":2},{"name":"Neo Z8","quantity":121}]
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
var items_list:Iitems_list = {
}

interface IshowTiers {
    lith: boolean,
    meso: boolean,
    neo: boolean,
    axi: boolean,
}

var showTiers:IshowTiers = {lith:true,meso:true,neo:true,axi:true}

event.on('itemsListFetch', (data) => {
    // convert into keys for faster access
    data.forEach((item:any) => {
        items_list[item.item_url as keyof Iitems_list] = item
    })
})


interface IInventoryProps {
}
interface IInventoryState {
    updateCards: boolean,
    searchRelic: Array<string>,
    relicDB: Array<relicProps>
}

class Inventory extends React.Component<IInventoryProps,IInventoryState> {
    constructor(props:any) {
      super(props);
      this.state = {
        updateCards: false,
        searchRelic: [],
        relicDB: relicDB
      };
    }
    
    componentDidMount() {
        event.on('relicDBFetch', (data) => {
            relicDB = []
            relicDB = typeof data == 'object' ? data:JSON.parse(data as string)
            this.setState({relicDB: []}, () => this.setState({relicDB: relicDB}));
            //console.log(JSON.stringify(relicDB))
            //if (!inventory) setTimeout(relicDBFetch, 1000);
            //else 
        });
        event.on('itemsListFetch', (data) => {
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
        if (option=="updateCards") this.setState({updateCards: true});
        if (option=="searchRelic") this.setState({searchRelic: arg});
    }
    render() {
        return (
            <Grid container spacing={4}>
                <CssBaseline/>
                <Grid item xs={12}>
                    <AddRelic childCallback={this.childCallback}/>
                </Grid>
                <Grid item xs={12}>
                    <div>
                    <Grid container spacing={1}>
                        {this.state.updateCards}
                        {this.state.relicDB.map((relic:any, i:number) => {
                            //console.log('Creating card ' + relic.name)
                            const arr = relic.name.split(' ')
                            if (showTiers[arr[0].toLowerCase() as keyof IshowTiers]) {
                                if (relic.display || !relic.hasOwnProperty("display"))
                                    if (this.state.searchRelic.length == 0 || this.state.searchRelic.includes(relic.name))
                                        return <Grid item key={`card${relic.name.replace(/ /g,'_')}`}>
                                                    <RelicCard name={relic.name} quantity={relic.quantity} opened={relic.opened} childCallback={this.childCallback}/>
                                                </Grid>
                            }
                        })}
                    </Grid>
                    </div>
                </Grid>
            </Grid>
        )
    }
}


interface IRelicCardProps {
    name: string,
    quantity: number,
    opened: number,
    childCallback: Function
}
interface IRelicCardState {
    name: string,
    quantity: number,
    opened: number,
    childCallback: Function,
    image: string
}


class RelicCard extends React.Component<IRelicCardProps,IRelicCardState> {
    constructor(props:any) {
      super(props);
      this.state = {
        name: this.props.name,
        quantity: this.props.quantity,
        opened: this.props.opened,
        childCallback: this.props.childCallback,
        image: this.props.name.match('Lith')? lith:this.props.name.match('Meso')? meso:this.props.name.match('Neo')? neo:this.props.name.match('Axi')? axi:''
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
                                <Grid container spacing={2} justifyContent="center" alignItems="center">
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
                                    </ButtonGroup>
                                </Grid>
                            </Typography>
                        </CardContent>
                    </Tooltip>
                </CardActionArea>
            </Card>
        )
    }
}

interface IAddRelicProps {
    childCallback: Function
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
                    display: true
                })
                relicDB = relicDB.sort(dynamicSort("name"))
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

    render() {
        const alert = this.alertValue()
        return (<React.Fragment>
            <Grid container spacing={2} justifyContent="center" alignItems="center">
                <Grid item xs={6}>
                    <Button variant="outlined" onClick={this.handleOpen} startIcon={<AddBox />}>Add Relic</Button>
                </Grid>
                <Grid item xs={6} style={{display: 'flex', justifyContent:'flex-end'}}>
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