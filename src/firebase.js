import firebase from 'firebase/app';

import 'firebase/auth';
import 'firebase/firestore';

var config = {
  apiKey: "AIzaSyD7MeZQ_LM4bHkmcpvYN7P2-_OS0ZWk040",
  authDomain: "chat-65296.firebaseapp.com",
  databaseURL: "https://chat-65296.firebaseio.com",
  projectId: "chat-65296",
  storageBucket: "chat-65296.appspot.com",
  messagingSenderId: "177379768384"
};
firebase.initializeApp(config);

const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };
