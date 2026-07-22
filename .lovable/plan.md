## Objectif
Calculer automatiquement la distance (km) entre l'adresse de prise en charge et de dépôt via OSRM (gratuit, sans clé API), puis pré-remplir le champ `estimated_km` dans le formulaire de réservation.

## Comment fonctionne OSRM
OSRM propose un serveur de démo public (`router.project-osrm.org`) qui prend des coordonnées GPS et renvoie la distance/durée routière. Il ne géocode pas les adresses → il faut passer par **Nominatim** (OpenStreetMap, également gratuit) pour convertir "adresse texte" → coordonnées.

Flux :
```text
Adresse pickup ──▶ Nominatim ──▶ (lat,lon)
                                          \
                                           ├─▶ OSRM /route ──▶ distance en mètres ──▶ km
                                          /
Adresse dropoff ─▶ Nominatim ──▶ (lat,lon)
```

## Implémentation

### 1. Edge function `compute-distance`
Nouvelle fonction Supabase (raison : éviter les problèmes CORS de Nominatim/OSRM côté navigateur, et pouvoir ajouter un User-Agent conforme aux règles d'usage de Nominatim).

Entrée : `{ pickup: string, dropoff: string }`  
Sortie : `{ km: number, durationMin: number }` ou `{ error }`

Étapes internes :
1. Appelle `https://nominatim.openstreetmap.org/search?format=json&q=<adresse>&limit=1` pour chaque adresse (avec header `User-Agent: SouthShoreLimoBoston/1.0`).
2. Appelle `https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false`.
3. Retourne `distance / 1000` arrondi à 1 décimale.
4. CORS headers + validation Zod des entrées.

### 2. Intégration dans `src/pages/Booking.tsx`
- Ajouter un bouton "Calculer la distance" à côté du champ `estimated_km`, actif seulement si `pickup` et `dropoff` sont remplis.
- Au clic : appelle `supabase.functions.invoke('compute-distance', ...)`, met à jour `estimated_km`, affiche un toast succès/erreur.
- Calcul automatique optionnel : déclencher aussi via `onBlur` du champ dropoff (debounce simple).
- Garder la saisie manuelle possible (l'utilisateur peut toujours corriger la valeur).

### 3. Aucun changement de base de données
Le schéma `bookings.estimated_km` existe déjà et est utilisé par l'admin pour calculer le prix (`per_km_rate * estimated_km`).

## Limitations à connaître (à mentionner dans l'UI via un petit texte d'aide)
- Serveur de démo OSRM : pas de SLA, usage raisonnable uniquement. Pour un site en production à fort trafic, il faudra soit self-host OSRM, soit passer à Mapbox/GraphHopper.
- Nominatim : limite ~1 req/sec par IP ; suffisant pour un formulaire de réservation.
- Précision d'adresse dépend d'OpenStreetMap (peut être approximatif pour certaines adresses résidentielles US).

## Fichiers touchés
- `supabase/functions/compute-distance/index.ts` (nouveau)
- `src/pages/Booking.tsx` (bouton + appel + toast)

Voulez-vous que j'ajoute aussi le calcul automatique au `onBlur` du dropoff, ou seulement le bouton manuel ?
