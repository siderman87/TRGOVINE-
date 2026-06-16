Blagajne - faza 1 in faza 2

Kako odpres:
1. Odpri datoteko index.html v brskalniku.
2. Klikni "Nalozi demo", ce zelis testne podatke.
3. Uporabi levi meni za pregled, nov zakljucek, potrditve, porocila in trgovine.

Kaj je vkljuceno:
- vec trgovin/lokacij
- uporabniki z vlogami
- dnevni zakljucek blagajne
- gotovina, kartice, druga placila, vracila, pologi
- avtomatski izracun pricakovane gotovine
- izracun manjka/viska
- primerjava karticnega prometa s POS izpiskom
- priloge k zakljucku
- potrjevanje zakljuckov
- dashboard vseh lokacij
- porocila s filtri
- CSV izvoz za racunovodstvo
- osnovna revizijska sled v podatkih
- uporabniki z vlogami in dostopi do trgovin
- prijava z uporabniskim imenom in geslom
- administrator lahko dodaja uporabnike in spreminja gesla
- urejanje obstojecih trgovin in uporabnikov
- brisanje napacnih osnutkov zakljuckov
- ogled prilozenih dokazil iz zakljucka
- zaklep potrjenih zakljuckov samo za ogled
- izvoz in uvoz celotnega backupa v JSON datoteki
- hitri filter "ta mesec"
- tiskanje porocila iz pogleda Porocila

Opomba:
Ta verzija hrani podatke lokalno v brskalniku prek localStorage. To je primerno za prototip in testiranje procesa. Za pravo produkcijsko uporabo bi naslednji korak bil backend, skupna baza, prijava, backupi in pravice na strezniku.

Priporocilo za delo:
- Prva prijava je admin / admin123.
- Po prvi prijavi pojdi v Nastavitve in administratorju spremeni geslo.
- Gesla se spreminjajo v Nastavitve -> Uporabniki -> Uredi.
- Ko zacnes uporabljati svoje podatke, pojdi v Nastavitve in klikni "Zacni na cisto".
- Vnesi svoje trgovine in uporabnike.
- Ob koncu dneva naredi zakljucek za vsako trgovino.
- Redno klikni "Backup" ali "Izvozi backup", da imas kopijo podatkov tudi zunaj brskalnika.
