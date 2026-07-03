import { Component } from 'react';
import ErrorScreen from './ErrorScreen';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          fullPage
          message="Ocorreu um erro inesperado. Recarregue a página ou tente novamente."
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
