import * as React from 'react'
import * as _ from 'lodash'
import {
  ArrowUpOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import {
  policyIterationGenerator,
} from '@DLPlayground/reinforcement-learning/policy'
import { FL_MDP } from '@DLPlayground/reinforcement-learning/mdps/fl'

const size = 10
const mdp = new FL_MDP(size)
  const gridLength = 80
  const margin = 0

const FrozenLakePolicyIteration: React.FC = () => {
  const [gen, setGen] = React.useState<any>()
  const [ctx, setCtx] = React.useState<any>()
  const [isDone, setIsDone] = React.useState(false)
  const [successRate, setSuccessRate] = React.useState(0)
  const board = _.map(_.range(size), (row) => {
    return _.range(row * size, row * size + size)
  })

  React.useLayoutEffect(() => {
    const gen = policyIterationGenerator(mdp, 0.99)
    const next = gen.next()
    setGen(gen)
    setCtx(next.value)
  }, [])

  const optimize = () => {
    if (isDone) return

    const next = gen.next()
    setCtx(next.value)

    if (next.done) {
        setIsDone(true)
        setSuccessRate(ctx.policy.successRate(mdp))
    }
  }

  const renderBoard = (policy: any, V: any) => (
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
                    {mdp.isHole(id) && (
                      <div className="font-bold text-lg w-10 h-10 bg-black" />
                    )}
                    {mdp.isGoal(id) && (
                      <div className="font-bold text-lg">Goal</div>
                    )}
                    {id === 0 && (
                      <div className="font-bold text-lg absolute w-4 h-4 rounded-full bg-red-500 left-2 top-2" />
                    )}
                    {!(mdp.isHole(id) || mdp.isGoal(id)) && (
                      <div className="flex flex-col items-center text-3xl font-bold text-blue-500">
                        {policy.actionMap[id] === 0 && <ArrowUpOutlined />}
                        {policy.actionMap[id] === 1 && <ArrowRightOutlined />}
                        {policy.actionMap[id] === 2 && <ArrowDownOutlined />}
                        {policy.actionMap[id] === 3 && <ArrowLeftOutlined />}
                        <div className="text-sm font-normal text-gray-500 mt-2">
                          {V[id].toFixed(4)}
                        </div>
                      </div>
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

  return (
    <div className="flex flex-col">
      <h2 className="mt-10">Optimal Policy</h2>
      <div>{ctx && renderBoard(ctx.policy, ctx.V)}</div>
      <div onClick={e => optimize()}>optimize</div>
      <div>{ isDone ? <div>Success Rate: { (successRate * 100).toFixed(2) }%</div> : '...' }</div>
    </div>
  )
}

export default {
  description: 'frozen lake policy iteration.',
  notCanvas: true,
  run(app: any) {
    return (
      <div className="w-full h-full flex justify-center overflow-scroll">
        <FrozenLakePolicyIteration />
      </div>
    )
  },
}
