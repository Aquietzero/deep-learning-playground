import axios from 'axios'
import * as _ from 'lodash'

const resultBase = '/assets/RL-results'

const fetchResult = async (scene: string, data: any) => {
  const res = await axios.get(`${resultBase}/${scene}/${data.file}`)
  return { data: res.data, ...data }
}

export const fetchResults = async (scene: string, results: any) => {
  return Promise.all(_.map(results, (result) => fetchResult(scene, result)))
}
