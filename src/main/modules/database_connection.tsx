import axios from 'axios'
import {Pool} from 'pg'

export default async () => {
    return new Promise((resolve,reject) => {
        axios('https://api.heroku.com/apps/relic-bot-ds/config-vars', {headers: {Accept: 'application/vnd.heroku+json; version=3',Authorization: 'Bearer e0d5c3d4-4803-4895-8f9e-cd181464b013'}}).then(res => {
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