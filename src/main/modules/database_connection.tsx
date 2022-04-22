import axios from 'axios'
import {Pool} from 'pg'

export default async () => {
    return new Promise((resolve,reject) => {
        axios('https://api.heroku.com/apps/relic-bot-ds/config-vars', {headers: {Accept: 'application/vnd.heroku+json; version=3',Authorization: (process.env.HEROKU_TOKEN as string)}}).then(res => {
            const pool = new Pool({
                connectionString: res.data.DATABASE_URL,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
                ssl: { rejectUnauthorized: false }
            })
            resolve(pool)
        }).catch(err => {
            reject(err)
        })
    })
}