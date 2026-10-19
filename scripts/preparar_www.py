from pathlib import Path
import shutil
root=Path(__file__).resolve().parent.parent
out=root/'www'
out.mkdir(exist_ok=True)
for name in ['index.html','app.js','style.css','manifest.json','service-worker.js','push-client.js','push-config.js','native-push.js','rowlet.png','kyogre-mobile-pixel.png','kyogre-oceano.gif']:
    src=root/name
    if src.exists():shutil.copy2(src,out/name)
if (root/'icons').exists():shutil.copytree(root/'icons',out/'icons',dirs_exist_ok=True)

# A integração nativa é carregada apenas no APK, onde o bundle é gerado pelo workflow.
index=out/'index.html'
html=index.read_text(encoding='utf-8')
html=html.replace('<!-- O script nativo é inserido somente durante a compilação do APK. -->', '<script src="./native-push.bundle.js"></script>')
index.write_text(html,encoding='utf-8')
