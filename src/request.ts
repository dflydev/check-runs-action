import * as core from '@actions/core'
import https, {RequestOptions} from 'https'
import {IncomingMessage} from 'http'

export const request = async (
  url: string,
  options: RequestOptions,
  body?: object,
): Promise<object> => {
  return new Promise((resolve, reject) => {
    const req = https
      .request(url, options, (res: IncomingMessage): void => {
        let data = ''
        res.on('data', chunk => {
          core.debug(`Received chunk: ${chunk}`)
          data += chunk
        })

        res.on('end', () => {
          if ((res.statusCode || 400) >= 400) {
            reject(new Error(`Received status code ${res.statusCode}`))
          } else {
            resolve({res, data: JSON.parse(data)})
          }
        })
      })
      .on('error', reject)
    if (body) {
      req.end(JSON.stringify(body))
    } else {
      req.end()
    }
  })
}

export default request
