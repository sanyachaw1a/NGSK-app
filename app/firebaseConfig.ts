// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB75Loc3fG_7ZBbuYT3v7y6WYnth_rpmK4",
    authDomain: "ngsk-7c4d5.firebaseapp.com",
    projectId: "ngsk-7c4d5",
    storageBucket: "ngsk-7c4d5.firebasestorage.app",
    messagingSenderId: "850185665575",
    appId: "1:850185665575:web:ddbc354f33a51bc3c9a202",
    measurementId: "G-G16TB9FY4P"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
