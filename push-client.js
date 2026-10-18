import {VAPID_PUBLIC_KEY} from "./push-config.js";
let listening = false;
window.reservaAtivarPush = async function(){
  if(!window.__reservaFirebaseApp){alert("Firebase não conectado. Confira a conexão.");return;}
  try {
    const [{getMessaging,getToken,onMessage,isSupported},{getFirestore,doc,setDoc,serverTimestamp},{getAuth,signInWithEmailAndPassword}] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js")]);
    if(!await isSupported()) throw Error("Notificações push não suportadas neste navegador.");
    const auth=getAuth(window.__reservaFirebaseApp);
    let user=auth.currentUser;
    if(!user) throw Error("Entre com o código da equipe antes de ativar notificações.");
    if(Notification.permission!=="granted"){
      const permission=await Notification.requestPermission();
      if(permission!=="granted")throw Error("Permissão de notificação não concedida.");
    }
    const registration=await navigator.serviceWorker.register("./service-worker.js");
    const messaging=getMessaging(window.__reservaFirebaseApp);
    const token=await getToken(messaging,{vapidKey:VAPID_PUBLIC_KEY,serviceWorkerRegistration:registration});
    if(!token)throw Error("Token FCM não retornado.");
    const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));
    const tokenId=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,"0")).join("");
    await setDoc(doc(getFirestore(window.__reservaFirebaseApp),"pushTokens",tokenId),{
      token,uid:user.uid,updatedAt:serverTimestamp(),platform:navigator.userAgent.slice(0,350)
    },{merge:true});
    if(!listening){
      onMessage(messaging,payload=>{
        const n=payload.notification||{};
        if(Notification.permission==="granted"){
          // Foreground notifications are shown by the service worker to avoid double notifications.
          navigator.serviceWorker.ready.then(reg=>reg.showNotification(n.title||"Comandas",{body:n.body||"Nova atualização",tag:payload.data?.tag||"comandas",icon:"./icons/icon-192.png"}));
        }
      });
      listening=true;
    }
    alert("Celular cadastrado! Notificações push ativadas.");
  }catch(e){console.error(e);alert("Falha ao cadastrar celular: "+e.message);}
};
navigator.serviceWorker?.addEventListener("message",event=>{
  if(event.data?.type==="OPEN_ALERTS")document.querySelector('[data-view="alerts"]')?.click();
});
if(new URLSearchParams(location.search).has("alerta"))window.addEventListener("load",()=>setTimeout(()=>document.querySelector('[data-view="alerts"]')?.click(),600));
