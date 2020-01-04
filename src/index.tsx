import './index.css';
import * as serviceWorker from './serviceWorker';
import * as React from 'react';
import Didact from './didact';

/** @jsx Didact.createElement */
function Counter() {
  const [count, setCount] = Didact.useState(1);
  const memoizedValue = Didact.useMemo(() => count*2, [count]);
  const memoizedCallback = Didact.useCallback(() => console.log('my count is', count), []);
  
  Didact.useEffect(() => {
    console.log('memouzed value changed', memoizedValue);
  }, [memoizedValue]);

  Didact.useEffect(() => {
    memoizedCallback();
  }, [memoizedCallback]);

  return (
    <div>
      <h1 style={{ color: "red !important", fontWeight: "lighter" }}>
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
