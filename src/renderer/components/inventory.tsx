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
    PlusOne,
    Delete
} from '@mui/icons-material';
import React from 'react';

var itemComponents:any = []
var relicDB:Array<any> = []

export default function Inventory() {
    const [open, setOpen] = React.useState(false);
    const [input, setInput] = React.useState('');
    const [items,setItems] = React.useState(itemComponents.map((item: any, i: number) => item))

    const handleClickOpen = () => {
      setOpen(true);
    };
  
    const handleClose = () => {
      setOpen(false);
    };

    const handleAdd = () => {
        setOpen(false);
        const relicId = relicDB.push({
            name: input,
            quantity: 0,
            opened: 0
        })
        itemComponents.push(
            <Box sx={{ width:200, height:175 }}>
              <Card variant="outlined" id={input}><CreateCard id={relicId-1}/></Card>
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
      
    function CreateCard(props:any) {
        console.log("======================================================" + props.id)
        return (<React.Fragment>
             <CardContent>
                <Typography variant="h6" component="div">
                    {relicDB[props.id].name}
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
                            <IconButton aria-label="plusone" color="success"><PlusOne /></IconButton>
                            <IconButton aria-label="minusone" color="secondary"><PlusOne /></IconButton>
                            <IconButton aria-label="delete" color="error"><Delete /></IconButton>
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