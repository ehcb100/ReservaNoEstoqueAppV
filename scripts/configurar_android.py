from pathlib import Path
from PIL import Image
import re
root=Path(__file__).resolve().parent.parent
android=root/'android/app/src/main'
strings=android/'res/values/strings.xml'
s=strings.read_text()
s=re.sub(r'(<string name="app_name">).*?(</string>)',r'\1Comandas\2',s)
s=re.sub(r'(<string name="title_activity_main">).*?(</string>)',r'\1Comandas\2',s)
strings.write_text(s)
icon=Image.open(root/'rowlet.png').convert('RGBA')
for qualifier, size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    folder=android/'res'/('mipmap-'+qualifier)
    folder.mkdir(exist_ok=True)
    for name in ('ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png'):
        icon.resize((size,size),Image.Resampling.LANCZOS).save(folder/name)
# Adaptive icon XML otherwise takes priority over PNG on Android 8+.
folder=android/'res/mipmap-anydpi-v26'
if folder.exists():
    for name in ('ic_launcher.xml','ic_launcher_round.xml'):
        (folder/name).unlink(missing_ok=True)
print('Nome Comandas e icone Rowlet aplicados.')
