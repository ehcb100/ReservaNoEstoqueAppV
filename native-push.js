// Registro nativo de tokens FCM no mesmo Firestore do site.
// Requer login autorizado no Firebase Authentication; não grava credenciais no APK.
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

if (Capacitor.isNativePlatform()) {
  // A classe é inserida exclusivamente no WebView do APK.
  document.documentElement.classList.add('comandas-android');
  // Criar o canal antes de solicitar o registro FCM.
  PushNotifications.createChannel({
    id: 'comandas_espera_jrpg_v1',
    name: 'Demandas em espera',
    description: 'Avisos suaves para comandas aguardando atendimento',
    importance: 4,
    visibility: 1,
    sound: 'alerta_jrpg.wav',
    vibration: true
  }).catch(error => console.warn('Canal de alertas:', error));
  window.reservaAtivarPush = async () => {
    try {
      const app=window.__reservaFirebaseApp;
      if (!app) throw Error('Firebase ainda não conectado.');
      const [{getAuth},{getFirestore,doc,setDoc,serverTimestamp}] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js')
      ]);
      const auth=getAuth(app);
      let user=auth.currentUser;
      if(!user) throw Error('Aguarde a conexão automática com o Firebase.');
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
