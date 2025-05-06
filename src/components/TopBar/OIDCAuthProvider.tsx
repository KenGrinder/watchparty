import React from 'react';
import { Dropdown, Icon } from 'semantic-ui-react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

interface OIDCAuthProviderProps {
  onSignIn: () => void;
}

export class OIDCAuthProvider extends React.Component<OIDCAuthProviderProps> {
  oidcSignIn = async () => {
    try {
      // Create provider
      const provider = new firebase.auth.OAuthProvider('oidc.watchparty');
      
      // Add required scopes
      provider.addScope('openid');
      provider.addScope('email');
      provider.addScope('profile');

      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'login'
      });
      
      // Try popup first
      try {
        const result = await firebase.auth().signInWithPopup(provider);
        if (this.props.onSignIn) {
          this.props.onSignIn();
        }
      } catch (popupError) {
        // Fall back to redirect if popup fails
        await firebase.auth().signInWithRedirect(provider);
      }
    } catch (error) {
      console.error('SSO login failed:', error);
    }
  };

  render() {
    return (
      <Dropdown.Item onClick={this.oidcSignIn}>
        <Icon name="user" />
        SSO Login
      </Dropdown.Item>
    );
  }
} 