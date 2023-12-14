import * as React from 'react'
import * as _ from 'lodash'
import {
  ArrowUpOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowDownOutlined,
  FlagOutlined,
} from '@ant-design/icons'
import { Button, Tabs, Tooltip } from 'antd'
import axios from 'axios'
import { io } from 'socket.io-client'
import { Panel } from './panel'
import { Events } from '@DLPlayground/core/events'
import { TrainConfig, TestConfig, EnvParams } from '@DLPlayground/types/deep-learning'
import { TrainingBoard } from './training-board'
import { TestBoard } from './test-board'

const socket = io('http://127.0.0.1:5000')

const BasicGridWorld: React.FC = () => {
  const gridLength = 100
  const margin = 0
  const [modelName, setModelName] = React.useState('random-gridworld-q-learning-target-network-5-3')
  const [size, setSize] = React.useState(5)
  const [pits, setPits] = React.useState(3)
  const [board, setBoard] = React.useState([])
  const [currentState, setCurrentState] = React.useState(0)
  const [map, setMap] = React.useState({} as any)
  const [policy, setPolicy] = React.useState({} as any)
  const [path, setPath] = React.useState([] as any)
  const [currentTab, setCurrentTab] = React.useState('train')

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
                      background: _.includes(path, Number(id)) ? '#ddd' : 'white',
                    }}
                  >
                    {id === currentState && <div className="w-5 h-5 rounded-full bg-black"></div>}
                    {map?.[id]?.type === 'goal' && <div className="text-3xl text-red-500"><FlagOutlined /></div>}
                    {map?.[id]?.type === 'pit' && <div className="text-lg font-bold text-black">PIT</div>}
                    {map?.[id]?.type !== 'pit' && map?.[id]?.type !== 'goal' && (
                      <>
                        <div
                          className="absolute flex items-center top-2 left-1/2 -translate-x-1/2"
                          style={{ opacity: policy?.[id]?.q_values[0] / Math.max(...(policy?.[id]?.q_values || [])) }}
                        >
                          <Tooltip placement="top" title={policy?.[id]?.q_values[0]?.toFixed(8)}>
                            <ArrowUpOutlined />
                          </Tooltip>
                        </div>
                        <div
                          className="absolute flex items-center right-2 top-1/2 -translate-y-1/2"
                          style={{ opacity: policy?.[id]?.q_values[1] / Math.max(...(policy?.[id]?.q_values || [])) }}
                        >
                          <Tooltip placement="right" title={policy?.[id]?.q_values[1]?.toFixed(8)}>
                            <ArrowRightOutlined />
                          </Tooltip>
                        </div>
                        <div
                          className="absolute flex items-center bottom-2 left-1/2 -translate-x-1/2"
                          style={{ opacity: policy?.[id]?.q_values[2] / Math.max(...(policy?.[id]?.q_values || [])) }}
                        >
                          <Tooltip placement="bottom" title={policy?.[id]?.q_values[2]?.toFixed(8)}>
                            <ArrowDownOutlined />
                          </Tooltip>
                        </div>
                        <div
                          className="absolute flex items-center left-2 top-1/2 -translate-y-1/2"
                          style={{ opacity: policy?.[id]?.q_values[3] / Math.max(...(policy?.[id]?.q_values) || []) }}
                        >
                          <Tooltip placement="left" title={policy?.[id]?.q_values[3]?.toFixed(8)}>
                            <ArrowLeftOutlined />
                          </Tooltip>
                        </div>
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

  const fetchMap = React.useCallback(async () => {
    const res = await axios.post('http://127.0.0.1:5000/gridworld/map', {
      size, pits, mode: 'random',
    })
    setMap(res.data.map)
  }, [size, pits])

  const train = async (config: TrainConfig) => {
    const res = await axios.post('http://127.0.0.1:5000/gridworld/train', config)
  }

  const getPolicy = React.useCallback(async () => {
    const res = await axios.post('http://127.0.0.1:5000/gridworld/model_policy', {
      model_name: modelName,
      env_params: { size, pits, mode: 'random' }
    })
    setMap(res.data.map)
    setPolicy(res.data.map)
    setPath(res.data.result?.path)
  }, [size, pits, modelName])

  const test = async (config: TestConfig) => {
    const res = await axios.post('http://127.0.0.1:5000/gridworld/model_test', config)
    setPolicy(res.data.map)
  }

  const updateBoard = React.useCallback(() => {
    setBoard(_.times(size, row => _.times(size, col => row * size + col)))
  }, [size])

  React.useEffect(() => {
    fetchMap()
    setBoard(_.times(size, row => _.times(size, col => row * size + col)))

    socket.on('connect', () => {
      console.log('connected', socket.id)
    })

    Events.on('DL:Train', (config) => {
      setCurrentTab('train')
      train(config)
    })
    Events.on('DL:Test', (config) => {
      setCurrentTab('test')
      test(config)
    })
    Events.on('DL:Env:size', (size) => {
      setSize(size)
    })
    Events.on('DL:Env:pits', (pits) => {
      setPits(pits)
    })
    Events.on('DL:Env:modelName', (name) => {
      setModelName(name)
    })
  }, [])

  React.useEffect(() => {
    fetchMap()
    updateBoard()
  }, [pits, size])

  return (
    <div className="">
      <div>{renderBoard()}</div>
      <Button className="mr-2" type="primary" onClick={(e) => getPolicy()}>View Policy</Button>
      <Tabs
        activeKey={currentTab}
        onChange={(key) => setCurrentTab(key)}
      >
        <Tabs.TabPane tab="Training Board" key="train">
          <TrainingBoard />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Test Board" key="test">
          <TestBoard />
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}

export default {
  description: 'basic grid world.',
  notCanvas: true,
  panel: Panel,
  run(app: any) {
    return (
      <div
        className="w-full h-full overflow-scroll"
        style={{
          paddingTop: 100,
          paddingLeft: 300,
        }}
      >
        <BasicGridWorld />
      </div>
    )
  },
}
