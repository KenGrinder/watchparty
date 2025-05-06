import './index.css';

import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route } from 'react-router-dom';

import App from './components/App';
import { Home } from './components/Home';
import { Privacy, Terms, FAQ, DiscordBot } from './components/Pages/Pages';
import { TopBar } from './components/TopBar/TopBar';
import { Footer } from './components/Footer/Footer';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { serverPath } from './utils';
import { Create } from './components/Create/Create';
import { Discord } from './components/Discord/Discord';
import 'semantic-ui-css/semantic.min.css';
import config from './config';
import { DEFAULT_STATE, MetadataContext } from './MetadataContext';

const Debug = lazy(() => import('./components/Debug/Debug'));

const firebaseConfig = config.VITE_FIREBASE_CONFIG;
if (firebaseConfig) {
  try {
    const parsedConfig = typeof firebaseConfig === 'string' 
      ? JSON.parse(JSON.parse(firebaseConfig))
      : firebaseConfig;
    firebase.initializeApp(parsedConfig);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.warn('No Firebase config found');
}

// Redirect old-style URLs
if (window.location.hash && window.location.pathname === '/') {
  const hashRoomId = window.location.hash.substring(1);
  window.location.href = '/watch/' + hashRoomId;
}

class WatchParty extends React.Component {
  public state = DEFAULT_STATE;
  async componentDidMount() {
    if (firebaseConfig) {
      // Handle OIDC redirect result first
      try {
        const result = await firebase.auth().getRedirectResult();
        
        // If we have a successful redirect result with a credential
        if (result.credential && result.user) {
          // If on the auth handler page, redirect back to main app
          if (window.location.pathname.includes('/__/auth/handler')) {
            window.location.href = '/';
          }
        }
      } catch (error) {
        console.error('Error handling SSO redirect:', error);
      }

      // Set up auth state listener
      firebase.auth().onAuthStateChanged(async (user: firebase.User | null) => {
        if (user) {
          this.setState({ user });
          try {
            const token = await user.getIdToken();
            const response = await window.fetch(
              serverPath + `/metadata?uid=${user.uid}&token=${token}`,
            );
            const data = await response.json();
            this.setState({
              isSubscriber: data.isSubscriber,
              streamPath: data.streamPath,
              beta: data.beta,
            });
          } catch (error) {
            console.error('Error getting metadata:', error);
          }
        }
      });
    } else {
      this.setState({
        isSubscriber: true,
      });
    }
  }
  render() {
    return (
      // <React.StrictMode>
      <MetadataContext.Provider value={this.state}>
        <BrowserRouter>
          <Route
            path="/"
            exact
            render={(props) => {
              return (
                <React.Fragment>
                  <TopBar hideNewRoom />
                  <Home />
                  <Footer />
                </React.Fragment>
              );
            }}
          />
          <Route
            path="/create"
            exact
            render={() => {
              return <Create />;
            }}
          />
          <Route
            path="/watch/:roomId"
            exact
            render={(props) => {
              return <App urlRoomId={props.match.params.roomId} />;
            }}
          />
          <Route
            path="/r/:vanity"
            exact
            render={(props) => {
              return <App vanity={props.match.params.vanity} />;
            }}
          />
          <Route path="/terms">
            <TopBar />
            <Terms />
            <Footer />
          </Route>
          <Route path="/privacy">
            <TopBar />
            <Privacy />
            <Footer />
          </Route>
          <Route path="/faq">
            <TopBar />
            <FAQ />
            <Footer />
          </Route>
          <Route path="/discordBot">
            <TopBar />
            <DiscordBot />
            <Footer />
          </Route>
          <Route path="/discord/auth" exact>
            <Discord />
          </Route>
          <Route path="/debug">
            <TopBar />
            <Suspense fallback={null}>
              <Debug />
            </Suspense>
            <Footer />
          </Route>
        </BrowserRouter>
      </MetadataContext.Provider>
      // </React.StrictMode>
    );
  }
}
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<WatchParty />);
