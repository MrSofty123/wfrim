import {event} from '../eventHandler'

var config = {}

event.on('configFetch', (data:any) => {
    if (typeof data == 'string')
        data = JSON.parse(data)
    config = data
    event.emit('configFetchComplete',null)
})

export {
    config
}