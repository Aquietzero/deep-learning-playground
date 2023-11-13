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
  '0': 0.5420259303701577,
  '1': 0.49880318505265653,
  '2': 0.47069568799146566,
  '3': 0.4568516968914015,
  '4': 0.5584509587312656,
  '5': 0,
  '6': 0.35834807081732667,
  '7': 0,
  '8': 0.5917987435734021,
  '9': 0.6430798238076005,
  '10': 0.6152075570296995,
  '11': 0,
  '12': 0,
  '13': 0.7417204383068661,
  '14': 0.8628374297948584,
  '15': 0
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

const FrozenLakeStateValueEvaluation: React.FC = () => {

  React.useEffect(() => {
    fetchResults('fl', resultsInfo).then(results => {
      _.each(results, (result: any) => {
        const data = byState(result.data.QTrack)
        const chart = echarts.init(document.getElementById(result.el))

        chart.resize({ width: 1400, height: 600 })

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
  description: 'frozen lake state value evaluation.',
  notCanvas: true,
  run(app: any) {
    return (
      <div className="w-full h-full flex justify-center overflow-scroll">
        <FrozenLakeStateValueEvaluation />
      </div>
    )
  },
}
