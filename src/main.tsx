import * as React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Playground } from './playground'

export const Main: React.FC = () => {
  return (
    <>
      <Routes>
        <Route
          path="/examples/:group/:example"
          element={<Playground />}
        />
        <Route
          path="*"
          element={
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Link
                className="text-4xl"
                to="/examples/reinforcement-learning/FrozenLakePolicyIteration"
              >
                Deep Learning Playground
              </Link>
              <div>by Aquietzero@github.com</div>
            </div>
          }
        />
      </Routes>
    </>
  )
}

