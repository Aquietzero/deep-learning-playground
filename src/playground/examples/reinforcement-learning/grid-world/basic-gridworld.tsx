import * as React from 'react'
import * as _ from 'lodash'
import {
  ArrowUpOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowDownOutlined,
  FlagOutlined,
} from '@ant-design/icons'
import { Progress, Button } from 'antd'
import axios from 'axios'
import * as echarts from 'echarts'
import { io } from 'socket.io-client'
import { Panel } from './panel'
import { Events } from '@DLPlayground/core/events'
import { TrainConfig, TestConfig } from '@DLPlayground/types/deep-learning'

const socket = io('http://127.0.0.1:5000')
const modelName = 'random-gridworld-q-learning-target-network'

const BasicGridWorld: React.FC = () => {
  const gridLength = 100
  const margin = 0
  const size = 5
  const board = _.times(size, row => _.times(size, col => row * size + col))
  const [currentState, setCurrentState] = React.useState(0)
  const [map, setMap] = React.useState({} as any)
  const [policy, setPolicy] = React.useState({} as any)
  const [trainingProgress, setTrainingProgress] = React.useState(0)
  const [testProgress, setTestProgress] = React.useState(0)

  const renderBoard = () => (
    <>
      <div
        className="relative border border-black"
        style={{
          width: size * (gridLength + margin) + 2 * margin,
          height: size * (gridLength + margin) + 2 * margin,
        }}
      >
        {_.map(board, (rowContent, row: number) => {
          return (
            <>
              {_.map(board[row], (id, col: number) => {
                return (
                  <div
                    key={id}
                    className="absolute border border-black flex justify-center items-center text-lg text-blue-900"
                    style={{
                      top: margin,
                      left: margin,
                      transform: `translate(${col * (gridLength + margin)}px, ${
                        row * (gridLength + margin)
                      }px)`,
                      width: gridLength,
                      height: gridLength,
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    {id === currentState && <div className="w-5 h-5 rounded-full bg-black"></div>}
                    {map?.[id]?.type === 'goal' && <div className="text-3xl text-red-500"><FlagOutlined /></div>}
                    {map?.[id]?.type === 'pit' && <div className="text-lg font-bold text-black">PIT</div>}
                    {map?.[id]?.type !== 'pit' && map?.[id]?.type !== 'goal' && (
                      <>
                        <div
                          className="absolute flex items-center top-2 left-1/2 -translate-x-1/2"
                          style={{ opacity: policy?.[id]?.q_values[0] }}
                        ><ArrowUpOutlined /></div>
                        <div
                          className="absolute flex items-center right-2 top-1/2 -translate-y-1/2"
                          style={{ opacity: policy?.[id]?.q_values[1] }}
                        ><ArrowRightOutlined /></div>
                        <div
                          className="absolute flex items-center bottom-2 left-1/2 -translate-x-1/2"
                          style={{ opacity: policy?.[id]?.q_values[2] }}
                        ><ArrowDownOutlined /></div>
                        <div
                          className="absolute flex items-center left-2 top-1/2 -translate-y-1/2"
                          style={{ opacity: policy?.[id]?.q_values[3] }}
                        ><ArrowLeftOutlined /></div>
                      </>
                    )}
                  </div>
                )
              })}
            </>
          )
        })}
      </div>
    </>
  )

  const renderChart = () => {
    const losses: number[] = []
    const successRates: number[] = []
    let movingAvgSum = 0;
    const movingAvgWindow: number[] = [];
    const movingAvgSize = 20;
    const chart = echarts.init(document.getElementById('loss'))
    const testChart = echarts.init(document.getElementById('success-rate'))

    chart.resize({ width: 600, height: 300 })
    testChart.resize({ width: 600, height: 300 })

    const defaultOption = (title: string) => ({
      grid: {
        right: '20%'
      },
      title: {
        text: title,
        x: 'center',
      } as any,
      xAxis: {
        type: 'value',
      } as any,
      yAxis: {
        type: 'value',
        splitLine: {
          show: true,
        }
      },
      series: [{
        type: 'line',
        tooltip: {
          valueFormatter: (value: any) => value.toFixed(6),
        },
        data: _.map(losses, (y, x) => [x, y]),
        symbol: 'none',
        smooth: true,
        lineStyle: {
          // color: 'black',
        },
      }] as any
    }) as any

    chart.setOption(defaultOption('Losses'))
    testChart.setOption(defaultOption('Success Rate'))

    socket.on('training_info', (data) => {
      if (losses.length === movingAvgSize) {
        movingAvgSum -= movingAvgWindow.shift()
      }
      movingAvgSum += data.loss
      movingAvgWindow.push(data.loss)

      losses.push(data.loss)
      chart.setOption({
        series: [{
          type: 'line',
          tooltip: {
            valueFormatter: (value: any) => value.toFixed(6),
          },
          data: _.map(losses, (y, x) => [x, y]),
          symbol: 'none',
          smooth: true,
          lineStyle: {
            // color: 'black',
          },
        }] as any
      })
    })

    socket.on('testing_info', (data) => {
      successRates.push(data.success_rate)
      testChart.setOption({
        series: [{
          type: 'line',
          tooltip: {
            valueFormatter: (value: any) => value.toFixed(6),
          },
          data: _.map(successRates, (y, x) => [x, y]),
          symbol: 'none',
          smooth: true,
          lineStyle: {
            // color: 'black',
          },
        }] as any
      })
    })
  }

  const fetchMap = async () => {
    const res = await axios.get('http://127.0.0.1:5000/gridworld/map')
    setMap(res.data.map)
  }

  const train = async (config: TrainConfig) => {
    const res = await axios.post('http://127.0.0.1:5000/gridworld/train', config)
  }

  const getPolicy = async () => {
    const res = await axios.post('http://127.0.0.1:5000/gridworld/model_policy', { modelName })
    setMap(res.data.map)
    setPolicy(res.data.map)
  }

  const test = async (config: TestConfig) => {
    const res = await axios.post('http://127.0.0.1:5000/gridworld/model_test', config)
    setPolicy(res.data.map)
  }

  React.useEffect(() => {
    fetchMap()

    socket.on('connect', () => {
      console.log('connected', socket.id)
    })
    socket.on('progress', (data) => {
      setTrainingProgress(Math.ceil(data.current / data.epochs * 100))
    })
    socket.on('test_progress', (data) => {
      setTestProgress(Math.ceil(data.current / data.num_games * 100))
    })

    Events.on('DL:Train', (config) => train(config))
    Events.on('DL:Test', (config) => test(config))

    renderChart()
  }, [])

  return (
    <div className="">
      <div>{renderBoard()}</div>
      <Button className="mr-2" type="primary" onClick={(e) => getPolicy()}>View Policy</Button>
      <div>Training Progress</div>
      <Progress type="circle" percent={trainingProgress} />
      <div>Test Progress</div>
      <Progress type="circle" percent={testProgress} />
      <div className="mt-20" id="loss" />
      <div className="mt-20" id="success-rate" />
    </div>
  )
}

export default {
  description: 'basic grid world.',
  notCanvas: true,
  panel: Panel,
  run(app: any) {
    return (
      <div className="w-full h-full flex justify-center overflow-scroll">
        <BasicGridWorld />
      </div>
    )
  },
}
