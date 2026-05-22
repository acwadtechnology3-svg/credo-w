import { Component } from 'react'

/** Catches WebGL / Three.js failures without breaking the landing page */
export default class SceneErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(err) {
    console.warn('3D scene fallback:', err?.message)
  }

  render() {
    if (this.state.failed) {
      return (
        this.props.fallback || (
          <div
            style={{
              height: '100%',
              minHeight: 280,
              display: 'grid',
              placeItems: 'center',
              background:
                'radial-gradient(ellipse at 50% 40%, rgba(123,108,246,0.25), transparent 70%)',
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7b6cf6, #e8c96a)',
                opacity: 0.85,
                boxShadow: '0 0 60px rgba(123,108,246,0.5)',
              }}
            />
          </div>
        )
      )
    }
    return this.props.children
  }
}
