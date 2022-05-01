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
    ListItem,
    ListItemButton,
    ListItemText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
        vault_status: string
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
    update: boolean,
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
                    bought: {[key: string]: number}
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
                    bought: {}
                }
            }
        }
        rawStatistics.mission_initialize.forEach((mission:any) => {
            if (mission.status == 'successful') {
                mission.relicEquipped = mission.relicEquipped.toLowerCase()
                mission.timestamp = String(mission.timestamp).length == 10 ? Number(mission.timestamp)*1000:Number(mission.timestamp)
                // opened_distr
                if (!statistics.relics.opened_distr[getRelicUrl(mission.relicEquipped)]) statistics.relics.opened_distr[getRelicUrl(mission.relicEquipped)] = {opened: 0}
                statistics.relics.opened_distr[getRelicUrl(mission.relicEquipped)].opened++
                // Total Opened 
                    // all time
                    statistics.relics.opened.total.all_time++
                    // today
                    if (mission.timestamp && mission.timestamp >= new Date().setHours(0,0,0,0)) statistics.relics.opened.total.today++
                    // runsPerDay
                    if (mission.timestamp) {
                        if (!statistics.relics.opened.total.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))]) statistics.relics.opened.total.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))] = []
                        statistics.relics.opened.total.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))].push(mission)
                    }
                // Vaulted Opened
                const vault_status = items_list[getRelicUrl(mission.relicEquipped)]?.vault_status
                if (vault_status == 'V' || vault_status == 'B' || vault_status == 'P') {
                    // all time
                    statistics.relics.opened.vaulted.all_time++
                    // today
                    if (mission.timestamp && mission.timestamp >= new Date().setHours(0,0,0,0)) statistics.relics.opened.vaulted.today++
                    // runsPerDay
                    if (mission.timestamp) {
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
                        if (mission.timestamp && mission.timestamp >= new Date().setHours(0,0,0,0)) statistics.relics.opened.tracked.today++
                        // runsPerDay
                        if (mission.timestamp) {
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
            trade.timestamp = String(trade.timestamp).length == 10 ? Number(trade.timestamp)*1000:Number(trade.timestamp)
            if (trade.status == 'successful' && !trade.deprecated) {
                try {
                    trade.offeringItems.forEach((item:string) => {
                        if (item.toLowerCase().match('platinum')) {
                            // all time
                            statistics.trades.plat.spent.all_time += Number((item.split('_'))[2])
                            // today
                            if (trade.timestamp && trade.timestamp >= new Date().setHours(0,0,0,0)) statistics.trades.plat.spent.today += Number((item.split('_'))[2])
                            // tradesPerDay
                            if (trade.timestamp) {
                                if (!statistics.trades.plat.spent.spentPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))]) statistics.trades.plat.spent.spentPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] = 0
                                statistics.trades.plat.spent.spentPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] += Number((item.split('_'))[2])
                            }
                        }
                        // items quantity sold
                        if (!item.toLowerCase().match('platinum')) {
                            if (!statistics.trades.items.sold[item.toLowerCase()]) statistics.trades.items.sold[item.toLowerCase()] = 0
                            statistics.trades.items.sold[item.toLowerCase()]++
                        }
                    })
                } catch (e) {}
                try {
                    trade.receivingItems.forEach((item:string) => {
                        if (item.toLowerCase().match('platinum')) {
                            // all time
                            statistics.trades.plat.gained.all_time += Number((item.split('_'))[2])
                            // today
                            if (trade.timestamp && trade.timestamp >= new Date().setHours(0,0,0,0)) statistics.trades.plat.gained.today += Number((item.split('_'))[2])
                            // tradesPerDay
                            if (trade.timestamp) {
                                if (!statistics.trades.plat.gained.gainedPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))]) statistics.trades.plat.gained.gainedPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] = 0
                                statistics.trades.plat.gained.gainedPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] += Number((item.split('_'))[2])
                            }
                        }
                        // items quantity bought
                        if (!item.toLowerCase().match('platinum')) {
                            if (!statistics.trades.items.bought[item.toLowerCase()]) statistics.trades.items.bought[item.toLowerCase()] = 0
                            statistics.trades.items.bought[item.toLowerCase()]++
                        }
                    })
                } catch (e) {}
            }
        })
        //console.log(JSON.stringify(statistics.trades))

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
                    <Grid item xs={6}>
                        <Typography color="inherit" style={{fontSize: '32px'}}>Relics</Typography>
                        <Typography color="inherit">Total Opened all time: {statistics.relics.opened.total.all_time}</Typography>
                        <Typography color="inherit">Total Opened today: {statistics.relics.opened.total.today}</Typography>
                        <Typography color="inherit">Total Opened daily avg: {statistics.relics.opened.total.daily_avg}</Typography>
                        <Typography color="inherit">Tracked Opened all time: {statistics.relics.opened.tracked.all_time}</Typography>
                        <Typography color="inherit">Tracked Opened today: {statistics.relics.opened.tracked.today}</Typography>
                        <Typography color="inherit">Tracked Opened daily avg: {statistics.relics.opened.tracked.daily_avg}</Typography>
                        <Typography color="inherit">Vaulted Opened all time: {statistics.relics.opened.vaulted.all_time}</Typography>
                        <Typography color="inherit">Vaulted Opened today: {statistics.relics.opened.vaulted.today}</Typography>
                        <Typography color="inherit">Vaulted Opened daily avg: {statistics.relics.opened.vaulted.daily_avg}</Typography>
                        <Typography color="inherit">Top Relics Opened</Typography>
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
                    <Grid item xs={6}>
                        <Typography color="inherit" style={{fontSize: '32px'}}>Platinum</Typography>
                        <Typography color="inherit">Plat gained all time: {statistics.trades.plat.gained.all_time}</Typography>
                        <Typography color="inherit">Plat gained today: {statistics.trades.plat.gained.today}</Typography>
                        <Typography color="inherit">Plat gained daily avg: {statistics.trades.plat.gained.daily_avg}</Typography>
                        <Typography color="inherit">Plat spent all time: {statistics.trades.plat.spent.all_time}</Typography>
                        <Typography color="inherit">Plat spent today: {statistics.trades.plat.spent.today}</Typography>
                        <Typography color="inherit">Plat spent daily avg: {statistics.trades.plat.spent.daily_avg}</Typography>
                        <Grid container spacing={2} justifyContent="center">
                            <Grid item xs={6}>
                                <Typography color="inherit">Top Items sold</Typography>
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
                            <Grid item xs={6}>
                                <Typography color="inherit">Top Items bought</Typography>
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
                        </Grid>
                    </Grid>
                </Grid>
          </React.Fragment>
        )
    }

    render() {
        return (
            <Box style={{maxHeight: "100vh", overflow: 'auto'}}>
                <CssBaseline />
                {this.state.update}
                <this.computeStats />
            </Box>
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