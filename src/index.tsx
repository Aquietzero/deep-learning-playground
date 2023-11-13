import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { HashRouter } from "react-router-dom"
import { Main } from './main'
import './style.css'
import 'antd/dist/antd.css'

ReactDOM.render(
  <HashRouter>
    <Main />
  </HashRouter>,
  document.getElementById('root')
)
