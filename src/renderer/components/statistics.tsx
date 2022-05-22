import {
    Button,
    Dialog,
    DialogTitle, 
    DialogContent,
    DialogContentText,
    DialogActions,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CssBaseline,
    Input,
    TextField,
    IconButton,
} from '@mui/material';
import {
    RestartAlt,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React from 'react';
import {event} from '../eventHandler'

/********   chart.js  *******/
import { Chart } from 'react-chartjs-2';
import faker from 'faker';
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
} from 'chart.js';
ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip
);
/***************************/

event.on('statisticsFetch', (data:any) => {
    statistics = typeof data == 'object' ? data:JSON.parse(data)
    event.emit('updateStatistics')
})

interface Istatistics {
    relics: {
        opened: {
            total: {
                all_time: number,
                today: number,
                daily_avg: number
                runsPerDay: {[key: string]: Array<object>},
                runsDistr: Array<{
                    timestamp: Date,
                    total: number,
                    moving_avg: number,
                    avg: number,
                }>
            },
            vaulted: {
                all_time: number,
                today: number,
                daily_avg: number
                runsPerDay: {[key: string]: Array<object>},
                runsDistr: Array<{
                    timestamp: Date,
                    total: number,
                    moving_avg: number,
                    avg: number,
                }>
            },
            tracked: {
                all_time: number,
                today: number,
                daily_avg: number
                runsPerDay: {[key: string]: Array<object>},
                runsDistr: Array<{
                    timestamp: Date,
                    total: number,
                    moving_avg: number,
                    avg: number,
                }>
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
                runsPerDay: {},
                runsDistr: []
            },
            vaulted: {
                all_time: 0,
                today: 0,
                daily_avg: 0,
                runsPerDay: {},
                runsDistr: []
            },
            tracked: {
                all_time: 0,
                today: 0,
                daily_avg: 0,
                runsPerDay: {},
                runsDistr: []
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

interface IStatisticsProps {
}
interface IStatisticsState {
    update: boolean,
    startDate: Date,
    endDate: Date
}

class Statistics extends React.Component<IStatisticsProps,IStatisticsState> {
    constructor(props:any) {
      super(props);
      this.state = {
        update: false,
        startDate: new Date(1364169600000),
        endDate: new Date(new Date().setHours(0,0,0,0))
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

    componentWillUnmount() {
        console.log('*************unmounting statistics*******************')
    }

    componentDidUpdate() {
        console.log('*************updating statistics*******************')
    }

    statCharts = () => {
        function stepFunc(start:number, step:number, end:number) {
            const arrayLength = Math.floor(((end - start) / step)) + 1;
            const range = [...Array(arrayLength).keys()].map(x => (x * step) + start);
            return range
        }
        const dayDistr = stepFunc(this.state.endDate.setHours(0,0,0,0) - 7776000000, 86400000, this.state.endDate.setHours(0,0,0,0))
        var movingAvg:Array<number> = []
        var totalRuns:Array<number> = []
        var avg:Array<number> = []
        statistics.relics.opened.total.runsDistr.forEach((key) => {
            if (dayDistr.includes(new Date(key.timestamp).getTime())) {
                movingAvg.push(key.moving_avg)
                totalRuns.push(key.total)
                avg.push(key.avg)
            }
        })
        // pad zeros if unequal length
        if (movingAvg.length < dayDistr.length) {
            var n = dayDistr.length - movingAvg.length
            while (n > 0) {
                movingAvg.unshift(0)
                totalRuns.unshift(0)
                avg.unshift(0)
                n--
            }
        }
        /*
        dayDistr.map((key) => {
            if (statistics.relics.opened.total.runsPerDay[key]) lineData.push(((lineData.length > 0 ? lineData[lineData.length - 1]:0) + statistics.relics.opened.total.runsPerDay[key].length) / 2)
            else lineData.push(lineData.length > 0 ? lineData[lineData.length - 1]:0)
        })
        */
        //console.log(JSON.stringify(lineData))
        const labels = dayDistr.map((key) => new Date(key).toLocaleString('default', {month: "short"}) + ' ' + new Date(key).getDate())
        const data = {
            labels,
            datasets: [
                {
                  type: 'line' as const,
                  label: 'Avg',
                  borderColor: '#f54245',
                  borderWidth: 2,
                  fill: false,
                  data: avg,
                },{
                  type: 'line' as const,
                  label: 'Moving Avg',
                  borderColor: '#a85c32',
                  borderWidth: 2,
                  fill: false,
                  data: movingAvg,
                },{
                    type: 'bar' as const,
                    label: 'Total Runs',
                    data: totalRuns,
                    backgroundColor: '#757ce8',
                },
            ],
        };
        return (
            <React.Fragment>
                <Chart type='bar' data={data} height='60px'/>
             </React.Fragment>
        )
    }

    render() {
        return (
            <Grid container maxHeight={'90vh'} overflow='auto'>
                <Grid item xs={12}>
                    <CssBaseline />
                    {this.state.update}
                    <Grid container spacing={2} justifyContent="center">
                        <Grid item xs={4}>
                            <Typography color="inherit" style={{fontSize: '32px'}}>Relics Opened</Typography>
                            <Grid container spacing={2} justifyContent="center">
                                <Grid item xs={4}>
                                    <Typography color="inherit" sx={{textDecoration: 'underline'}}>All relics</Typography>
                                    <Typography color="inherit">Total: {statistics.relics.opened.total.all_time}</Typography>
                                    <Typography color="inherit">Today: {statistics.relics.opened.total.today}</Typography>
                                    <Typography color="inherit">Avg: {statistics.relics.opened.total.daily_avg}/day</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography color="inherit" sx={{textDecoration: 'underline'}}>Vaulted relics</Typography>
                                    <Typography color="inherit">Total: {statistics.relics.opened.vaulted.all_time}</Typography>
                                    <Typography color="inherit">Today: {statistics.relics.opened.vaulted.today}</Typography>
                                    <Typography color="inherit">Avg: {statistics.relics.opened.vaulted.daily_avg}/day</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography color="inherit" sx={{textDecoration: 'underline'}}>Tracked relics</Typography>
                                    <Typography color="inherit">Total: {statistics.relics.opened.tracked.all_time}</Typography>
                                    <Typography color="inherit">Today: {statistics.relics.opened.tracked.today}</Typography>
                                    <Typography color="inherit">Avg: {statistics.relics.opened.tracked.daily_avg}/day</Typography>
                                </Grid>
                                <Grid item xs={12}></Grid>
                                <Grid item xs={12}>
                                    <Typography color="inherit" sx={{textDecoration: 'underline'}}>Top Relics Opened</Typography>
                                    <TableContainer sx={{ maxHeight: 270, maxWidth: 250 }}>
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
                            <Grid container spacing={2} justifyContent="center">
                                <Grid item xs={2}>
                                    <Typography color="inherit" style={{fontSize: '32px'}}>Trades</Typography>
                                </Grid>
                                <Grid item xs={10} style={{display: 'flex', justifyContent:'flex-end'}}>
                                    <Grid container justifyContent="right" style={{marginTop: '10px'}}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DatePicker
                                                label="From"
                                                value={this.state.startDate}
                                                onChange={(newValue: Date | null) => {
                                                    newValue = new Date((newValue as Date).setHours(0,0,0,0))
                                                    this.setState({startDate: newValue as Date}, () => {
                                                        event.emit('statisticsDateUpdate', {startDate: this.state.startDate, endDate: new Date(this.state.endDate).getTime() == new Date().setHours(0,0,0,0) ? null : this.state.endDate})
                                                    })
                                                }}
                                                renderInput={(params) => <TextField size="small" sx={{width: '150px'}} {...params} />}
                                            />
                                        </LocalizationProvider>
                                        <Typography color="inherit" style={{fontSize: '18px', paddingRight: '10px', paddingLeft: '10px', paddingTop: '5px'}}>-</Typography>
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DatePicker
                                                label="To"
                                                value={this.state.endDate}
                                                onChange={(newValue: Date | null) => {
                                                    newValue = new Date((newValue as Date).setHours(0,0,0,0))
                                                    this.setState({endDate: newValue as Date}, () => {
                                                        event.emit('statisticsDateUpdate', {startDate: this.state.startDate, endDate: new Date(this.state.endDate).getTime() == new Date().setHours(0,0,0,0) ? null : this.state.endDate})
                                                    })
                                                }}
                                                renderInput={(params) => <TextField size="small" sx={{width: '150px'}} {...params} />}
                                            />
                                        </LocalizationProvider>
                                        <IconButton 
                                        aria-label="reset" 
                                        color= {(new Date(this.state.startDate).getTime() == 1364169600000 && new Date(this.state.endDate).getTime() == new Date().setHours(0,0,0,0)) ? "inherit" : "primary"}
                                        onClick={() => {
                                            this.setState({startDate: new Date(1364169600000),endDate: new Date(new Date().setHours(0,0,0,0))}, () => {
                                                event.emit('statisticsDateUpdate', {startDate: this.state.startDate, endDate: new Date(this.state.endDate).getTime() == new Date().setHours(0,0,0,0) ? null : this.state.endDate})
                                            })
                                        }} 
                                        style={{boxShadow:"none",marginRight: '5px',marginLeft: '5px'}}>
                                            <RestartAlt />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid container spacing={2} justifyContent="center">
                                <Grid item xs={4}>
                                    <Typography color="inherit" sx={{textDecoration: 'underline'}}>Plat Earned</Typography>
                                    <Typography color="inherit">Total: {statistics.trades.plat.gained.all_time}p</Typography>
                                    <Typography color="inherit">Today: {statistics.trades.plat.gained.today}p</Typography>
                                    <Typography color="inherit">Avg: {statistics.trades.plat.gained.daily_avg}p/day</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography color="inherit" sx={{textDecoration: 'underline'}}>Plat Spent</Typography>
                                    <Typography color="inherit">Total: {statistics.trades.plat.spent.all_time}p</Typography>
                                    <Typography color="inherit">Today: {statistics.trades.plat.spent.today}p</Typography>
                                    <Typography color="inherit">Avg: {statistics.trades.plat.spent.daily_avg}p/day</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                </Grid>
                                <Grid item xs={12}></Grid>
                                <Grid item xs={4}>
                                    <Typography color="inherit" sx={{textDecoration: 'underline'}}>Top Items sold</Typography>
                                    <TableContainer sx={{ maxHeight: 270, maxWidth: 370}}>
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
                                    <TableContainer sx={{ maxHeight: 270, maxWidth: 370 }}>
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
                                    <TableContainer sx={{ maxHeight: 270, maxWidth: 370 }}>
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
                        <Grid item xs={12}>
                            <this.statCharts/>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        )
    }
}

/*
function getRelicUrl(str:string) {
    str = str.toLowerCase().replace(/ /g,'_')
    return (str.split('_'))[0] + '_' + (str.split('_'))[1] + '_relic'
}*/

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

export default React.memo(Statistics)