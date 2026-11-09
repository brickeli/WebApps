open Staging:
CMD
change directory to D:
cd D:\Documents\Projects\GameApps\dailyTarot
python -m http.server 8000
open url http://localhost:8000/arcana.html

RESET STORAGE
localStorage.removeItem('arcana_last_triple_date'); localStorage.removeItem('arcana_saved_triple_cards'); localStorage.removeItem('arcana_saved_triple_reversed'); localStorage.removeItem('arcana_last_single_date'); location.reload();




Arcana File Structure/
├── arcana.html
├── archives.html
├── main.js
├── favicon.svg
├── css/
│   ├── card-styles.js
│   └── styles.css
├── js/
│   ├── archives.js
│   ├── audio.js
│   ├── cardLibrary.js
│   ├── common.js
│   ├── fx.js
│   ├── journal.js
│   ├── share.js
│   ├── sigil.js
│   ├── spreadReading.js
│   ├── storage.js
│   └── theme.js
└── assets/
    └── icons.svg
