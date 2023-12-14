import * as _ from 'lodash'
import * as React from 'react'
import { Drawer, Tooltip, Input, Radio, Space, Button, InputNumber } from 'antd'
import { Events } from '@DLPlayground/core/events'

interface Props {}

export const Panel: React.FC<Props> = (props: Props) => {
  const [modelName, setModelName] = React.useState('random-gridworld-q-learning-target-network-5-3')

  // env config
  const [size, setSize] = React.useState(5)
  const [pits, setPits] = React.useState(3)
  const [mode, setMode] = React.useState('random')

  // train config
  const [epochs, setEpochs] = React.useState(2000)
  const [learningRate, setLearningRate] = React.useState(1e-3)
  const [batchSize, setBatchSize] = React.useState(200)
  const [gamma, setGamma] = React.useState(0.9)
  const [epsilon, setEpsilon] = React.useState(0.3)

  // test config
  const [episodes, setEpisodes] = React.useState(1000)

  const train = () => {
    Events.emit('DL:Train', {
      model_name: modelName,
      env_params: {
        size,
        mode,
      },
      train_params: {
        epochs, 
        learning_rate: learningRate,
        batch_size: batchSize,
        gamma,
        epsilon,
      }
    })
  }

  const test = () => {
    Events.emit('DL:Test', {
      model_name: modelName,
      env_params: {
        size,
        mode,
      },
      test_params: {
        episodes, 
      }
    })
  }

  return (
    <Drawer
      title="GridWorld Q Learning"
      placement="right"
      visible={true}
      mask={false}
      closable={false}
    >
      {/* model info */}
      <div className="text-lg mt-5 font-bold">Model</div>
      <div className="my-2 flex flex-col">
        <div>Name</div>
        <Input
          value={modelName}
          onChange={(e: any) => {
            setModelName(e.target.value)
            Events.emit('DL:Env:modelName', e.target.value)
          }}
        />
      </div>

      {/* env config */}
      <div className="text-lg mt-5 font-bold">Environment Configs</div>
      <div className="my-2 flex items-center justify-between">
        <div>Grid Size</div>
        <InputNumber
          min={4}
          max={10}
          value={size}
          onChange={(v) => {
            setSize(v)
            Events.emit('DL:Env:size', v)
          }}
        />
      </div>
      <div className="my-2 flex items-center justify-between">
        <div>Number of Pits</div>
        <InputNumber
          min={2}
          max={10}
          value={pits}
          onChange={(v) => {
            setPits(v)
            Events.emit('DL:Env:pits', v)
          }}
        />
      </div>
      <div className="my-2 flex flex-col">
        <div className="mb-2">Mode</div>
        <Radio.Group
          onChange={e => {
            setMode(e.target.value)
            Events.emit('DL:Env:Configs', { mode: e.target.value })
          }}
          value={mode}
        >
          <Space direction="vertical">
            {_.map(['random', 'static'], m => <Radio value={m}>{ m }</Radio>)}
          </Space>
        </Radio.Group>
      </div>

      {/* train config */}
      <div className="text-lg mt-5 font-bold">Train Configs</div>
      <div className="my-2 flex items-center justify-between">
        <div>Epochs</div>
        <InputNumber min={0} value={epochs} onChange={(v) => setEpochs(v)} />
      </div>
      <div className="my-2 flex items-center justify-between">
        <div>Learning Rate</div>
        <InputNumber min={0} max={1} step={0.0001} value={learningRate} onChange={(v) => setLearningRate(v)} />
      </div>
      <div className="my-2 flex items-center justify-between">
        <div>Batch Size</div>
        <InputNumber min={0} value={batchSize} onChange={(v) => setBatchSize(v)} />
      </div>
      <div className="my-2 flex items-center justify-between">
        <Tooltip placement="left" title="Discount factor of rewards">
          <div>Gamma</div>
        </Tooltip>
        <InputNumber min={0} max={1} step={0.01} value={gamma} onChange={(v) => setGamma(v)} />
      </div>
      <div className="my-2 flex items-center justify-between">
        <Tooltip placement="left" title="Exploaration factor">
          <div>Epsilon</div>
        </Tooltip>
        <InputNumber min={0} max={1} step={0.01} value={epsilon} onChange={(v) => setEpsilon(v)} />
      </div>
      <div className="my-2">
        <Button type="primary" onClick={e => train()}>Train</Button>
      </div>

      {/* test config */}
      <div className="text-lg mt-5 font-bold">Test Configs</div>
      <div className="my-2 flex items-center justify-between">
        <div>Episodes</div>
        <InputNumber min={0} value={episodes} onChange={(v) => setEpisodes(v)} />
      </div>
      <div className="my-2">
        <Button type="primary" onClick={e => test()}>Test</Button>
      </div>
    </Drawer>
  )
}
