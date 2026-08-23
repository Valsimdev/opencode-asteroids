---
description: Crea un git worktree en .worktrees/<nombre>
---

Crea un git worktree a partir del argumento recibido.

El argumento es: $ARGUMENTS

Reglas:

1. Toma `$ARGUMENTS`. Puede contener espacios o no.
2. Analiza el argumento y deriva un nombre de worktree en **kebab-case estricto**:
   - Todo a minúsculas.
   - Los espacios se reemplazan por guiones (`-`).
   - Se eliminan los caracteres especiales (dejar solo `a-z`, `0-9` y `-`).
   - Si el argumento está vacío, detente y pide un nombre al usuario.
   - Ejemplo: `Fix Login Bug v2` -> `fix-login-bug-v2`.
3. Ejecuta **únicamente** este comando, sustituyendo `<nombre>` por el nombre normalizado:

   ```
   git worktree add .worktrees/<nombre>
   ```
4. Si los argumentos son muy largos, simplifícalo a un nombre significativo.

Restricciones estrictas:

- **No** cambies de directorio (no `cd`, no `workdir` a otra ruta).
- **No** hagas commit ni cambios en el repositorio.
- **No** crees branches adicionales ni pases flags extra a `git worktree add`.
- **No** te muevas al worktree ni edites archivos dentro de él.
- **No** hagas nada adicional. Solo ejecuta el comando de creación del worktree e informa del resultado.
