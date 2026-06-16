Blagajne faza 3

Kaj je vkljuceno:
- PIN prijava
- SQLite baza: blagajne.sqlite3
- centralni lokalni API za sinhronizacijo vec trgovin
- dnevni zakljucki
- potrjevanje zakljuckov
- dokazila kot priloge
- PDF porocila prek gumba "PDF / Natisni"
- graf prometa po trgovinah
- statistika po prodajalkah
- TRIS CSV uvoz
- revizijska sled
- urejanje trgovin v programu
- urejanje uporabnikov, prodajalk, vlog in PIN-ov
- popravljanje osnutkov zakljuckov
- deaktivacija uporabnikov, ki ze imajo zgodovino

Kaj lahko urejas sam:
- Nastavitve -> Trgovina: dodaj ali popravi trgovino.
- Nastavitve -> Uredi trgovine: klikni Uredi ali Izbrisi.
- Nastavitve -> Uporabnik/prodajalka: dodaj ali popravi ime, vlogo, PIN in trgovino.
- Porocila -> Popravi: odpri osnutek zakljucka in ga popravi.
- Potrjenih zakljuckov se ne ureja, ker so zaklenjeni za zgodovino.

Zagon:
1. Odpri terminal v tej mapi.
2. Zazeni:
   python server.py 8767
3. Odpri:
   http://127.0.0.1:8767

V tej Codex seji je streznik ze zagnan na:
http://127.0.0.1:8767

Demo PIN-i:
- 1234 administrator
- 2222 racunovodstvo
- 1111 poslovodja Ljubljana
- 3333 blagajnik Maribor

TRIS CSV format:
datum;trgovina;prodajalka;zacetna_gotovina;gotovina;kartice;drugo;vracila;polog;presteta_gotovina;pos_kartice
2026-06-17;Trgovina Center;Nina Ljubljana;150;800;1200;0;0;700;250;1200

Opomba za pravo produkcijo:
SQLite verzija je primerna za lokalni centralni racunalnik ali interni streznik. Za pravo uporabo iz vec oddaljenih trgovin bi naslednji korak bil objava API-ja na varovanem strezniku ali zamenjava podatkovnega sloja s Supabase projektom.
