import {
    Button, 
    IconButton,
    ButtonGroup,
    Dialog,
    DialogTitle, 
    DialogContent,
    DialogContentText,
    DialogActions,
    Alert,
    FormControlLabel,
    Checkbox,
    TextField,
    Box,
    Card,
    CardContent,
    CardActionArea,
    Typography,
    Avatar,
    Grid,
    Tooltip,
    ListItem,
    ListItemButton,
    ListItemText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CssBaseline,
    Input
} from '@mui/material';
import {
    AddBox,
    Add,
    Remove,
    Delete,
    FileDownload
} from '@mui/icons-material';
import React, { ChangeEvent } from 'react';
import {event} from '../eventHandler'
import lith from '../../../assets/lith.png'
import meso from '../../../assets/meso.png'
import neo from '../../../assets/neo.png'
import axi from '../../../assets/axi.png'
import Repeatable from 'react-repeatable'
//import {convertUpper,dynamicSort, dynamicSortDesc} from './extras'
import {config} from './config'

var rawStatistics = {mission_initialize: [], trades: []}
var relicsDB:Array<any> = []

event.on('statisticsFetch', (data:any) => {
    rawStatistics = typeof data == 'object' ? data:JSON.parse(data)
    event.emit('updateStatistics')
})
event.on('relicDBFetch', (data:any) => {
    relicsDB = typeof data == 'object' ? data:JSON.parse(data)
})

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
        vault_status: string,
        items_in_set: Array<{url_name: string, quantity_for_set: number}>,
    }
}
var items_list:Iitems_list = {
}
event.on('itemsListFetch', (data) => {
    // convert into keys for faster access
    data.forEach((item:any) => {
        items_list[item.item_url as keyof Iitems_list] = item
    })
})

interface IStatisticsProps {
}
interface IStatisticsState {
    update: boolean
}

class Statistics extends React.Component<IStatisticsProps,IStatisticsState> {
    constructor(props:any) {
      super(props);
      this.state = {
        update: false,
      };
    }
    
    componentDidMount() {
        event.on('updateStatistics', (data:any) => {
            this.setState({update: !this.state.update});
        })
        event.on('itemsListFetch', (data:any) => {
            this.setState({update: !this.state.update});
        })
    }

