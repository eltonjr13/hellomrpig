# OBJ models

Place `.obj` files here and import them with Vite's URL loader:

```ts
import playerModelUrl from "../assets/models/player.obj?url";
```

Then pass the URL into the player:

```tsx
<Player modelUrl={playerModelUrl} />
```
