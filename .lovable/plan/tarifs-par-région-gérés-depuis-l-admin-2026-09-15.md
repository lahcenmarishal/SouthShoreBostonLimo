# Tarifs par région gérés depuis l'admin

## Objectif
Permettre au client de fixer lui-même le prix exact d'un trajet (véhicule + départ → destination) depuis l'espace admin, sans toucher au code. Si aucun prix fixe n'existe, le calcul actuel (prix par mile + heures d'attente) reste utilisé.

## Ce que le client verra

### Admin — nouvel onglet « Régions »
Liste des régions/localisations (Airport, Downtown, Region A…) avec :
- ajout, modification, activation/désactivation, suppression
- pour chaque région, une liste de mots-clés (ex. « Logan, BOS, airport ») qui sert à reconnaître automatiquement l'adresse saisie par le client

### Admin — nouvel onglet « Tarifs »
Tableau : Véhicule | Départ | Destination | Prix aller | Prix retour (optionnel) | Statut | Actions
- ajout, modification, activation/désactivation, suppression
- « Toutes » possible pour le départ ou la destination (tarif par région simple, ex. Sedan → Region A = 70 $)
- règle bidirectionnelle en option (Airport → Downtown vaut aussi Downtown → Airport)
- filtre par véhicule pour retrouver vite un tarif

### Formulaire de réservation
- Le client saisit départ et destination comme aujourd'hui ; deux menus « Région de départ / d'arrivée » se remplissent automatiquement à partir de l'adresse et restent modifiables.
- Après le choix du véhicule, le récapitulatif affiche le prix fixe si une règle correspond (mention « Tarif fixe »), sinon le calcul actuel par mile. Les heures d'attente supplémentaires sont toujours ajoutées au total.
- Le prix final s'affiche clairement avant la confirmation.

## Détails techniques

### Base de données
`regions` : name, slug, keywords (text[]), active, sort_order
- lecture publique des régions actives, écriture réservée aux admins

`zone_rates` : vehicle_id (FK vehicles), pickup_region_id (nullable = toutes), dropoff_region_id (nullable = toutes), price, round_trip_price (nullable), bidirectional (bool), active, created_at/updated_at + trigger
- lecture publique des règles actives, écriture réservée aux admins
- index unique sur (vehicle_id, pickup_region_id, dropoff_region_id)
- GRANT anon/authenticated en lecture, service_role complet

`bookings` : ajout de `pickup_region_id`, `dropoff_region_id`, `price_source` ('zone' | 'formula') pour tracer le tarif appliqué.

### Code
- `src/lib/regions.ts` : CRUD régions + détection de région à partir d'un texte d'adresse (match sur keywords puis sur le nom).
- `src/lib/pricing.ts` : `resolvePrice({ vehicle, pickupRegionId, dropoffRegionId, transferType, miles, extraWaitHours, rates })`. Priorité : règle exacte départ+destination → règle avec une seule région → règle « toutes/toutes » → formule actuelle. Retourne le total, le détail et la source.
- `src/pages/Booking.tsx` : menus de région, récapitulatif basé sur `resolvePrice`, envoi des régions au serveur.
- `src/lib/bookings.ts` : `createBooking` recalcule le prix avec la même fonction (source unique de vérité) et enregistre les régions.
- `src/pages/Admin.tsx` : onglets `RegionsManager` et `RatesManager`.
- Email de notification : mention du tarif fixe et des régions.

Aucun prix codé en dur ; les valeurs actuelles par mile/heure restent le repli.
