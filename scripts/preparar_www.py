from pathlib import Path
import shutil
root=Path(__file__).resolve().parent.parent
out=root/'www'
out.mkdir(exist_ok=True)
for name in ['index.html','app.js','style.css','manifest.json','service-worker.js','push-client.js','push-config.js','native-push.js','rowlet.png']:
    src=root/name
    if src.exists():shutil.copy2(src,out/name)
if (root/'icons').exists():shutil.copytree(root/'icons',out/'icons',dirs_exist_ok=True)
