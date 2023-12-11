import * as React from 'react'
import * as _ from 'lodash'
import {
  ArrowUpOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { Progress } from 'antd'
import axios from 'axios'
import * as echarts from 'echarts'
import { io } from 'socket.io-client'

const socket = io('http://127.0.0.1:5000')

const BasicGridWorld: React.FC = () => {
  const gridLength = 100
  const margin = 0
  const size = 4
  const board = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
    [12, 13, 14, 15],
  ]
  const [currentState, setCurrentState] = React.useState(0)
  const [map, setMap] = React.useState({} as any)
  const [trainingProgress, setTrainingProgress] = React.useState(0)

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
                    className="absolute border border-black flex justify-center items-center text-xm"
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
                    {map?.[id]?.type === 'goal' && <div className="text-lg">GOAL</div>}
                    {map?.[id]?.type === 'hole' && <div className="text-lg">HOLE</div>}
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
    let movingAvgSum = 0;
    const movingAvgWindow: number[] = [];
    const movingAvgSize = 50;
    const chart = echarts.init(document.getElementById('loss'))

    chart.resize({ width: 600, height: 300 })

    chart.setOption({
      grid: {
        right: '20%'
      },
      title: {
        text: 'losses',
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
    })

    socket.on('training_info', (data) => {
      if (losses.length === movingAvgSize) {
        movingAvgSum -= movingAvgWindow.shift()
      }
      movingAvgSum += data.loss
      movingAvgWindow.push(data.loss)

      losses.push(movingAvgSum / movingAvgWindow.length)
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
  }

  const step = async (action: number) => {
    const res = await axios.post('http://127.0.0.1:5000/gridworld/step', {
        state: currentState,
        action: action,
    })
    setCurrentState(res.data.next_state)
  }

  const fetchMap = async () => {
    const res = await axios.get('http://127.0.0.1:5000/gridworld/map')
    setMap(res.data.map)
  }

  const train = async () => {
    const res = await axios.get('http://127.0.0.1:5000/gridworld/train')
    console.log(res)
  }


  React.useEffect(() => {
    fetchMap()

    socket.on('connect', () => {
      console.log('connected', socket.id)
    })
    socket.on('progress', (data) => {
      setTrainingProgress(data.current / data.epochs)
    })

    renderChart()
  }, [])

  return (
    <div className="flex flex-col">
      <div>{renderBoard()}</div>
      <div onClick={(e) => step(0)}>up</div>
      <div onClick={(e) => step(1)}>right</div>
      <div onClick={(e) => step(2)}>down</div>
      <div onClick={(e) => step(3)}>left</div>
      <div onClick={(e) => train()}>train</div>
      <Progress percent={Math.ceil(trainingProgress * 100)} />
      <div className="mt-20" id="loss" />
    </div>
  )
}

export default {
  description: 'basic grid world.',
  notCanvas: true,
  run(app: any) {
    return (
      <div className="w-full h-full flex justify-center overflow-scroll">
        <BasicGridWorld />
      </div>
    )
  },
}
