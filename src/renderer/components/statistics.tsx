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
    Tooltip
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
import {convertUpper,dynamicSort, dynamicSortDesc} from './extras'
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
            }
        }
        var test = 0
        rawStatistics.mission_initialize.forEach((mission:any) => {
            if (mission.status == 'successful') {
                mission.relicEquipped = mission.relicEquipped.toLowerCase()
                mission.timestamp =  String(mission.timestamp).length == 10 ? Number(mission.timestamp)*1000:Number(mission.timestamp)
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

                    if (mission.timestamp) {
                        test = new Date(mission.timestamp).setHours(0,0,0,0)
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
                // 
            }
        })
        // Total - daily_avg
        var avg = 0
        for (const key in statistics.relics.opened.total.runsPerDay) {
            avg += statistics.relics.opened.total.runsPerDay[key].length
        }
        statistics.relics.opened.total.daily_avg = avg / Object.keys(statistics.relics.opened.total.runsPerDay).length
        // Vaulted - daily_avg
        var avg = 0
        for (const key in statistics.relics.opened.vaulted.runsPerDay) {
            avg += statistics.relics.opened.vaulted.runsPerDay[key].length
        }
        statistics.relics.opened.vaulted.daily_avg = avg / Object.keys(statistics.relics.opened.vaulted.runsPerDay).length
        // Tracked - daily_avg
        var avg = 0
        for (const key in statistics.relics.opened.tracked.runsPerDay) {
            avg += statistics.relics.opened.tracked.runsPerDay[key].length
        }
        statistics.relics.opened.tracked.daily_avg = avg / Object.keys(statistics.relics.opened.tracked.runsPerDay).length

        statistics.relics.opened_sorted = Object.keys(statistics.relics.opened_distr).sort(function(a,b){return statistics.relics.opened_distr[b].opened-statistics.relics.opened_distr[a].opened})

        return (
            <React.Fragment>
            <Typography color="inherit">Relics opened</Typography>
            <Typography color="inherit">Total Opened all time: {statistics.relics.opened.total.all_time}</Typography>
            <Typography color="inherit">Total Opened today: {statistics.relics.opened.total.today}</Typography>
            <Typography color="inherit">Total Opened daily avg: {statistics.relics.opened.total.daily_avg}</Typography>
            <Typography color="inherit">Tracked Opened all time: {statistics.relics.opened.tracked.all_time}</Typography>
            <Typography color="inherit">Tracked Opened today: {statistics.relics.opened.tracked.today}</Typography>
            <Typography color="inherit">Tracked Opened daily avg: {statistics.relics.opened.tracked.daily_avg}</Typography>
            <Typography color="inherit">Vaulted Opened all time: {statistics.relics.opened.vaulted.all_time}</Typography>
            <Typography color="inherit">Vaulted Opened today: {statistics.relics.opened.vaulted.today}</Typography>
            <Typography color="inherit">Vaulted Opened daily avg: {statistics.relics.opened.vaulted.daily_avg}</Typography>
            <Typography color="inherit">Top relics opened:{'\r\n'}{statistics.relics.opened_sorted.map(relic => `${relic}: ${statistics.relics.opened_distr[relic].opened}\r\n`)}</Typography>
            <Typography color="inherit">{test}</Typography>
          </React.Fragment>
        )
    }

    render() {
        return (
            <Box>
                {this.state.update}
                <Grid container spacing={4}>
                    <Grid item xs={12}>
                        <Typography>Statistics</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <this.computeStats />
                    </Grid>
                </Grid>
            </Box>
        )
    }
}
export {Statistics}

function getRelicUrl(str:string) {
    str = str.toLowerCase().replace(/ /g,'_')
    return (str.split('_'))[0] + '_' + (str.split('_'))[1] + '_relic'
}