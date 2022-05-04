import axios from 'axios'
import {Pool} from 'pg'
import tokens from './tokens.json'

export default async () => {
    return new Promise((resolve,reject) => {
        axios('https://api.heroku.com/apps/relic-bot-ds/config-vars', {headers: {Accept: 'application/vnd.heroku+json; version=3',Authorization: 'Bearer ' + tokens.heroku}}).then(res => {
            const pool = new Pool({
                connectionString: res.data.DATABASE_URL,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
                ssl: { rejectUnauthorized: false }
            })
            resolve(pool)
        }).catch(err => {
            reject(err)
        })
    })
}