import * as React from 'react';

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => {
                if (typeof child === 'object') {
                    return child;
                } else {
                    // wrap primitive values in an object
                    return createTextElement(child);
                }
            })
        }
    };
}

function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: []
        }
    }
}

/**
 * A naive recursive implementation. There’s a problem with this recursive call - once we start rendering, 
 * we won’t stop until we have rendered the complete element tree. If the element tree is big, it may block 
 * the main thread for too long. And if the browser needs to do high priority stuff like handling user 
 * input or keeping an animation smooth, it will have to wait until the render finishes.
 */
// function render(element, container: HTMLElement) {
//     const dom = element.type === "TEXT_ELEMENT"
//         ? document.createTextNode(element.props.nodeValue)
//         : document.createElement(element.type);

//     // assign props
//     Object.keys(element.props)
//         .filter(key => key !== "children")
//         .forEach(key => dom[key] = element.props[key]);

//     element.props.children.forEach(child => render(child, container));

//     container.append(dom);
// }

function createDom(fiber) {
    const dom = fiber.type === "TEXT_ELEMENT"
        ? document.createTextNode(fiber.props.nodeValue)
        : document.createElement(fiber.type);

    updateDom(dom, {}, fiber.props);

    return dom;
}

let nextUnitOfWork;

// Keep track of the work-in-progress root and only 
// add it to DOM once we've finished performing all the work
// so that the user never sees the UI in an incomplete state.  
let wipRoot;

let currentRoot;

// An array that keeps track of nodes we want to remove from the dom 
// based on reconciliation results
let deletions;

/**
 * A concurrent render implementation. We break the world into small units of work, called fibers.
 * We'll have one fiber for each element. After we finish each unit, we lett he browser interrupt
 * the rendering if there's anything else that needs to be done. We use requestIdleCallback to 
 * make this loop.
 */
function render(element, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },

        // This property is a link to the old fiber, the fiber that we commited 
        // to the dom in the previous commit phase. Used for reconcilation. 
        alternate: currentRoot
    };

    deletions = [];
    nextUnitOfWork = wipRoot;
}

declare const requestIdleCallback: any;

function commitRoot() {
    deletions.forEach(commitWork);
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null;
}

/**
 * Compare the props from the old fiber to the props of the new fiber,
 * remove the props that are gone, and set the props that are new or changed.
 */
const isEvent = key => key.startsWith("on");
const isProperty = key => key !== "children" && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);
function updateDom(dom, prevProps, nextProps) {
    //Remove old or changed event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(
            key =>
                !(key in nextProps) ||
                isNew(prevProps, nextProps)(key)
        )
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2);
            dom.removeEventListener(
                eventType,
                prevProps[name]
            );
        });

    // Remove old properties
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => {
            dom[name] = "";
        });

    // Set new or changed properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            dom[name] = nextProps[name]
        });

    // Add event listeners
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2);
            dom.addEventListener(
                eventType,
                nextProps[name]
            );
        });
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom)
    } else {
        commitDeletion(fiber.child, domParent)
    }
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }

    let domParentFiber = fiber.parent;
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent;
    }
    const domParent = domParentFiber.dom;

    if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag == "UPDATE" && fiber.dom != null) {
        // update the existing dom node with the props that changed
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    } else if (fiber.effectTag === "DELETION") {
        commitDeletion(fiber, domParent);
    }


    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }

    requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

/**
 * One of the goals of the fiber data structure is to make it easy to find the next unit 
 * of work. That’s why each fiber has a link to its first child, its next sibling and 
 * its parent. When we finish performing work on a fiber, if it has a child that fiber will 
 * be the next unit of work. If the fiber doesn’t have a child, we use the sibling 
 * as the next unit of work. And if the fiber doesn’t have a child nor a sibling 
 * we go to the “uncle”: the sibling of the parent. Also, if the parent doesn’t 
 * have a sibling, we keep going up through the parents until we find one with a 
 * sibling or until we reach the root. If we have reached the root, it means we
 * have finished performing all the work for this render.
 */
function performUnitOfWork(fiber) {
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }

    if (fiber.child) {
        return fiber.child
    }

    let nextFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}

let wipFiber;
let hookIndex;
function updateFunctionComponent(fiber) {
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];

    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}


function updateHostComponent(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, fiber.props.children)
}

/**
 * Here we will reconcile the old fibers with the new elements. 
 */
function reconcileChildren(wipFiber, elements) {
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling;

    while (index < elements.length || oldFiber != null) {
        const element = elements[index]
        let newFiber;

        const sameType =
            oldFiber &&
            element &&
            element.type == oldFiber.type

        if (sameType) {
            // Update the node by keeping the same dom node and just updating with the new props
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE",
            }
        }
        if (element && !sameType) {
            // Insert the new node
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: "PLACEMENT",
            }
        }
        if (oldFiber && !sameType) {
            // Delete the old node
            oldFiber.effectTag = "DELETION"
            deletions.push(oldFiber)
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }

        if (index === 0) {
            wipFiber.child = newFiber
        } else if (element) {
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
}

function useState(initial) {
    const oldHook =
        wipFiber.alternate &&
        wipFiber.alternate.hooks &&
        wipFiber.alternate.hooks[hookIndex];
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
        (hook.queue as any).push(action);
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot,
        };
        nextUnitOfWork = wipRoot;
        deletions = [];
    }

    wipFiber.hooks.push(hook);
    hookIndex++;

    return [hook.state, setState];
}

export const Didact = {
    createElement,
    render,
    useState
}

/** @jsx Didact.createElement */
function Counter() {
    const [state, setState] = Didact.useState(1);

    return (
        <div>
            <h1>
                Count: {state}
            </h1>
            <button onClick={() => setState(c => c + 1)}>Increment counter</button>
        </div>
    )
}

export const App = <Counter />;