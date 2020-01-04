import { didactState } from "../core";

export function useState<T>(initial: T): [T, (action: (prevState: T) => T) => void] {
  const oldHook =
    didactState.wipFiber.alternate &&
    didactState.wipFiber.alternate.hooks &&
    didactState.wipFiber.alternate.hooks[didactState.hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  };

  // Apply the queued setState actions
  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  });

  const setState = action => {
    hook.queue.push(action);
    didactState.wipRoot = {
      dom: didactState.currentRoot && didactState.currentRoot.dom,
      props: didactState.currentRoot && didactState.currentRoot.props,
      alternate: didactState.currentRoot,
    };
    didactState.nextUnitOfWork = didactState.wipRoot;
    didactState.deletions = [];
  }

  didactState.wipFiber.hooks.push(hook);
  didactState.hookIndex++;

  return [hook.state, setState];
}