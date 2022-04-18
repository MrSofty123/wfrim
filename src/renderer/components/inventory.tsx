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
//import { readFileSync,writeFileSync } from 'fs';
//import { readFileSync } from 'original-fs';
import dbfile from './relicDB.json'
import fs from 'fs'
import path from 'path';
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
var relicDB:Array<relicProps> = dbfile

export default function() {
    return <Inventory/>
}
/*
export default function Inventory() {
    const [items,setItems] = React.useState(itemComponents.map((item: any, i: number) => item))
    //var relicDB:Record<string,relicProps> = {}



    const handleClickOpen = () => {
      setOpen(true);
    };
  
    const handleClose = () => {
      setOpen(false);
    };

    const handleAdd = () => {
        setOpen(false);
        itemComponents.push(
            <Box sx={{ width:200, height:175 }}>
              <Card variant="outlined" id={`card_${input}`}><RelicCard name={input}/></Card>
            </Box>
        )
        setItems(itemComponents.map((item: any, i: number) => item))
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter')
            handleAdd()
    }

    function handleRelicAddOne(id:number) {
        console.log('add one relic: ' + id)
        relicDB[id].quantity++
    }
    function handleRelicRemoveOne(id:number) {
        console.log('remove one relic: ' + id)
        relicDB[id].quantity--
    }
    function handleRelicDelete(id:number) {
        console.log('delete relic: ' + id)
    }
    function CreateCard(props:any) {
        console.log("======================================================" + props.id)
        return (<React.Fragment>
             <CardContent>
                <Typography variant="h6" component="div">
                    {props.id}
                </Typography>
                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    <Avatar
                    alt="relic.png"
                    src="./assets/icons/lith"
                    sx={{ width: 24, height: 24 }}
                    />
                </Typography>
                <Typography variant="body2">
                    <Grid container spacing={2} justifyContent="center" alignItems="center">
                        <Grid item xs={6}>
                            Owned: {relicDB[props.id].quantity}
                        </Grid>
                        <Grid item xs={6}>
                            Opened: {relicDB[props.id].opened}
                        </Grid>
                        <ButtonGroup disableElevation variant="contained">
                            <IconButton aria-label="plusone" color="success" onClick={() => handleRelicAddOne(props.id)}><PlusOne /></IconButton>
                            <IconButton aria-label="minusone" color="secondary" onClick={() => handleRelicRemoveOne(props.id)}><PlusOne /></IconButton>
                            <IconButton aria-label="delete" color="error" onClick={() => handleRelicDelete(props.id)}><Delete /></IconButton>
                        </ButtonGroup>
                    </Grid>
                </Typography>
            </CardContent>
        </React.Fragment>)
    }
    
    return (
        <Box sx={{height:500}}>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Button variant="outlined" onClick={handleClickOpen} startIcon={<AddBox />}>Add Relic</Button>
                    <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>Add new relic</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="relic_name"
                            label="e.g. axi t2"
                            fullWidth
                            variant="standard"
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleAdd}>Add</Button>
                        <Button onClick={handleClose}>Cancel</Button>
                    </DialogActions>
                    </Dialog>
                </Grid>
                <Grid item xs={12}>
                    <Box sx={{ flexGrow: 1 }}>
                    <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                        {items.map((item:any, i:number) => {
                            return item
                        })}
                    </Grid>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
}
*/

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
            <Box sx={{height:500}}>
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
                        <Box sx={{ flexGrow: 1 }}>
                        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                            {this.state.updateCards}
                            {relicDB.map((relic:any, i:number) => {
                                return <Box sx={{ width:200, height:175, display:relic.display}}>
                                  <Card variant="outlined"><RelicCard name={relic.name} quantity={relic.quantity} opened={relic.opened} childCallback={this.childCallback}/></Card>
                                </Box>
                            })}
                        </Grid>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
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
    childCallback: Function
}
class RelicCard extends React.Component<IRelicCardProps,IRelicCardState> {
    constructor(props:any) {
      super(props);
      this.state = {
        name: this.props.name,
        quantity: this.props.quantity,
        opened: this.props.opened,
        childCallback: this.props.childCallback
      };
      this.componentDidCatch
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
             <CardContent>
                <Typography variant="h6" component="div">
                    {this.state.name}
                </Typography>
                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    <Avatar
                    alt="relic.png"
                    src='assets/lith'
                    sx={{ width: 24, height: 24 }}
                    />
                </Typography>
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
        </React.Fragment>)
    }
}