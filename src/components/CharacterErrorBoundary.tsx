import React from 'react';
import CharacterDisplay from './CharacterDisplay';

interface Props {
  level: number;
  username: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class CharacterErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[CharacterErrorBoundary] 3D model failed to load:', error);
  }

  render() {
    if (this.state.hasError) {
      return <CharacterDisplay level={this.props.level} username={this.props.username} />;
    }
    return this.props.children;
  }
}

export default CharacterErrorBoundary;
