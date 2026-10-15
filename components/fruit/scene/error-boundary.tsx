'use client'

// Catches a render error inside the Canvas (a shader that fails to compile, a missing extension)
// and reports it, so BenchApp can swap the canvas for the static SVG frames.

// ===== External modules =====
import { Component, type ReactNode } from 'react'

// ===== Types =====

type Props = { children: ReactNode; onError?: (error: Error) => void }
type State = { failed: boolean }

// ===== Class: SceneErrorBoundary =====

// Error boundaries are the one thing React still requires a class for.
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    // kept on window so the error can be read from the console on a visitor's machine
    ;(window as Window & { __benchErr?: string }).__benchErr = error.stack || error.message
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
