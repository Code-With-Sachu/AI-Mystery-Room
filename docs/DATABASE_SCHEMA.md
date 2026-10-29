# Database
Collection `cases` (Mongoose model `Case`, `server/src/models/Case.js`).
- `_id` string (24 hex chars from 12 random bytes), `referenceNumber`, `ownerTokenHash` (sha-256, select:false)
- `title, premise, story, crimeScene` required, length-limited · `difficulty` enum easy|medium|hard
- `suspects[]{id,name,role,biography,motive,alibi}`, `clues[]{id,title,description,location,relevance}`, `hints[]{id,text}` (ids match `^[A-Za-z0-9_-]{1,40}$`)
- `solution{culpritId,motive,method,timeline,explanation,keyClueIds[],suspectEliminations[]}` **select:false**
- `discoveredClueIds[]`, `usedHintIds[]`, `accusation{suspectId,reasoning,correct,submittedAt,breakdown}`, `score`, `status` active|completed, `completedAt`, timestamps
- Indexes: `{status,createdAt}`; TTL on `createdAt` (90 days).

**Atomic transitions** (`mongoRepository.js`): discover = `findOneAndUpdate({status:active, discoveredClueIds:{$ne:id}}, $addToSet)`; hint = match `usedHintIds:{$size:n}` then `$push`; accuse = match `status:active` and unchanged clue/hint counts, then set completed. A failed match means another request won; the service returns 409 or re-reads.
**Lifecycle:** created active → progress updates → completed once → expires after 90 days.
