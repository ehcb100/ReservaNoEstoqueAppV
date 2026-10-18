// Registro nativo de tokens FCM no mesmo Firestore do site.
// Requer login autorizado no Firebase Authentication; não grava credenciais no APK.
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

if (Capacitor.isNativePlatform()) {
  window.reservaAtivarPush = async () => {
    try {
      const app=window.__reservaFirebaseApp;
      if (!app) throw Error('Firebase ainda não conectado.');
      const [{getAuth,signInWithEmailAndPassword},{getFirestore,doc,setDoc,serverTimestamp}] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js')
      ]);
      const auth=getAuth(app);
      let user=auth.currentUser;
      if(!user){
        const email=prompt('E-mail do funcionário autorizado:');
        if(!email)return;
        const password=prompt('Senha do funcionário:');
        if(!password)return;
        user=(await signInWithEmailAndPassword(auth,email,password)).user;
      }
      const permission=await PushNotifications.checkPermissions();
      if(permission.receive!=='granted'){
        const requested=await PushNotifications.requestPermissions();
        if(requested.receive!=='granted')throw Error('Permissão de notificação negada.');
      }
      await PushNotifications.removeAllListeners();
      const saveToken=async token=>{
        if(!token)return;
        const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
        const tokenId=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
        await setDoc(doc(getFirestore(app),'pushTokens',tokenId),{
          token,uid:user.uid,updatedAt:serverTimestamp(),platform:'android-native'
        },{merge:true});
      };
      await PushNotifications.addListener('registration',async event=>{
        try{await saveToken(event.value);alert('Android cadastrado para notificações!');}
        catch(e){console.error(e);alert('Não foi possível salvar o dispositivo: '+e.message);}
      });
      await PushNotifications.addListener('registrationError',e=>{console.error(e);alert('Falha no registro FCM. Verifique google-services.json.');});
      await PushNotifications.addListener('pushNotificationActionPerformed',()=>{
        document.querySelector('[data-view="alerts"]')?.click();
      });
      await PushNotifications.register();
    }catch(e){console.error(e);alert('Falha ao ativar notificações: '+e.message);}
  };
}
