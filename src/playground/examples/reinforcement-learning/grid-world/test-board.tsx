import * as React from 'react'
import * as _ from 'lodash'
import { Progress, Button } from 'antd'
import * as echarts from 'echarts'
import { socket } from '@DLPlayground/core/socket'

interface Props {}

export const TestBoard: React.FC<Props> = (props: Props) => {
  const [testProgress, setTestProgress] = React.useState(0)

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
    tooltip: {
      trigger: 'axis',
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

  React.useLayoutEffect(() => {
    const successRates: number[] = []
    const chart = echarts.init(document.getElementById('test-success-rate'))
    chart.setOption(defaultOption(successRates, 'Success Rate'))

    socket.on('test_progress', (data) => {
      setTestProgress(Math.ceil(data.current / data.num_games * 100))
    })

    socket.on('testing_info', (data) => {
      successRates.push(data.success_rate)
      chart.setOption({
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
  }, [])

  return (
    <div>
      <div
        className="mt-20"
        id="test-success-rate"
        style={{ width: 800, height: 400 }}
      />
      <Progress type="circle" percent={testProgress} />
    </div>
  )
}