    computeStats = () => {
        interface Istatistics {
            relics: {
                opened: {
                    total: {
                        all_time: number,
                        today: number,
                        daily_avg: number
                        runsPerDay: {[key: string]: Array<object>}
                    },
                    vaulted: {
                        all_time: number,
                        today: number,
                        daily_avg: number
                        runsPerDay: {[key: string]: Array<object>}
                    },
                    tracked: {
                        all_time: number,
                        today: number,
                        daily_avg: number
                        runsPerDay: {[key: string]: Array<object>}
                    }
                },
                opened_distr: {[key: string]: {opened: 0}},
                opened_sorted: string[]
            },
            trades: {
                plat: {
                    spent: {
                        all_time: number,
                        today: number,
                        daily_avg: number,
                        spentPerDay: {[key: string]: number}
                    },
                    gained: {
                        all_time: number,
                        today: number,
                        daily_avg: number,
                        gainedPerDay: {[key: string]: number}
                    }
                },
                items: {
                    sold: {[key: string]: number},
                    bought: {[key: string]: number},
                    sets_sold: {[key: string]: number},
                }
            }
        }
        var statistics:Istatistics = {
            relics: {
                opened: {
                    total: {
                        all_time: 0,
                        today: 0,
                        daily_avg: 0,
                        runsPerDay: {}
                    },
                    vaulted: {
                        all_time: 0,
                        today: 0,
                        daily_avg: 0,
                        runsPerDay: {}
                    },
                    tracked: {
                        all_time: 0,
                        today: 0,
                        daily_avg: 0,
                        runsPerDay: {}
                    }
                },
                opened_distr: {},
                opened_sorted: []
            },
            trades: {
                plat: {
                    spent: {
                        all_time: 0,
                        today: 0,
                        daily_avg: 0,
                        spentPerDay: {}
                    },
                    gained: {
                        all_time: 0,
                        today: 0,
                        daily_avg: 0,
                        gainedPerDay: {}
                    }
                },
                items: {
                    sold: {},
                    bought: {},
                    sets_sold: {}
                }
            }
        }
        rawStatistics.mission_initialize.forEach((mission:any,index:number) => {
            if (mission.status == 'successful') {
                mission.relicEquipped = mission.relicEquipped.toLowerCase()
                mission.timestamp = new Date(mission.timestamp).getTime()
                // opened_distr
                if (!statistics.relics.opened_distr[getRelicUrl(mission.relicEquipped)]) statistics.relics.opened_distr[getRelicUrl(mission.relicEquipped)] = {opened: 0}
                statistics.relics.opened_distr[getRelicUrl(mission.relicEquipped)].opened++
                // Total Opened 
                    // all time
                    statistics.relics.opened.total.all_time++
                    // today
                    if (mission.timestamp >= new Date().setHours(0,0,0,0)) statistics.relics.opened.total.today++
                    // runsPerDay
                    if (mission.timestamp > 100000) {
                        if (!statistics.relics.opened.total.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))]) statistics.relics.opened.total.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))] = []
                        statistics.relics.opened.total.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))].push(mission)
                    }
                // Vaulted Opened
                const vault_status = items_list[getRelicUrl(mission.relicEquipped)]?.vault_status
                if (vault_status == 'V' || vault_status == 'B' || vault_status == 'P') {
                    // all time
                    statistics.relics.opened.vaulted.all_time++
                    // today
                    if (mission.timestamp >= new Date().setHours(0,0,0,0)) statistics.relics.opened.vaulted.today++
                    // runsPerDay
                    if (mission.timestamp > 100000) {
                        if (!statistics.relics.opened.vaulted.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))]) statistics.relics.opened.vaulted.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))] = []
                        statistics.relics.opened.vaulted.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))].push(mission)
                    }
                }
                // Tracked Opened
                for (const relic of relicsDB) {
                    if (getRelicUrl(relic.name) == getRelicUrl(mission.relicEquipped)) {
                        // all time
                        statistics.relics.opened.tracked.all_time++
                        // today
                        if (mission.timestamp >= new Date().setHours(0,0,0,0)) statistics.relics.opened.tracked.today++
                        // runsPerDay
                        if (mission.timestamp > 100000) {
                            if (!statistics.relics.opened.tracked.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))]) statistics.relics.opened.tracked.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))] = []
                            statistics.relics.opened.tracked.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))].push(mission)
                        }
                        break
                    }
                }
            }
        })
        // Total - daily_avg
        var avg = 0
        for (const key in statistics.relics.opened.total.runsPerDay) {
            avg += statistics.relics.opened.total.runsPerDay[key].length
        }
        statistics.relics.opened.total.daily_avg = Number((avg / Object.keys(statistics.relics.opened.total.runsPerDay).length).toFixed(1))
        // Vaulted - daily_avg
        var avg = 0
        for (const key in statistics.relics.opened.vaulted.runsPerDay) {
            avg += statistics.relics.opened.vaulted.runsPerDay[key].length
        }
        statistics.relics.opened.vaulted.daily_avg = Number((avg / Object.keys(statistics.relics.opened.vaulted.runsPerDay).length).toFixed(1))
        // Tracked - daily_avg
        var avg = 0
        for (const key in statistics.relics.opened.tracked.runsPerDay) {
            avg += statistics.relics.opened.tracked.runsPerDay[key].length
        }
        statistics.relics.opened.tracked.daily_avg = Number((avg / Object.keys(statistics.relics.opened.tracked.runsPerDay).length).toFixed(1))
        statistics.relics.opened_sorted = Object.keys(statistics.relics.opened_distr).sort(function(a,b){return statistics.relics.opened_distr[b].opened-statistics.relics.opened_distr[a].opened})

        rawStatistics.trades.forEach((trade:any) => {
            trade.timestamp = new Date(trade.timestamp).getTime()
            if (trade.status == 'successful' && !trade.deprecated) {
                try {
                    trade.offeringItems.forEach((item:string) => {
                        item = item.toLowerCase().replace('_chassis_blueprint', '_chassis').replace('_systems_blueprint', '_systems').replace('_neuroptics_blueprint', '_neuroptics').replace('_wings_blueprint', '_wings').replace('_harness_blueprint', '_harness')
                        if (item.match('platinum')) {
                            // all time
                            statistics.trades.plat.spent.all_time += Number((item.split('_'))[2])
                            // today
                            if (trade.timestamp >= new Date().setHours(0,0,0,0)) statistics.trades.plat.spent.today += Number((item.split('_'))[2])
                            // tradesPerDay
                            if (trade.timestamp > 100000) {
                                if (!statistics.trades.plat.spent.spentPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))]) statistics.trades.plat.spent.spentPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] = 0
                                statistics.trades.plat.spent.spentPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] += Number((item.split('_'))[2])
                            }
                        }
                        // items quantity sold
                        if (!item.match('platinum')) {
                            if (!statistics.trades.items.sold[item]) statistics.trades.items.sold[item] = 0
                            statistics.trades.items.sold[item]++
                            // check if full set being sold
                            if (item.match(/_blueprint$/)) {
                                // get list of components
                                var items_in_set:any = {}
                                if (items_list[item]?.items_in_set.length > 0) {
                                    items_list[item].items_in_set.forEach(component => {
                                        if (!component.url_name.match(/_set$/)) {
                                            items_in_set[component.url_name] = {
                                                url_name: component.url_name,
                                                quantity_for_set: component.quantity_for_set,
                                                quantity_traded: 0
                                            }
                                        }
                                    })
                                }
                                // verify all quantities
                                trade.offeringItems.forEach((item1:string) => {
                                    item1 = item1.toLowerCase().replace('_chassis_blueprint', '_chassis').replace('_systems_blueprint', '_systems').replace('_neuroptics_blueprint', '_neuroptics')
                                    items_in_set[item1]? items_in_set[item1].quantity_traded++:false
                                })
                                var setTraded = true
                                for (const key in items_in_set) {
                                    if (items_in_set[key].quantity_traded != items_in_set[key].quantity_for_set)
                                        setTraded = false
                                }
                                if (setTraded) {
                                    var str = item.replace(/_blueprint$/, '_set')
                                    if (!statistics.trades.items.sets_sold[str]) statistics.trades.items.sets_sold[str] = 0
                                    statistics.trades.items.sets_sold[str]++
                                }
                            }
                        }
                    })
                } catch (e) {}
                try {
                    trade.receivingItems.forEach((item:string) => {
                        item = item.toLowerCase().replace('_chassis_blueprint', '_chassis').replace('_systems_blueprint', '_systems').replace('_neuroptics_blueprint', '_neuroptics')
                        if (item.match('platinum')) {
                            // all time
                            statistics.trades.plat.gained.all_time += Number((item.split('_'))[2])
                            // today
                            if (trade.timestamp >= new Date().setHours(0,0,0,0)) statistics.trades.plat.gained.today += Number((item.split('_'))[2])
                            // tradesPerDay
                            if (trade.timestamp > 100000) {
                                if (!statistics.trades.plat.gained.gainedPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))]) statistics.trades.plat.gained.gainedPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] = 0
                                statistics.trades.plat.gained.gainedPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] += Number((item.split('_'))[2])
                            }
                        }
                        // items quantity bought
                        if (!item.match('platinum')) {
                            if (!statistics.trades.items.bought[item]) statistics.trades.items.bought[item] = 0
                            statistics.trades.items.bought[item]++
                        }
                    })
                } catch (e) {}
            }
        })
        //console.log(JSON.stringify(statistics.trades.items.sets_sold))

        // Plat Spent - daily_avg
        var avg = 0
        for (const key in statistics.trades.plat.spent.spentPerDay) {
            avg += statistics.trades.plat.spent.spentPerDay[key]
        }
        statistics.trades.plat.spent.daily_avg = Number((avg / Object.keys(statistics.trades.plat.spent.spentPerDay).length).toFixed(1))
        // Plat Gained - daily_avg
        var avg = 0
        for (const key in statistics.trades.plat.gained.gainedPerDay) {
            avg += statistics.trades.plat.gained.gainedPerDay[key]
        }
        statistics.trades.plat.gained.daily_avg = Number((avg / Object.keys(statistics.trades.plat.gained.gainedPerDay).length).toFixed(1))
        //console.log(JSON.stringify(sortObject(statistics.trades.items.sold)))
        return (
            <React.Fragment>
                <Grid container spacing={2} justifyContent="center">
                    <Grid item xs={4}>
                        <Typography color="inherit" style={{fontSize: '32px'}}>Relics Opened</Typography>
                        <Grid container spacing={2} justifyContent="center">
                            <Grid item xs={4}>
                                <Typography color="inherit" sx={{textDecoration: 'underline'}}>All relics</Typography>
                                <Typography color="inherit">All time: {statistics.relics.opened.total.all_time}</Typography>
                                <Typography color="inherit">Today: {statistics.relics.opened.total.today}</Typography>
                                <Typography color="inherit">Avg: {statistics.relics.opened.total.daily_avg}/day</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography color="inherit" sx={{textDecoration: 'underline'}}>Vaulted relics</Typography>
                                <Typography color="inherit">All time: {statistics.relics.opened.vaulted.all_time}</Typography>
                                <Typography color="inherit">Today: {statistics.relics.opened.vaulted.today}</Typography>
                                <Typography color="inherit">Avg: {statistics.relics.opened.vaulted.daily_avg}/day</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography color="inherit" sx={{textDecoration: 'underline'}}>Tracked relics</Typography>
                                <Typography color="inherit">All time: {statistics.relics.opened.tracked.all_time}</Typography>
                                <Typography color="inherit">Today: {statistics.relics.opened.tracked.today}</Typography>
                                <Typography color="inherit">Avg: {statistics.relics.opened.tracked.daily_avg}/day</Typography>
                            </Grid>
                            <Grid item xs={12}></Grid>
                            <Grid item xs={12}>
                                <Typography color="inherit" sx={{textDecoration: 'underline'}}>Top Relics Opened</Typography>
                                <TableContainer sx={{ maxHeight: 350, maxWidth: 250 }}>
                                    <Table>
                                        <TableHead>
                                        <TableRow>
                                            <TableCell>Relic</TableCell>
                                            <TableCell align="right">Opened</TableCell>
                                        </TableRow>
                                        </TableHead>
                                        <TableBody>
                                        {sortObject(statistics.relics.opened_distr,'opened').map((relic) => (
                                            <TableRow
                                            key={relic.key + '_top_opened'}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                            >
                                            <TableCell component="th" scope="row">
                                                {convertUpper(relic.key.replace('_relic',''))}
                                            </TableCell>
                                            <TableCell align="right">{relic.value}</TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={8}>
                        <Typography color="inherit" style={{fontSize: '32px'}}>Trades</Typography>
                        <Grid container spacing={2} justifyContent="center">
                            <Grid item xs={4}>
                                <Typography color="inherit" sx={{textDecoration: 'underline'}}>Plat Earned</Typography>
                                <Typography color="inherit">All time: {statistics.trades.plat.gained.all_time}p</Typography>
                                <Typography color="inherit">Today: {statistics.trades.plat.gained.today}p</Typography>
                                <Typography color="inherit">Avg: {statistics.trades.plat.gained.daily_avg}p/day</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography color="inherit" sx={{textDecoration: 'underline'}}>Plat Spent</Typography>
                                <Typography color="inherit">All time: {statistics.trades.plat.spent.all_time}p</Typography>
                                <Typography color="inherit">Today: {statistics.trades.plat.spent.today}p</Typography>
                                <Typography color="inherit">Avg: {statistics.trades.plat.spent.daily_avg}p/day</Typography>
                            </Grid>
                            <Grid item xs={4}>
                            </Grid>
                            <Grid item xs={12}></Grid>
                            <Grid item xs={4}>
                                <Typography color="inherit" sx={{textDecoration: 'underline'}}>Top Items sold</Typography>
                                <TableContainer sx={{ maxHeight: 350, maxWidth: 370}}>
                                    <Table>
                                        <TableHead>
                                        <TableRow>
                                            <TableCell>Item</TableCell>
                                            <TableCell align="right">Quantity</TableCell>
                                        </TableRow>
                                        </TableHead>
                                        <TableBody>
                                        {sortObject(statistics.trades.items.sold).map((item:any) => (
                                            <TableRow
                                            key={item.key + '_top_sold'}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                            >
                                            <TableCell component="th" scope="row">
                                                {convertUpper(item.key)}
                                            </TableCell>
                                            <TableCell align="right">{item.value}</TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography color="inherit" sx={{textDecoration: 'underline'}}>Top Items bought</Typography>
                                <TableContainer sx={{ maxHeight: 350, maxWidth: 370 }}>
                                    <Table>
                                        <TableHead>
                                        <TableRow>
                                            <TableCell>Item</TableCell>
                                            <TableCell align="right">Quantity</TableCell>
                                        </TableRow>
                                        </TableHead>
                                        <TableBody>
                                        {sortObject(statistics.trades.items.bought).map((item:any) => (
                                            <TableRow
                                            key={item.key + '_top_bought'}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                            >
                                            <TableCell component="th" scope="row">
                                                {convertUpper(item.key)}
                                            </TableCell>
                                            <TableCell align="right">{item.value}</TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography color="inherit" sx={{textDecoration: 'underline'}}>Top sets sold</Typography>
                                <TableContainer sx={{ maxHeight: 350, maxWidth: 370 }}>
                                    <Table>
                                        <TableHead>
                                        <TableRow>
                                            <TableCell>Set</TableCell>
                                            <TableCell align="right">Quantity</TableCell>
                                        </TableRow>
                                        </TableHead>
                                        <TableBody>
                                        {sortObject(statistics.trades.items.sets_sold).map((item:any) => (
                                            <TableRow
                                            key={item.key + '_top_sets_sold'}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                            >
                                            <TableCell component="th" scope="row">
                                                {convertUpper(item.key)}
                                            </TableCell>
                                            <TableCell align="right">{item.value}</TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
          </React.Fragment>
        )
    }

    render() {
        return (
            <Grid container maxHeight={'90vh'} overflow='auto'>
                <Grid item xs={12} style={{display: 'flex', justifyContent:'flex-end'}}>
                    <TopBar/>
                </Grid>
                <Grid item xs={12}>
                    <CssBaseline />
                    {this.state.update}
                    <this.computeStats />
                </Grid>
            </Grid>
        )
    }
}


interface ITopBarProps {
}
interface ITopBarState {
    alertOpen: boolean
    alertTitle: string,
    alertContent: string
}

class TopBar extends React.Component<ITopBarProps,ITopBarState> {
    constructor(props:any) {
      super(props);
      this.state = {
        alertOpen: false,
        alertTitle: '',
        alertContent: ''
      };
    }
    
    componentDidMount() {
        event.on('importGDPRResponse', (arg) => {
            this.setState({alertOpen: true, alertTitle: arg.message.title, alertContent: arg.message.content})
        })
    }

    handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    render() {
        return (
            <React.Fragment>
                <label htmlFor="gdpr-file">
                    <Input style={{display: 'none'}} id="gdpr-file" type="file" inputProps={{accept: ".txt", multiple: true}} onChange={this.handleFileChange}/>
                    <Button variant="contained" startIcon={<FileDownload />} component="span">
                        Import GDPR
                    </Button>
                </label>
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

export {Statistics}

function getRelicUrl(str:string) {
    str = str.toLowerCase().replace(/ /g,'_')
    return (str.split('_'))[0] + '_' + (str.split('_'))[1] + '_relic'
}

function convertUpper(str:string) {
    return str.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
}

function sortObject(obj:any, key:string = "") {
    var sorted_keys = Object.keys(obj).sort(function(a,b){return key.length > 0 ? obj[b][key]-obj[a][key] : obj[b]-obj[a]})
    var new_arr:Array<any> = []
    sorted_keys.forEach(k => {
        new_arr.push({
            key: k,
            value: key.length > 0 ? obj[k][key] : obj[k]
        })
    })
    return new_arr
}
