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
    Grid
} from '@mui/material';
import {
    AddBox,
    Add,
    Remove,
    Delete,
    DriveEtaTwoTone
} from '@mui/icons-material';
import React from 'react';
import {event} from '../eventHandler'
import lith from '../../../assets/lith.png'
import meso from '../../../assets/meso.png'
import neo from '../../../assets/neo.png'
import axi from '../../../assets/axi.png'
import Repeatable from 'react-repeatable'
import {convertUpper,dynamicSort} from './extras'

interface relicProps {
    name: string,
    quantity: number,
    opened: number,
    display: boolean
}
var relicDB:Array<relicProps> = []
var items_list:Array<object> = []

interface IshowTiers {
    lith: boolean,
    meso: boolean,
    neo: boolean,
    axi: boolean,
}

var showTiers:IshowTiers = {lith:true,meso:false,neo:true,axi:false}

event.on('relicDBFetch', function relicDBFetch (data) {
    relicDB = data
    //console.log(JSON.stringify(relicDB))
    if (!inventory) setTimeout(relicDBFetch, 1000);
    else inventory.forceUpdate()
})
event.on('itemsListFetch', (data) => {
    items_list = data
    //inventory.forceUpdate()
})

event.on('error', (data) => {
})

export default function() {
    return inventory
}

interface IInventoryState {
    updateCards: boolean
}


class Inventory extends React.Component<any,IInventoryState> {
    constructor(props:any) {
      super(props);
      this.state = {
        updateCards: false
      };
    }

    childCallback = (option:string) => {
        if (option=="updateCards") {
            //console.log(JSON.stringify(relicDB))
            this.setState({updateCards: true});
        }
    }

    render() {
        return (
            <Box sx={{height:"90vh"}}>
                <Grid container spacing={4}>
                    <Grid item xs={12}>
                        <AddRelic childCallback={this.childCallback}/>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container spacing={1}>
                            {this.state.updateCards}
                            {relicDB.map((relic:any, i:number) => {
                                //console.log('Creating card ' + relic.name)
                                const arr = relic.name.split(' ')
                                if (showTiers[arr[0].toLowerCase() as keyof IshowTiers]) {
                                    if (relic.display || !relic.hasOwnProperty("display"))
                                        return <Grid item xs={6} sm={4} md={2} lg={1.5}>
                                            <Card variant="outlined"><RelicCard name={relic.name} quantity={relic.quantity} opened={relic.opened} childCallback={this.childCallback}/></Card>
                                        </Grid>
                                }
                            })}
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        )
    }
}

const inventory = new Inventory('new')

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
        this.setState({quantity: (this.state.quantity as number)+1},this.updateRelicDB)
    }
    handleRelicRemoveOne = () => {
        this.setState({quantity: (this.state.quantity as number)-1},this.updateRelicDB);
    }
    handleRelicDelete = () => {
        relicDB.map((relic,i) => {
            if (relic.name == this.props.name)
                relicDB[i].display = false
        })
        event.emit('postRelicDB', relicDB)
        this.props.childCallback('updateCards')
    }
    render() {
        return (<React.Fragment>
            <CardActionArea>
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
                                    <IconButton aria-label="plusone" color="success" onClick={this.handleRelicAddOne}><Add /></IconButton>
                                </Repeatable>
                                <Repeatable onHold={this.handleRelicRemoveOne}>
                                    <IconButton aria-label="minusone" color="secondary" onClick={this.handleRelicRemoveOne}><Remove /></IconButton>
                                </Repeatable>
                                <IconButton aria-label="delete" color="error" onClick={this.handleRelicDelete}><Delete /></IconButton>
                            </ButtonGroup>
                        </Grid>
                    </Typography>
                </CardContent>
            </CardActionArea>
        </React.Fragment>)
    }
}

interface IAddRelicProps {
    childCallback: Function
}
interface IAddRelicState {
    open: boolean,
    input: string,
    dialogMsg: string,
    childCallback: Function
}


class AddRelic extends React.Component<IAddRelicProps,IAddRelicState> {
    constructor(props:any) {
        super(props);
        this.state = {
          open: false,
          input: '',
          dialogMsg: '',
          childCallback: this.props.childCallback,
        };
      }

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({input: event.target.value});
    }

    handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter')
            this.handleAdd()
    }

    handleOpen = () => {
      this.setState({open: true});
    };
  
    handleClose = () => {
      this.setState({open: false,input: '',dialogMsg:''});
    };

    handleAdd = () => {
        const str = this.state.input.toLowerCase().replace('relic','')
        if (str.match('lith') || str.match('meso') || str.match('neo') || str.match('axi') || str.match('requiem')) {
            var exists = 0
            relicDB.map((relic,i) => {
                if (relic.name.toLowerCase() == str && relic.display == false) {
                    relicDB[i].display = true
                    exists = 2
                } else if (relic.name.toLowerCase() == str)
                    exists = 1
            })
            if (exists == 1) {
                this.setState({dialogMsg: 'Already exists: ' + convertUpper(str) + ' Relic',input: ''});
            } 
            else if (exists == 2) {
                this.setState({dialogMsg: 'Re-activated: ' + convertUpper(str) + ' Relic',input: ''});
                this.props.childCallback('updateCards')
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
                this.props.childCallback('updateCards')
                event.emit('postRelicDB', relicDB)
            }
        } else {
            this.setState({dialogMsg: 'Invalid relic: ' + convertUpper(str),input: ''});
        }
    };

    alertValue = () => {
        if (this.state.dialogMsg.toLowerCase().match('added:') || this.state.dialogMsg.toLowerCase().match('re-activated:'))
            return (<Alert variant="outlined" severity="success">{this.state.dialogMsg}</Alert>)
        else if (this.state.dialogMsg.toLowerCase().match('invalid relic:'))
            return (<Alert variant="outlined" severity="error">{this.state.dialogMsg}</Alert>)
        else if (this.state.dialogMsg.toLowerCase().match('already exists:'))
            return (<Alert variant="outlined" severity="info">{this.state.dialogMsg}</Alert>)
        else
            return ''
    }

    handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log(event.target.id + ": " + event.target.checked)
        showTiers[event.target.id as keyof IshowTiers] = event.target.checked
        //console.log(JSON.stringify(showTiers))
        this.props.childCallback('updateCards')
    }

    render() {
        const alert = this.alertValue()
        return (<React.Fragment>
            
            <Grid container spacing={2} justifyContent="center" alignItems="center">
                <Grid item xs={6}>
                    <Button variant="outlined" onClick={this.handleOpen} startIcon={<AddBox />}>Add Relic</Button>
                </Grid>
                <Grid item xs={6}>
                    <div>
                        <FormControlLabel control={<Checkbox defaultChecked={showTiers.lith ? true:false} onChange={this.handleCheckboxChange} id="lith"/>} label="Lith" />
                        <FormControlLabel control={<Checkbox  defaultChecked={showTiers.meso ? true:false} onChange={this.handleCheckboxChange} id="meso"/>} label="Meso" />
                        <FormControlLabel control={<Checkbox defaultChecked={showTiers.neo ? true:false} onChange={this.handleCheckboxChange} id="neo"/>} label="Neo" />
                        <FormControlLabel control={<Checkbox defaultChecked={showTiers.axi ? true:false} onChange={this.handleCheckboxChange} id="axi"/>} label="Axi" />
                    </div>
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
                        onKeyUp={this.handleKeyDown}
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