import * as React from 'react'
import * as echarts from 'echarts'
import * as _ from 'lodash'
import { fetchResults } from '../utils'

const resultsInfo = [{
  file: 'state-value-evaluation-with-mc.json',
  name: 'Monte Carlo',
  el: 'mc',
}, {
  file: 'state-value-evaluation-with-sarsa.json',
  name: 'SARSA',
  el: 'sarsa',
}, {
  file: 'state-value-evaluation-with-q.json',
  name: 'Q Learning',
  el: 'q',
}, {
  file: 'state-value-evaluation-with-double-q.json',
  name: 'Double Q Learning',
  el: 'double-q',
}, {
  file: 'state-value-evaluation-with-sarsa-lambda.json',
  name: 'SARSA(λ)',
  el: 'sarsa-lambda',
}, {
  file: 'state-value-evaluation-with-q-lambda.json',
  name: 'Q(λ)',
  el: 'q-lambda',
}, {
  file: 'state-value-evaluation-with-dyna-q.json',
  name: 'dyna Q',
  el: 'dyna-q',
}, {
  file: 'state-value-evaluation-with-trajectory-sampling.json',
  name: 'trajectory sampling',
  el: 'trajectory-sampling',
}]

const correctStateValue: any = {
  0: 0,
  1: 0.5637385603297012,
  2: 0.7630400717021056,
  3: 0.8448888599241188,
  4: 0.889240251264577,
  5: 0.9219884979713453,
  6: 0.9515306105078061,
  7: 0.9806008219867679,
  8: 0
}

const byState = (QTrack: number[][][]) => {
  const stateValues = _.map(QTrack[0], (stateActionValue, index) => {
    return _.map(QTrack, stateActionValue => _.max(stateActionValue[index]))
  })
  // remove initial and last state
  stateValues.shift()
  stateValues.pop()
  return stateValues
}

const StateValueEvaluation: React.FC = () => {

  React.useEffect(() => {
    fetchResults('sws', resultsInfo).then(results => {
      _.each(results, (result: any) => {
        const data = byState(result.data.QTrack)
        const chart = echarts.init(document.getElementById(result.el))

        chart.resize({ width: 1200, height: 500 })

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
  })

  return (
    <div className="flex flex-col">
      <h2 className="mt-10">Slippery Walk Seven</h2>
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
