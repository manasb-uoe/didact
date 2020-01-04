import './index.css';
import * as serviceWorker from './serviceWorker';
import * as React from 'react';
import Didact from './didact';

/** @jsx Didact.createElement */
function Counter() {
  const [count, setCount] = Didact.useState(1);
  Didact.useEffect(() => {
    console.log('called effect');
  }, count);

  return (
    <div>
      <h1>
        Count: {count}
      </h1>
      <button onClick={() => setCount(c => c + 1)}>Increment counter</button>
    </div>
  )
}

const App = <Counter />;

const root = document.getElementById('root');
if (!root) throw new Error('root not found in DOM');

Didact.render(App, root);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
