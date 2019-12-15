import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { App, Didact } from './didact';
import * as serviceWorker from './serviceWorker';

const root = document.getElementById('root');
if (!root) throw new Error('root not found in DOM');

Didact.render(App, root);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
