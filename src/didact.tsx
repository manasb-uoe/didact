import { render, createElement } from './core';
import { useState } from './hooks/use-state';
import { useEffect } from './hooks/use-effect';
import { useMemo } from './hooks/use-memo';
import { useCallback } from './hooks/use-callback';
import { useRef } from './hooks/use-ref';

const Didact = {
  render,
  createElement,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
}

export default Didact;