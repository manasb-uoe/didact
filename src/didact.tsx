import { render, createElement } from './core';
import { useState } from './hooks/use-state';
import { useEffect } from './hooks/use-effect';
import { useMemo } from './hooks/use-memo';

const Didact = {
  render,
  createElement,
  useState,
  useEffect,
  useMemo
}

export default Didact;