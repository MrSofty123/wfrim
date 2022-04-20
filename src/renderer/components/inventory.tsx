import {
    Button, 
    IconButton,
    ButtonGroup,
    Dialog,DialogTitle, 
    DialogContent,
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
    Delete
} from '@mui/icons-material';
import React from 'react';
import {event} from '../eventHandler'
import lith from '../../../assets/lith.png'
import meso from '../../../assets/meso.png'
import neo from '../../../assets/neo.png'
import axi from '../../../assets/axi.png'
//import { readFileSync,writeFileSync } from 'fs';
//import { readFileSync } from 'original-fs';
//import dbfile from './relicDB.json'/
//var dbfile = fs.readFileSync(path.join(__dirname,  'relicDB.json'))
//import dbfile from './relicDB.json'
//const dbfile = fs.readFileSync('./relicDB.json')
//import dbfile from 'renderer/components/fileHandler'
//const fs = require('fs')
//import path from 'path';
//var dbfile = fs.readFileSync('./relicDB.json')
//const icon = path.join(__dirname, "assets/lith.png");
/*
dbfile.forEach((relic,i) => {
    if (!relic.display)
        relicDB[i].display = 'block'
})
*/
//var itemComponents:any = []
/*
var relicDB = [{
        name: "axi_t1",
        quantity: 52,
        opened: 2,
        display: 'block'
    },{
        name: "axi_t2",
        quantity: 5,
        opened: 24,
        display: 'block'
    },{
        name: "axi_t3",
        quantity: 555,
        opened: 25,
        display: 'block'
    },
]*/


interface relicProps {
    name: string,
    quantity: number,
    opened: number,
    display: string
}
var relicDB:Array<relicProps> = []

event.on('relicDBFetch', (data) => {
    relicDB = data
    inventory.forceUpdate()
})

export default function() {
    return inventory
}
interface IRelicCardProps {
    name: string
}
interface IInventoryState {
    open: boolean,
    updateCards: boolean,
    input: string
}

class Inventory extends React.Component<any,IInventoryState> {
    constructor(props:any) {
      super(props);
      this.state = {
        open: false,
        updateCards: false,
        input: ''
      };
    }
    handleOpen = () => {
      this.setState({open: true});
    };
  
    handleClose = () => {
      this.setState({open: false});
    };

    handleAdd = () => {
        this.setState({open: false});
        relicDB.push({
            name: this.state.input,
            quantity: 0,
            opened: 0,
            display: 'block'
        })
        this.setState({updateCards: true});
    };

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({input: event.target.value});
    }

    handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter')
            this.handleAdd()
    }
    childCallback = (option:string) => {
        if (option=="updateCards") {
            console.log(JSON.stringify(relicDB))
            this.setState({updateCards: true});
        }
    }


    render() {
        return (
            <Box sx={{height:"90vh"}}>
                <Grid container spacing={4}>
                    <Grid item xs={12}>
                        <Button variant="outlined" onClick={this.handleOpen} startIcon={<AddBox />}>Add Relic</Button>
                        <Dialog open={this.state.open} onClose={this.handleClose}>
                            <DialogTitle>Add new relic</DialogTitle>
                            <DialogContent>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    id="relic_name"
                                    label="e.g. axi t2"
                                    fullWidth
                                    variant="standard"
                                    onChange={this.handleChange}
                                    onKeyDown={this.handleKeyDown}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={this.handleAdd}>Add</Button>
                                <Button onClick={this.handleClose}>Cancel</Button>
                            </DialogActions>
                        </Dialog>
                    </Grid>
                    <Grid item xs={12}>
                            <Grid container spacing={1} justify="center">
                                {this.state.updateCards}
                                {relicDB.map((relic:any, i:number) => {
                                    return <Grid item xs={6} sm={4} md={2} lg={1.5}>
                                        <Card variant="outlined"><RelicCard name={relic.name} quantity={relic.quantity} opened={relic.opened} childCallback={this.childCallback}/></Card>
                                    </Grid>
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
        image: this.props.name.match('Lith')? lith:this.props.name.match('Meso')? meso:this.props.name.match('Neo')? meso:this.props.name.match('Axi')? axi:''
      };
    }
    updateRelicDB = () => {
        relicDB.map((relic,i) => {
            if (relic.name == this.props.name)
                relicDB[i].quantity = this.state.quantity
        })
    }
    handleRelicAddOne = () => {
        this.setState({quantity: this.state.quantity+1},this.updateRelicDB)
    }
    handleRelicRemoveOne = () => {
        this.setState({quantity: this.state.quantity-1},this.updateRelicDB);
    }
    handleRelicDelete = () => {
        relicDB.map((relic,i) => {
            if (relic.name == this.props.name)
                relicDB[i].display = 'none'
        })
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
                                <IconButton aria-label="plusone" color="success" onClick={this.handleRelicAddOne}><Add /></IconButton>
                                <IconButton aria-label="minusone" color="secondary" onClick={this.handleRelicRemoveOne}><Remove /></IconButton>
                                <IconButton aria-label="delete" color="error" onClick={this.handleRelicDelete}><Delete /></IconButton>
                            </ButtonGroup>
                        </Grid>
                    </Typography>
                </CardContent>
            </CardActionArea>
        </React.Fragment>)
    }
}