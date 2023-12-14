import * as React from 'react'
import * as _ from 'lodash'
import { Progress, Button } from 'antd'
import * as echarts from 'echarts'

import { socket } from '@DLPlayground/core/socket'

interface Props {}

export const TrainingBoard: React.FC<Props> = (props: Props) => {
  const [trainingProgress, setTrainingProgress] = React.useState(0)

  const defaultOption = (data: any, title: string) => ({
    title: {
      text: title,
      x: 'left',
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
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        label: {
          formatter: (params: any) => `episode: ${params.value}`
        }
      }
    },
    series: [{
      type: 'line',
      tooltip: {
        valueFormatter: (value: any) => value.toFixed(6),
      },
      data: _.map(data, (y, x) => [x, y]),
      symbol: 'none',
      smooth: true,
      lineStyle: {
        // color: 'black',
      },
    }] as any
  }) as any

  React.useEffect(() => {
    const losses: number[] = []
    let movingAvgSum = 0
    const movingAvgWindow: number[] = []
    const movingAvgSize = 20

    const chart = echarts.init(document.getElementById('loss'))
    chart.setOption(defaultOption(losses, 'Training Loss'))

    socket.on('progress', (data) => {
      setTrainingProgress(Math.ceil(data.current / data.epochs * 100))
    })

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
  }, [])

  return (
    <div>
      <div
        className="mt-20"
        id="loss"
        style={{ width: 800, height: 400 }}
      />
      <Progress type="circle" percent={trainingProgress} />
    </div>
  )
}