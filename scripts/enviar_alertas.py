"""Notificações via Firebase Spark + GitHub Actions, sem Cloud Functions.
Executa a cada ~5 min; agendamentos GitHub não são garantidos no horário.
"""
import json, os, sys
from datetime import datetime, timezone, timedelta
import firebase_admin
from firebase_admin import credentials, firestore, messaging

secret=os.getenv("FIREBASE_SERVICE_ACCOUNT")
if not secret:
    sys.exit("Configure FIREBASE_SERVICE_ACCOUNT em Settings > Secrets and variables > Actions")
cred=credentials.Certificate(json.loads(secret))
firebase_admin.initialize_app(cred)
db=firestore.client()
now=datetime.now(timezone.utc)
orders=list(db.collection("comandas").stream())
tokens=[d.to_dict().get("token") for d in db.collection("pushTokens").stream()]
tokens=list(dict.fromkeys(t for t in tokens if isinstance(t,str) and t))
print(f"Comandas: {len(orders)}; dispositivos: {len(tokens)}")

def as_datetime(value):
    if hasattr(value,"to_datetime"):
        value=value.to_datetime()
    if isinstance(value,datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value,str):
        try:return datetime.fromisoformat(value.replace("Z","+00:00")).astimezone(timezone.utc)
        except ValueError:return None
    return None

def notify_once(order_id,kind,title,body):
    if not tokens:return
    claim=db.collection("pushClaims").document(f"{order_id}_{kind}")
    # Claims prevent duplicates even after a retry; partial delivery failures are logged.
    transaction=db.transaction()
    @firestore.transactional
    def reserve(tx):
        snap=claim.get(transaction=tx)
        if snap.exists:return False
        tx.set(claim,{"createdAt":firestore.SERVER_TIMESTAMP,"orderId":order_id,"kind":kind})
        return True
    if not reserve(transaction):return
    delivered=0
    for token in tokens:
        try:
            messaging.send(messaging.Message(token=token,notification=messaging.Notification(title=title,body=body),data={"tag":f"{order_id}-{kind}","url":"./?alerta=1"},webpush=messaging.WebpushConfig(fcm_options=messaging.WebpushFCMOptions(link="https://ehcb100.github.io/ReservaNoEstoqueAppV/?alerta=1"))))
            delivered+=1
        except Exception as error:
            print(f"Falha de envio ({order_id}/{kind}): {type(error).__name__}: {error}")
    print(f"{order_id}/{kind}: {delivered}/{len(tokens)} notificações enviadas")

for snapshot in orders:
    c=snapshot.to_dict() or {}
    created=as_datetime(c.get("createdAt"))
    if not created or created>now:continue
    # Janela de 24h para evitar avisos de comandas antigas ao ativar o serviço.
    if now-created>timedelta(hours=24):continue
    number=str(c.get("number") or snapshot.id)[:50]
    notify_once(snapshot.id,"nova","Nova comanda registrada",f"Comanda {number} recebida. Abra o aplicativo para conferir.")
    if c.get("status")!="concluida" and now-created>=timedelta(minutes=20):
        notify_once(snapshot.id,"pendente20","Comanda pendente há 20 minutos",f"A comanda {number} continua aberta.")
