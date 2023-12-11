/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Button,
  Dimensions,
  Text,
  ScrollView,
} from 'react-native';
import * as WebBrowser from '@toruslabs/react-native-web-browser';
import EncryptedStorage from 'react-native-encrypted-storage';
import Web3Auth, {
  LOGIN_PROVIDER,
  OPENLOGIN_NETWORK,
  OpenloginUserInfo,
} from '@web3auth/react-native-sdk';
import RPC from './ethersRPC'; // for using ethers.js
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const scheme = 'awesomeweb3authproject'; // Or your desired app redirection scheme
const resolvedRedirectUrl = `${scheme}://openlogin`;
const clientId =
  'BJkpaImdmsGvo-AY8JiAcb0My812IAOYjoAAvk7khFqfrhA5ULCvITzT_ZZKw5IvGnW5zr5aj2Cwc7iZ5AOe3fU';
const web3auth = new Web3Auth(WebBrowser, EncryptedStorage, {
  clientId,
  network: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET, // or other networks
  loginConfig: {
    jwt: {
      verifier: 'w3a-awesomefirebaseweb3-verifier',
      typeOfLogin: 'jwt',
    },
  },
});

async function signInWithFirebase() {
  try {
    GoogleSignin.configure({
      webClientId:
        '219852505002-j7smksi9llrp41e3e19fdb2ck38s1rp4.apps.googleusercontent.com',
    });
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
    // Get the user's ID token
    const {idToken} = await GoogleSignin.signIn();
    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential
    const res = await auth().signInWithCredential(googleCredential);
    return res;
  } catch (error: any) {
    console.error(error);
  }
}

function App(): React.JSX.Element {
  const [userInfo, setUserInfo] = useState<OpenloginUserInfo | undefined>();
  const [key, setKey] = useState<string | undefined>('');
  const [console, setConsole] = useState<string>('');

  const login = async () => {
    try {
      if (!web3auth) {
        setConsole('Web3auth not initialized');
        return;
      }

      setConsole('Logging in');
      const loginRes = await signInWithFirebase();
      uiConsole('Login success', loginRes);
      const idToken = await loginRes?.user.getIdToken(true);
      uiConsole('idToken', idToken);
      await web3auth.login({
        loginProvider: LOGIN_PROVIDER.JWT,
        redirectUrl: resolvedRedirectUrl,
        mfaLevel: 'default',
        extraLoginOptions: {
          id_token: idToken,
          verifierIdField: 'sub',
        },
      });
      setConsole(`Logged in ${web3auth.privKey}`);
      if (web3auth.privKey) {
        setUserInfo(web3auth.userInfo());
        setKey(web3auth.privKey);
        uiConsole('Logged In');
      }
    } catch (e: any) {
      setConsole(e.message);
    }
  };

  const logout = async () => {
    if (!web3auth) {
      setConsole('Web3auth not initialized');
      return;
    }

    setConsole('Logging out');
    await web3auth.logout();

    if (!web3auth.privKey) {
      setUserInfo(undefined);
      setKey('');
      uiConsole('Logged out');
    }
  };

  useEffect(() => {
    const init = async () => {
      await web3auth.init();
      if (web3auth?.privKey) {
        uiConsole('Re logged in');
        setUserInfo(web3auth.userInfo());
        setKey(web3auth.privKey);
        uiConsole(web3auth.privKey);
      }
    };
    init();
  });

  const getChainId = async () => {
    setConsole('Getting chain id');
    const networkDetails = await RPC.getChainId();
    uiConsole(networkDetails);
  };

  const getAccounts = async () => {
    if (!key) {
      setConsole('User not logged in');
      return;
    }
    setConsole('Getting account');
    const address = await RPC.getAccounts(key);
    uiConsole(address);
  };
  const getBalance = async () => {
    if (!key) {
      setConsole('User not logged in');
      return;
    }
    setConsole('Fetching balance');
    const balance = await RPC.getBalance(key);
    uiConsole(balance);
  };
  const sendTransaction = async () => {
    if (!key) {
      setConsole('User not logged in');
      return;
    }
    setConsole('Sending transaction');
    const tx = await RPC.sendTransaction(key);
    uiConsole(tx);
  };
  const signMessage = async () => {
    if (!key) {
      setConsole('User not logged in');
      return;
    }
    setConsole('Signing message');
    const message = await RPC.signMessage(key);
    uiConsole(message);
  };

  const uiConsole = (...args: unknown[]) => {
    setConsole(JSON.stringify(args || {}, null, 2) + '\n\n\n\n' + console);
  };

  const loggedInView = (
    <View style={styles.buttonArea}>
      <Button title="Get User Info" onPress={() => uiConsole(userInfo)} />
      <Button title="Get Chain ID" onPress={() => getChainId()} />
      <Button title="Get Accounts" onPress={() => getAccounts()} />
      <Button title="Get Balance" onPress={() => getBalance()} />
      <Button title="Send Transaction" onPress={() => sendTransaction()} />
      <Button title="Sign Message" onPress={() => signMessage()} />
      <Button title="Get Private Key" onPress={() => uiConsole(key)} />
      <Button title="Log Out" onPress={logout} />
    </View>
  );

  const unloggedInView = (
    <View style={styles.buttonArea}>
      <Button title="Login with Web3Auth" onPress={login} />
    </View>
  );

  return (
    <View style={styles.container}>
      {key ? loggedInView : unloggedInView}
      <View style={styles.consoleArea}>
        <Text style={styles.consoleText}>Console:</Text>
        <ScrollView style={styles.console}>
          <Text>{console}</Text>
        </ScrollView>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingBottom: 30,
  },
  consoleArea: {
    margin: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  console: {
    flex: 1,
    backgroundColor: '#CCCCCC',
    color: '#ffffff',
    padding: 10,
    width: Dimensions.get('window').width - 60,
  },
  consoleText: {
    padding: 10,
  },
  buttonArea: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 30,
  },
});

export default App;
