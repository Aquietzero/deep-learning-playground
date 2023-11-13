import * as React from 'react'
import { Slider, InputNumber, Row, Col } from 'antd'

interface SliderInputProps {
  label: string
  value: number
  setValue: any
  step?: number
  min?: number
  max?: number
}

export const SliderInput: React.FC<SliderInputProps> = (props: SliderInputProps) => {
  const { label, value, setValue, min = 1, max = 10, step = 0.01 } = props

  return (
    <Row className="flex items-center py-1">
      <Col span={3}>
        { label }
      </Col>
      <Col span={14}>
        <Slider
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={setValue}
        />
      </Col>
      <Col span={7}>
        <InputNumber
          min={min}
          max={max}
          step={step}
          style={{ margin: '0 16px' }}
          value={value}
          onChange={setValue}
        />
      </Col>
    </Row>
  )
}

