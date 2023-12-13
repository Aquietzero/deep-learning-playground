
import * as React from 'react'
import * as echarts from 'echarts'
import * as _ from 'lodash'
import { BSW_MDP } from '@DLPlayground/reinforcement-learning/mdps/bsw'
import { fetchResults } from '../utils'
const mdp = new BSW_MDP()
const gridLength = 80
const margin = 0

const resultsInfo = [{
  file: 'mean-episode-reward-with-exploitation.json',
  name: 'Exploitation',
  el: 'exploitation',
}, {
  file: 'mean-episode-reward-with-exploration.json',
  name: 'Exploration',
  el: 'exploration',
}, {
  file: 'mean-episode-reward-with-epsilon_greedy.json',
  name: 'Epsilon Greedy',
  el: 'epsilon-greedy',
}, {
  file: 'mean-episode-reward-with-linearly_decaying_epsilon_greedy.json',
  name: 'Linearly Decaying Epsilon Greedy',
  el: 'linearly-decaying-epsilon-greedy',
}, {
  file: 'mean-episode-reward-with-exp_decaying_epsilon_greedy.json',
  name: 'EXP Decaying Epsilon Greedy',
  le: 'exp-decaying-epsilon-greedy',
}, {
  file: 'mean-episode-reward-with-optimistic_initialization.json',
  name: 'Optimistic Initialization',
  el: 'optimistic-initialization',
}, {
  file: 'mean-episode-reward-with-softmax.json',
  name: 'Softmax',
  el: 'softmax',
}, {
  file: 'mean-episode-reward-with-upper_confidence_bound.json',
  name: 'Upper Confidence Bound',
  el: 'upper-confidence-bound',
}, {
  file: 'mean-episode-reward-with-thompson_sampling.json',
  name: 'Thompson Sampling',
  el: 'thompson-sampling',
}]

const NArmedBernoulliBandit: React.FC = () => {
  const board = [0, 1, 2]

  React.useEffect(() => {
    fetchResults('n-armed-bandit', resultsInfo).then(results => {
      const chart1 = echarts.init(document.getElementById('mean-episode-reward'))
      const chart2 = echarts.init(document.getElementById('zoom-on-best'))

      chart1.resize({ width: 1200, height: 400 })
      chart2.resize({ width: 1200, height: 400 })

      chart1.setOption({
        grid: {
          right: '20%'
        },
        legend: {
          orient: 'vertical',
          top: 'center',
          right: 0,
          data: _.map(resultsInfo, 'name'),
        },
        title: {
          text: 'Mean Episode Reward',
          x: 'center',
        } as any,
        xAxis: {
          type: 'value',
          min: 30,
        } as any,
        yAxis: { type: 'value' },
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
        series: [..._.map(results, (result: any) => {
          const series: number[] = result.data
          const name: string = result.name
          return {
            type: 'line',
            name,
            tooltip: {
              valueFormatter: (value: any) => value.toFixed(6),
            },
            data: _.map(series, (y, x) => [x.toFixed(0), y]),
            symbol: 'none',
            smooth: true,
            lineStyle: {
              // color: 'black',
            }
          }
        })] as any
      })
      chart2.setOption({
        grid: {
          right: '20%'
        },
        legend: {
          orient: 'vertical',
          top: 'center',
          right: 0,
          data: _.keys(_.omit(_.map(resultsInfo, 'name'), 'Exploitation', 'Exploration')),
        },
        title: {
          text: 'Mean Episode Reward (Zoom on best)',
          x: 'center',
        } as any,
        xAxis: {
          type: 'value',
          min: 1000,
        },
        yAxis: {
          type: 'value',
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
        series: [..._.map(
          _.filter(results, (result: any) => result.name !== 'Exploitation' || result.name !== 'Exploration'), (result: any) => {
          const series: number[] = result.data
          const name: string = result.name
          return {
            type: 'line',
            name,
            tooltip: {
              valueFormatter: (value: any) => value.toFixed(6),
            },
            data: _.map(series, (y, x) => [x.toFixed(0), y]),
            symbol: 'none',
            smooth: true,
            lineStyle: {
              // color: 'black',
            }
          }
        })] as any
      })
    })
  })

  const renderBoard = () => (
    <>
      <div
        className="relative border border-black"
        style={{
          width: 3 * (gridLength + margin) + 2 * margin,
          height: 1 * (gridLength + margin) + 2 * margin,
        }}
      >
        {_.map(board, (id) => {
          return (
            <div
              key={id}
              className="absolute border border-black flex justify-center items-center text-xm"
              style={{
                top: margin,
                left: margin,
                transform: `translateX(${id * (gridLength + margin)}px)`,
                width: gridLength,
                height: gridLength,
                transition: 'transform 0.2s ease',
              }}
            >
              {mdp.isHole(id) && (
                <div className="font-bold text-xl">H</div>
              )}
              {mdp.isGoal(id) && (
                <div className="font-bold text-xl">G</div>
              )}
              {id === 1 && (
                <div className="font-bold text-xl">S</div>
              )}
            </div>
          )}
        )}
      </div>
    </>
  )

  return (
    <div className="flex flex-col">
      <h2 className="mt-10">Two-Armed Bernoulli Bandit</h2>
      <div>{renderBoard()}</div>
      <div className="mt-20" id="mean-episode-reward" />
      <div className="mt-20" id="zoom-on-best" />
    </div>
  )
}

export default {
  description: 'two-armed bernoulli bandit.',
  notCanvas: true,
  run(app: any) {
    return (
      <div className="w-full h-full flex justify-center overflow-scroll">
        <NArmedBernoulliBandit />
      </div>
    )
  },
}
