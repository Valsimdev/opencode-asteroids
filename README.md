# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- **Power-up Velocidad**: al destruir un asteroide hay una probabilidad de que suelte un ítem flotante (orb cian con símbolo "V"). Al recogerlo, la propulsión de la nave se duplica durante 5 segundos, permitiendo moverse el doble de rápido. El ítem no recogido expira a los ~10 segundos. La nave se tiñe de cian y muestra un contador en el HUD mientras el efecto está activo.
- **Estrella fugaz**: asteroide especial dorado con forma de estrella de 5 puntas y estela. Aparece periódicamente cada ~12-18 segundos desde un borde de la pantalla, se mueve 2.5× más rápido que un asteroide normal y desaparece sola a los ~6 segundos (con parpadeo en su último tramo). Daña la nave al chocar como cualquier asteroide. Al destruirla con una bala otorga 200 puntos de bonificación y tiene una alta probabilidad (50%) de soltar un power-up de velocidad. No se parte al ser impactada.
- **Selección de naves**: en el menú se puede elegir entre varias naves con `←` `→`. Cada una tiene su propia silueta y paleta.
- **Nave Morada**: nave gigante color morado, el doble de grande que la nave clásica. Al usarla, todos los puntos obtenidos al destruir asteroides se duplican (indicador `x2` en el HUD). Su mayor tamaño también aumenta el radio de colisión, haciéndola más vulnerable.
