import * as React from 'react'
import * as echarts from 'echarts'
import * as _ from 'lodash'
import { fetchResults } from '../utils'

const resultsInfo = [{
  file: 'state-value-evaluation-with-mc.json',
  name: 'Monte Carlo',
  el: 'mc',
}, {
  file: 'state-value-evaluation-with-td.json',
  name: 'Temporal Difference',
  el: 'td',
}, {
  file: 'state-value-evaluation-with-ntd.json',
  name: 'N-step Temporal Difference',
  el: 'ntd',
}, {
  file: 'state-value-evaluation-with-td-lambda.json',
  name: 'Temporal Difference λ',
  el: 'td-lambda',
}]

const correctStateValue: any = {
  0: 0,
  1: 0.16666666647725262,
  2: 0.33333333304921225,
  3: 0.4999999996211719,
  4: 0.6666666663825456,
  5: 0.8333333331439192,
  6: 0,
}

const byState = (VTrack: number[][]) => {
  const stateValues = _.map(VTrack[0], (stateValue, index) => {
    return _.map(VTrack, V => V[index])
  })
  // remove initial and last state
  stateValues.shift()
  stateValues.pop()
  return stateValues
}

const StateValueEvaluation: React.FC = () => {

  React.useEffect(() => {
    fetchResults('random-walk', resultsInfo).then(results => {
      _.each(results, (result: any) => {
        const data = byState(result.data.VTrack)
        const chart = echarts.init(document.getElementById(result.el))

        chart.resize({ width: 1200, height: 400 })

        chart.setOption({
          grid: {
            right: '20%'
          },
          legend: {
            orient: 'vertical',
            top: 'center',
            right: 0,
            data: _.keys(_.range(result.data.V.length)),
          },
          title: {
            text: result.name,
            x: 'center',
          } as any,
          xAxis: {
            type: 'value',
            min: 30,
          } as any,
          yAxis: {
            type: 'value',
            splitLine: {
              show: true,
            }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              label: {
                formatter: (params: any) => `episode: ${params.value}`
              }
            }
          },
          // dataZoom: [
          //   { show: true, xAxisIndex: [0], realtime: true },
          //   { type: 'inside', xAxisIndex: [0], realtime: true },
          // ],
          series: [..._.map(data, (nState, index) => ({
            type: 'line',
            name,
            tooltip: {
              valueFormatter: (value: any) => value.toFixed(6),
            },
            data: _.map(nState, (y, x) => [x.toFixed(0), y]),
            symbol: 'none',
            smooth: true,
            lineStyle: {
              // color: 'black',
            },
            markLine: {
              symbol: ['none', 'none'],
              data: [
                {
                  yAxis: correctStateValue[index + 1],
                  lineStyle: { type: 'solid', color: '#000' },
                  label: { formatter: `v(s${index+1}) = {c}` },
                  emphasis: { disabled: true },
                },
              ]
            }
          }))] as any
        })
      })
    })
  }, [])
  

  return (
    <div className="flex flex-col">
      <h2 className="mt-10">Random Walk</h2>
      {_.map(resultsInfo, result => <div className="mt-20" id={result.el} />)}
    </div>
  )
}

export default {
  description: 'state value evaluation.',
  notCanvas: true,
  run(app: any) {
    return (
      <div className="w-full h-full flex justify-center overflow-scroll">
        <StateValueEvaluation />
      </div>
    )
  },
}
