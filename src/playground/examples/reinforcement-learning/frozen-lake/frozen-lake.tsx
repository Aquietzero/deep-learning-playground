import * as React from 'react'
import * as _ from 'lodash'
import {
  ArrowUpOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import {
  Policy,
  policyEvaluation,
  carefulPolicy,
  goGetItPolicy,
  policyIteration,
  valueIteration,
} from '@TRE/reinforcement-learning/policy'
import { FL_MDP } from '@TRE/reinforcement-learning/mdps/fl'

const FrozenLake: React.FC = () => {
  const gridLength = 100
  const margin = 0
  const size = 4
  const board = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
    [12, 13, 14, 15],
  ]

  const mdp = new FL_MDP(4, [5, 7, 11, 12])
  const policy1 = new Policy(mdp.states, goGetItPolicy)
  const policy2 = new Policy(mdp.states, carefulPolicy)
  const V1 = policyEvaluation(policy1, mdp, 0.99)
  const V2 = policyEvaluation(policy2, mdp, 0.99)
  const { V: V3, policy: policy3 } = valueIteration(mdp, 0.99)

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
                      <div className="font-bold text-lg">Hole</div>
                    )}
                    {mdp.isGoal(id) && (
                      <div className="font-bold text-lg">Goal</div>
                    )}
                    {!(mdp.isHole(id) || mdp.isGoal(id)) && (
                      <div className="flex flex-col items-center text-3xl font-bold">
                        {policy.actionMap[id] === 0 && <ArrowUpOutlined />}
                        {policy.actionMap[id] === 1 && <ArrowRightOutlined />}
                        {policy.actionMap[id] === 2 && <ArrowDownOutlined />}
                        {policy.actionMap[id] === 3 && <ArrowLeftOutlined />}
                        <div className="text-sm font-normal text-gray-500 mt-2">
                          {V[id].toPrecision(4)}
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
      <h2>Go Get It Policy</h2>
      <div>{renderBoard(policy1, V1)}</div>
      <h2 className="mt-10">Careful Policy</h2>
      <div>{renderBoard(policy2, V2)}</div>
      <h2 className="mt-10">Optimal Policy</h2>
      <div>{renderBoard(policy3, V3)}</div>
    </div>
  )
}

export default {
  description: 'frozen lake.',
  notCanvas: true,
  run(app: any) {
    return (
      <div className="w-full h-full flex justify-center overflow-scroll">
        <FrozenLake />
      </div>
    )
  },
}
