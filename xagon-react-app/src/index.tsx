import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import GameComponent from './components/GameComponent/index';
import reportWebVitals from './reportWebVitals';
console.log('process.env.BASE_PATH', process.env.BASE_PATH);
ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename={process.env.BASE_PATH}>
      <Routes>
        <Route path="/" element={<GameComponent />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
