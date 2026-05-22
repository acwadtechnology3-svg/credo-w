import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: '12px',
            padding: '2rem',
          }}
        >
          <div style={{ fontSize: '48px' }}>💥</div>
          <h2 style={{ fontWeight: '600', fontSize: '18px', color: '#1a1625' }}>حدث خطأ غير متوقع</h2>
          <p style={{ fontSize: '13px', color: '#6b6578', textAlign: 'center', maxWidth: '400px' }}>
            {this.state.error?.message || 'يمكنك إعادة تحميل الصفحة أو العودة للرئيسية.'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/'
              }}
              style={{
                background: 'transparent',
                color: '#534ab7',
                border: '1px solid rgba(83,74,183,0.35)',
                borderRadius: '8px',
                padding: '9px 20px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              الرئيسية
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              style={{
                background: '#7b6cf6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 24px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              إعادة التحميل
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
